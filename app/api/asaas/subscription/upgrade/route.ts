export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { asaas, AsaasApiError, AsaasBillingType, AsaasCreditCard, AsaasCreditCardHolderInfo } from '@/lib/asaas'
import { PLAN_CONFIGS } from '@/lib/types'
import { PlanType } from '@prisma/client'

const ALLOWED_PLANS: PlanType[] = ['STANDARD', 'PREMIUM']
const ALLOWED_BILLING_TYPES: AsaasBillingType[] = ['PIX', 'CREDIT_CARD']

/**
 * POST /api/asaas/subscription/upgrade
 *
 * Faz upgrade (ou troca) de plano via Asaas para o usuário autenticado (MASTER).
 *
 * Body esperado:
 * {
 *   planKey: 'STANDARD' | 'PREMIUM',
 *   billingType: 'PIX' | 'CREDIT_CARD',
 *   creditCard?: { holderName, number, expiryMonth, expiryYear, ccv },
 *   creditCardHolderInfo?: { name, email, cpfCnpj, postalCode, addressNumber, phone }
 * }
 *
 * Retorno para PIX: { message, pixPayload, pixEncodedImage, subscriptionId }
 * Retorno para cartão: { message, subscriptionId }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }
  if (session.user.role !== 'MASTER') {
    return Response.json({ error: 'Acesso restrito ao usuário principal' }, { status: 403 })
  }

  // ─── Validar body ─────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  const planKey = body.planKey as string
  const billingType = body.billingType as string

  if (!planKey || !ALLOWED_PLANS.includes(planKey as PlanType)) {
    return Response.json(
      { error: 'planKey inválido. Use STANDARD ou PREMIUM.' },
      { status: 400 },
    )
  }
  if (!billingType || !ALLOWED_BILLING_TYPES.includes(billingType as AsaasBillingType)) {
    return Response.json(
      { error: 'billingType inválido. Use PIX ou CREDIT_CARD.' },
      { status: 400 },
    )
  }

  const planConfig = PLAN_CONFIGS[planKey as PlanType]
  if (!planConfig || planConfig.price <= 0) {
    return Response.json({ error: 'Plano não disponível para upgrade via Asaas' }, { status: 400 })
  }

  // ─── Buscar user com dados Asaas ─────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      planType: true,
      asaasCustomerId: true,
      asaasSubscriptionId: true,
    },
  })

  if (!user) {
    return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  try {
    // ─── Criar customer Asaas se ainda não existir ────────────────────────
    let customerId = user.asaasCustomerId

    if (!customerId) {
      const cpfCnpj = (body.cpfCnpj as string | undefined) ?? ''
      if (!cpfCnpj || !/^\d{11}$|^\d{14}$/.test(cpfCnpj)) {
        return Response.json(
          { error: 'CPF/CNPJ obrigatório para criar assinatura (11 ou 14 dígitos numéricos)' },
          { status: 400 },
        )
      }

      const customer = await asaas.createCustomer({
        name: user.name ?? user.email,
        email: user.email,
        phone: user.phone ?? undefined,
        cpfCnpj,
        externalReference: user.id,
        notificationDisabled: false,
      })
      customerId = customer.id

      await prisma.user.update({
        where: { id: user.id },
        data: { asaasCustomerId: customerId },
      })
    }

    // ─── Cancelar assinatura anterior se existir ──────────────────────────
    if (user.asaasSubscriptionId) {
      try {
        await asaas.cancelSubscription(user.asaasSubscriptionId)
      } catch {
        // Ignorar erro de cancelamento (assinatura pode já estar inativa)
      }
    }

    // ─── Calcular próxima data de vencimento (amanhã) ─────────────────────
    const nextDueDateObj = new Date()
    nextDueDateObj.setDate(nextDueDateObj.getDate() + 1)
    const nextDueDate = nextDueDateObj.toISOString().split('T')[0]

    // ─── Criar nova assinatura ────────────────────────────────────────────
    const subscriptionPayload = {
      customer: customerId,
      billingType: billingType as AsaasBillingType,
      value: planConfig.price,
      nextDueDate,
      cycle: 'MONTHLY' as const,
      description: `Plano ${planConfig.name} — Calenvo`,
      externalReference: user.id,
      ...(billingType === 'CREDIT_CARD' && body.creditCard
        ? {
            creditCard: body.creditCard as AsaasCreditCard,
            creditCardHolderInfo: body.creditCardHolderInfo as AsaasCreditCardHolderInfo,
          }
        : {}),
    }

    const subscription = await asaas.createSubscription(subscriptionPayload)

    // ─── Persistir dados da nova assinatura ───────────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data: {
        asaasSubscriptionId: subscription.id,
        planType: planKey as PlanType,
        // Cartão confirma imediatamente; PIX só ativa via webhook
        isActive: billingType === 'CREDIT_CARD' ? true : undefined,
      },
    })

    // ─── PIX: buscar QR Code do primeiro pagamento ────────────────────────
    if (billingType === 'PIX') {
      const payments = await asaas.getPaymentsBySubscription(subscription.id)
      const pendingPayment = payments.data.find(p =>
        ['PENDING', 'AWAITING_RISK_ANALYSIS'].includes(p.status),
      )

      if (pendingPayment) {
        try {
          const qrCode = await asaas.getPixQrCode(pendingPayment.id)
          return Response.json({
            message: 'Assinatura criada. Escaneie o QR Code para ativar.',
            subscriptionId: subscription.id,
            pixPayload: qrCode.payload,
            pixEncodedImage: qrCode.encodedImage,
            invoiceUrl: pendingPayment.invoiceUrl,
          })
        } catch {
          // QR Code ainda não disponível (geração assíncrona no Asaas)
          return Response.json({
            message: 'Assinatura criada. O QR Code PIX estará disponível em instantes.',
            subscriptionId: subscription.id,
            invoiceUrl: pendingPayment.invoiceUrl,
          })
        }
      }
    }

    return Response.json({
      message: 'Upgrade realizado com sucesso!',
      subscriptionId: subscription.id,
    })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      console.error('[upgrade] Asaas API error:', err.errors)
      return Response.json(
        { error: err.message },
        { status: 502 },
      )
    }
    console.error('[upgrade] Unexpected error:', err)
    return Response.json({ error: 'Erro interno ao processar upgrade' }, { status: 500 })
  }
}
