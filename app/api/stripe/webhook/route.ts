import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail, sendPaymentFailedEmail } from '@/lib/email-templates'
import { getTemporaryData, deleteTemporaryData, type TemporaryData } from '@/lib/temporary-storage'
import { SegmentType } from '@prisma/client'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('❌ Assinatura do webhook ausente')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // Validar assinatura do webhook
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('❌ Erro ao validar webhook:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log(`🔔 Webhook recebido: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        console.log('✅ Assinatura criada:', event.data.object.id)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        console.log('✅ Pagamento de fatura bem-sucedido:', event.data.object.id)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`ℹ️ Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error(`❌ Erro ao processar webhook ${event.type}:`, error)
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Checkout Session Completed:', session.id)

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  // Buscar dados temporários
  const tempData = getTemporaryData(session.id)
  
  if (!tempData) {
    console.error('❌ Dados temporários não encontrados para session:', session.id)
    // Tentar recuperar do metadata
    if (!session.metadata?.email) {
      throw new Error('Dados do usuário não encontrados')
    }
  }

  const userData: TemporaryData = tempData || {
    email: session.metadata!.email,
    password: '', // Será necessário redefinir senha se não houver tempData
    name: session.metadata!.name,
    businessName: session.metadata!.businessName,
    segmentType: session.metadata!.segmentType as SegmentType,
    phone: session.metadata!.phone,
    customerId,
    timestamp: Date.now(),
  }

  // Verificar se o usuário já existe (idempotência)
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        {
          AND: [
            { email: userData.email },
            { role: 'MASTER' }
          ]
        },
        {
          stripeCustomerId: customerId
        }
      ]
    }
  })

  if (existingUser) {
    console.log('ℹ️ Usuário já existe, atualizando dados do Stripe...')
    
    // Atualizar dados do Stripe se necessário
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        stripeCustomerId: customerId,
        planType: 'STANDARD',
      }
    })

    // Limpar dados temporários
    deleteTemporaryData(session.id)
    return
  }

  // Criar usuário MASTER
  console.log('👤 Criando usuário MASTER...')
  
  const hashedPassword = await bcrypt.hash(userData.password || 'temp_password_12345', 12)

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      businessName: userData.businessName,
      segmentType: userData.segmentType,
      phone: userData.phone,
      planType: 'STANDARD',
      role: 'MASTER',
      stripeCustomerId: customerId,
    }
  })

  console.log('✅ Usuário MASTER criado:', user.id)

  // Criar profissional master
  console.log('👥 Criando profissional master...')
  
  const professional = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      businessName: userData.businessName,
      segmentType: userData.segmentType,
      phone: userData.phone,
      whatsapp: userData.phone,
      role: 'PROFESSIONAL',
      masterId: user.id,
      isActive: true,
      planType: 'STANDARD',
    }
  })

  console.log('✅ Profissional master criado:', professional.id)

  // Criar configuração de negócio
  console.log('⚙️ Criando BusinessConfig...')
  
  await prisma.businessConfig.create({
    data: {
      userId: user.id,
      workingDays: [1, 2, 3, 4, 5], // Segunda a sexta
      startTime: '08:00',
      endTime: '18:00',
      defaultDuration: 30,
      lunchStart: '12:00',
      lunchEnd: '13:00',
      multipleServices: false,
      requiresDeposit: false,
      cancellationHours: 24
    }
  })

  console.log('✅ BusinessConfig criada')

  // Enviar email de boas-vindas
  console.log('📧 Enviando email de boas-vindas...')
  
  await sendWelcomeEmail({
    name: userData.name,
    email: userData.email,
    planName: 'Standard',
    planPrice: 'R$ 49,90',
  })

  // Limpar dados temporários
  deleteTemporaryData(session.id)

  console.log('✅ Processo de criação de usuário concluído com sucesso!')
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  console.log('🔄 Assinatura atualizada:', subscription.id, 'Status:', subscription.status)

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  })

  if (!user) {
    console.error('❌ Usuário não encontrado para customer:', customerId)
    return
  }

  // Atualizar status do plano baseado no status da assinatura
  if (subscription.status === 'active') {
    await prisma.user.update({
      where: { id: user.id },
      data: { planType: 'STANDARD' }
    })
    console.log('✅ Plano do usuário atualizado para STANDARD')
  } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { planType: 'FREEMIUM' }
    })
    console.log('⚠️ Plano do usuário revertido para FREEMIUM')
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  console.log('❌ Assinatura cancelada:', subscription.id)

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  })

  if (!user) {
    console.error('❌ Usuário não encontrado para customer:', customerId)
    return
  }

  // Reverter para plano gratuito
  await prisma.user.update({
    where: { id: user.id },
    data: { planType: 'FREEMIUM' }
  })

  console.log('✅ Usuário revertido para plano FREEMIUM')
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  console.log('❌ Pagamento falhou para invoice:', invoice.id)

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  })

  if (!user) {
    console.error('❌ Usuário não encontrado para customer:', customerId)
    return
  }

  // Enviar email de falha no pagamento
  await sendPaymentFailedEmail({
    name: user.name || 'Usuário',
    email: user.email,
  })

  console.log('📧 Email de falha no pagamento enviado para:', user.email)
}
