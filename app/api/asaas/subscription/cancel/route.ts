export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { asaas, AsaasApiError } from '@/lib/asaas'

/**
 * POST /api/asaas/subscription/cancel
 *
 * Cancela a assinatura Asaas do usuário autenticado (role MASTER).
 * Rebaixa o planType para FREEMIUM imediatamente.
 */
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  if (session.user.role !== 'MASTER') {
    return Response.json({ error: 'Acesso restrito ao usuário principal' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, asaasSubscriptionId: true, planType: true },
  })

  if (!user) {
    return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  if (!user.asaasSubscriptionId) {
    return Response.json(
      { error: 'Nenhuma assinatura Asaas ativa para cancelar' },
      { status: 400 },
    )
  }

  try {
    await asaas.cancelSubscription(user.asaasSubscriptionId)
  } catch (err) {
    if (err instanceof AsaasApiError) {
      console.error('[cancel] Asaas API error:', err.errors)
      return Response.json(
        { error: 'Erro ao cancelar assinatura no Asaas. Tente novamente.' },
        { status: 502 },
      )
    }
    throw err
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      asaasSubscriptionId: null,
      planType: 'FREEMIUM',
    },
  })

  return Response.json({ message: 'Assinatura cancelada com sucesso.' })
}
