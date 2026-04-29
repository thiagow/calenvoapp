export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/asaas/webhook
 *
 * Recebe eventos do Asaas e atualiza o estado da assinatura do usuário.
 * Implementa idempotência via AsaasWebhookLog para garantir que cada
 * evento seja processado exatamente uma vez.
 *
 * Segurança: valida o header `asaas-access-token` contra a variável
 * de ambiente ASAAS_WEBHOOK_TOKEN.
 */
export async function POST(req: NextRequest) {
  // ─── 1. Ler body ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ received: true })
  }

  const event = body.event as string | undefined
  const payment = body.payment as Record<string, unknown> | undefined

  if (!event || !payment) {
    return Response.json({ received: true })
  }

  // ─── 2. Validar token de autenticação do webhook ──────────────────────────
  const token = req.headers.get('asaas-access-token')
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN

  if (!expectedToken || token !== expectedToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const paymentId = (payment.id as string) ?? null

  // ─── 3. Gravar log (antes de processar — para auditoria) ─────────────────
  let logId: string
  try {
    const log = await prisma.asaasWebhookLog.create({
      data: {
        asaasEvent: event,
        paymentId,
        payload: body as object,
        processed: false,
      },
    })
    logId = log.id
  } catch {
    // Se já existe log idêntico e falha a escrita, retornar ok silenciosamente
    return Response.json({ received: true })
  }

  // ─── 4. Verificar idempotência ────────────────────────────────────────────
  if (paymentId) {
    const alreadyProcessed = await prisma.asaasWebhookLog.findFirst({
      where: {
        paymentId,
        asaasEvent: event,
        processed: true,
        id: { not: logId },
      },
    })
    if (alreadyProcessed) {
      // Marcar novo log como descartado (processed = true) para limpeza futura
      await prisma.asaasWebhookLog.update({
        where: { id: logId },
        data: { processed: true },
      })
      return Response.json({ received: true })
    }
  }

  // ─── 5. Encontrar o User ──────────────────────────────────────────────────
  const externalReference = payment.externalReference as string | undefined
  const asaasCustomerId = payment.customer as string | undefined

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(externalReference ? [{ id: externalReference }] : []),
        ...(asaasCustomerId ? [{ asaasCustomerId }] : []),
      ],
      role: 'MASTER',
    },
    select: { id: true, planType: true, asaasSubscriptionId: true },
  })

  if (!user) {
    // Evento legítimo mas sem usuário correspondente — marcar como processado
    await prisma.asaasWebhookLog.update({
      where: { id: logId },
      data: { processed: true },
    })
    return Response.json({ received: true })
  }

  // ─── 6. Processar evento ──────────────────────────────────────────────────
  try {
    await handlePaymentEvent(event, user.id, asaasCustomerId)
  } catch (err) {
    console.error('[Asaas Webhook] Erro ao processar evento:', event, err)
    // Não marcar como processado para permitir reprocessamento
    return Response.json({ received: true }, { status: 200 })
  }

  // ─── 7. Marcar log como processado ───────────────────────────────────────
  await prisma.asaasWebhookLog.update({
    where: { id: logId },
    data: { processed: true },
  })

  return Response.json({ received: true })
}

// ─── Lógica de atualização por tipo de evento ────────────────────────────────

async function handlePaymentEvent(
  event: string,
  userId: string,
  asaasCustomerId?: string,
) {
  switch (event) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED':
      // Pagamento confirmado → ativar conta e promover plano
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          planType: 'STANDARD',
          ...(asaasCustomerId ? { asaasCustomerId } : {}),
        },
      })
      break

    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_CHARGEBACK_REQUESTED':
    case 'PAYMENT_CHARGEBACK_DISPUTE':
      // Pagamento em atraso/chargeback → bloquear acesso
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      })
      break

    case 'PAYMENT_REFUNDED':
    case 'PAYMENT_REFUND_REQUESTED':
      // Estorno → revogar plano
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          planType: 'FREEMIUM',
        },
      })
      break

    case 'PAYMENT_DELETED':
      // Pagamento excluído → limpar assinatura e rebaixar
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true, // Manter acesso no nível freemium
          planType: 'FREEMIUM',
          asaasSubscriptionId: null,
        },
      })
      break

    case 'PAYMENT_PENDING':
    case 'PAYMENT_AWAITING_RISK_ANALYSIS':
      // Informativo: não altera estado, apenas auditoria já garantida via log
      break

    default:
      // Evento desconhecido — ignorar silenciosamente
      break
  }
}
