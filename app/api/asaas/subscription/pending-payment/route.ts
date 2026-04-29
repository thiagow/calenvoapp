export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { asaas, AsaasApiError } from '@/lib/asaas'

/**
 * GET /api/asaas/subscription/pending-payment
 *
 * Retorna o pagamento pendente mais recente da assinatura do usuário,
 * incluindo QR Code PIX quando disponível.
 *
 * Retorna null se o usuário não tiver assinatura ativa ou pagamento pendente.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }
  if (session.user.role !== 'MASTER') {
    return Response.json({ error: 'Acesso restrito ao usuário principal' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, asaasSubscriptionId: true },
  })

  if (!user || !user.asaasSubscriptionId) {
    return Response.json(null)
  }

  try {
    const payments = await asaas.getPaymentsBySubscription(user.asaasSubscriptionId)

    const pending = payments.data.find(p =>
      ['PENDING', 'OVERDUE', 'AWAITING_RISK_ANALYSIS'].includes(p.status),
    )

    if (!pending) {
      return Response.json(null)
    }

    const result: Record<string, unknown> = {
      paymentId: pending.id,
      invoiceUrl: pending.invoiceUrl ?? null,
      billingType: pending.billingType,
      value: pending.value,
      dueDate: pending.dueDate,
      status: pending.status,
      pixPayload: null,
      pixEncodedImage: null,
    }

    if (pending.billingType === 'PIX') {
      try {
        const qr = await asaas.getPixQrCode(pending.id)
        result.pixPayload = qr.payload
        result.pixEncodedImage = qr.encodedImage
      } catch {
        // QR Code ainda não disponível — retornar sem ele
      }
    }

    return Response.json(result)
  } catch (err) {
    if (err instanceof AsaasApiError) {
      console.error('[pending-payment] Asaas API error:', err.errors)
      return Response.json(
        { error: 'Não foi possível verificar o pagamento pendente' },
        { status: 502 },
      )
    }
    console.error('[pending-payment] Unexpected error:', err)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
