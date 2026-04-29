export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { asaas, AsaasApiError, AsaasCreditCard, AsaasCreditCardHolderInfo } from '@/lib/asaas'
import { PLAN_CONFIGS } from '@/lib/types'
import { PlanType } from '@prisma/client'

// ─── Constantes de validação ─────────────────────────────────────────────────
const ALLOWED_PLANS: PlanType[] = ['STANDARD', 'PREMIUM']
const ALLOWED_BILLING = ['PIX', 'CREDIT_CARD'] as const

/**
 * POST /api/asaas/signup
 *
 * Cadastro de novo usuário com plano pago via Asaas.
 * Garante atomicidade: se a criação no Asaas falhar, o usuário não é
 * persistido no banco de dados.
 *
 * Para PIX: conta criada com isActive = false, ativada pelo webhook.
 * Para cartão: conta criada com isActive = true (confirmação imediata).
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  // ─── Validação de campos obrigatórios ────────────────────────────────────
  const {
    email,
    password,
    name,
    businessName,
    segmentType,
    phone,
    planKey,
    billingType,
    document,      // CPF (11 dígitos) ou CNPJ (14 dígitos) — sem máscara
    postalCode,    // 8 dígitos numéricos
    address,
    addressNumber,
  } = body as Record<string, string>

  const requiredFields = { email, password, name, businessName, planKey, billingType, document }
  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return Response.json({ error: `Campo obrigatório ausente: ${field}` }, { status: 400 })
    }
  }

  // ─── Validações específicas ──────────────────────────────────────────────
  if (!ALLOWED_PLANS.includes(planKey as PlanType)) {
    return Response.json({ error: 'planKey inválido. Use STANDARD ou PREMIUM.' }, { status: 400 })
  }
  if (!ALLOWED_BILLING.includes(billingType as typeof ALLOWED_BILLING[number])) {
    return Response.json({ error: 'billingType inválido. Use PIX ou CREDIT_CARD.' }, { status: 400 })
  }

  const cleanDocument = document.replace(/\D/g, '')
  if (!/^\d{11}$/.test(cleanDocument) && !/^\d{14}$/.test(cleanDocument)) {
    return Response.json(
      { error: 'CPF (11 dígitos) ou CNPJ (14 dígitos) inválido.' },
      { status: 400 },
    )
  }

  const cleanPostalCode = (postalCode ?? '').replace(/\D/g, '')
  if (cleanPostalCode && !/^\d{8}$/.test(cleanPostalCode)) {
    return Response.json({ error: 'CEP inválido (8 dígitos numéricos).' }, { status: 400 })
  }

  if (billingType === 'CREDIT_CARD' && !body.creditCard) {
    return Response.json(
      { error: 'Dados do cartão de crédito são obrigatórios para este método de pagamento.' },
      { status: 400 },
    )
  }

  const planConfig = PLAN_CONFIGS[planKey as PlanType]
  if (!planConfig || planConfig.price <= 0) {
    return Response.json({ error: 'Plano não elegível para pagamento via Asaas.' }, { status: 400 })
  }

  // ─── Verificar email duplicado (role MASTER) ──────────────────────────────
  const existing = await prisma.user.findUnique({
    where: { email_role: { email: email.toLowerCase().trim(), role: 'MASTER' } },
  })
  if (existing) {
    return Response.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const cleanEmail = email.toLowerCase().trim()
  const cleanName = name.trim()
  const cleanBusiness = businessName.trim()

  // ─── Transação Prisma: criar User + Profissional + BusinessConfig ─────────
  let userId: string
  let professionalId: string

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          name: cleanName,
          businessName: cleanBusiness,
          segmentType: (segmentType ?? 'BEAUTY_SALON') as never,
          phone: phone?.trim() || null,
          planType: planKey as PlanType,
          role: 'MASTER',
          // isActive = false para PIX (pagamento ainda não confirmado)
          // isActive = true para cartão (confirmado na criação)
          isActive: billingType === 'CREDIT_CARD',
        },
      })

      const professional = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          name: cleanName,
          businessName: cleanBusiness,
          segmentType: (segmentType ?? 'BEAUTY_SALON') as never,
          phone: phone?.trim() || null,
          role: 'PROFESSIONAL',
          masterId: user.id,
          isActive: true,
          planType: planKey as PlanType,
        },
      })

      await tx.businessConfig.create({
        data: {
          userId: user.id,
          workingDays: [1, 2, 3, 4, 5],
          startTime: '08:00',
          endTime: '18:00',
          defaultDuration: 30,
          lunchStart: '12:00',
          lunchEnd: '13:00',
          multipleServices: false,
          requiresDeposit: false,
          cancellationHours: 24,
        },
      })

      return { user, professional }
    })

    userId = result.user.id
    professionalId = result.professional.id
  } catch (err) {
    console.error('[asaas/signup] Erro na transação Prisma:', err)
    return Response.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 })
  }

  // ─── Criar Customer + Subscription no Asaas ───────────────────────────────
  // Se falhar: rollback manual (deletar usuário criado acima)
  try {
    // Calcular próxima data de vencimento (amanhã)
    const nextDueDateObj = new Date()
    nextDueDateObj.setDate(nextDueDateObj.getDate() + 1)
    const nextDueDate = nextDueDateObj.toISOString().split('T')[0]

    const customer = await asaas.createCustomer({
      name: cleanName,
      email: cleanEmail,
      phone: phone?.trim() || undefined,
      cpfCnpj: cleanDocument,
      postalCode: cleanPostalCode || undefined,
      address: address?.trim() || undefined,
      addressNumber: addressNumber?.trim() || undefined,
      externalReference: userId,
      notificationDisabled: false,
    })

    const subscription = await asaas.createSubscription({
      customer: customer.id,
      billingType: billingType as 'PIX' | 'CREDIT_CARD',
      value: planConfig.price,
      nextDueDate,
      cycle: 'MONTHLY',
      description: `Plano ${planConfig.name} — Calenvo`,
      externalReference: userId,
      ...(billingType === 'CREDIT_CARD' && body.creditCard
        ? {
            creditCard: body.creditCard as AsaasCreditCard,
            creditCardHolderInfo: body.creditCardHolderInfo as AsaasCreditCardHolderInfo,
          }
        : {}),
    })

    // Salvar IDs Asaas no usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        asaasCustomerId: customer.id,
        asaasSubscriptionId: subscription.id,
      },
    })

    // ─── PIX: buscar QR Code do primeiro pagamento ────────────────────────
    if (billingType === 'PIX') {
      const payments = await asaas.getPaymentsBySubscription(subscription.id)
      const firstPayment = payments.data.find(p =>
        ['PENDING', 'AWAITING_RISK_ANALYSIS'].includes(p.status),
      )

      if (firstPayment) {
        try {
          const qrCode = await asaas.getPixQrCode(firstPayment.id)
          return Response.json(
            {
              message: 'Conta criada! Realize o pagamento PIX para ativar o acesso.',
              userId,
              professionalId,
              pixPayload: qrCode.payload,
              pixEncodedImage: qrCode.encodedImage,
              invoiceUrl: firstPayment.invoiceUrl,
            },
            { status: 201 },
          )
        } catch {
          // QR Code assíncrono — retornar sem ele
          return Response.json(
            {
              message: 'Conta criada! O QR Code PIX será gerado em instantes.',
              userId,
              professionalId,
              invoiceUrl: firstPayment.invoiceUrl ?? null,
            },
            { status: 201 },
          )
        }
      }
    }

    return Response.json(
      {
        message: 'Conta criada com sucesso! Você já pode fazer login.',
        userId,
        professionalId,
      },
      { status: 201 },
    )
  } catch (err) {
    // Rollback: remover usuário criado para manter consistência
    try {
      await prisma.user.deleteMany({ where: { id: userId } })
      await prisma.user.deleteMany({ where: { id: professionalId } })
    } catch (rollbackErr) {
      console.error('[asaas/signup] Rollback falhou:', rollbackErr)
    }

    if (err instanceof AsaasApiError) {
      console.error('[asaas/signup] Asaas API error:', err.errors)
      return Response.json({ error: err.message }, { status: 502 })
    }

    console.error('[asaas/signup] Unexpected error:', err)
    return Response.json({ error: 'Erro ao processar pagamento. Tente novamente.' }, { status: 500 })
  }
}
