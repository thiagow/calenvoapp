
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Buscar estatísticas de clientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Início do mês
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // Buscar estatísticas em paralelo
    const [
      totalClients,
      newClientsThisMonth,
      clients
    ] = await Promise.all([
      // Total de clientes
      prisma.client.count({
        where: {
          userId
        }
      }),

      // Novos clientes este mês
      prisma.client.count({
        where: {
          userId,
          createdAt: {
            gte: monthStart
          }
        }
      }),

      // Buscar todos os clientes com contagem de agendamentos
      prisma.client.findMany({
        where: {
          userId
        },
        include: {
          _count: {
            select: {
              appointments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    // Calcular total de agendamentos
    const totalAppointments = clients.reduce((sum, client) => sum + client._count.appointments, 0)

    return NextResponse.json({
      stats: {
        totalClients,
        newClientsThisMonth,
        totalAppointments
      },
      clients: clients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        cpf: client.cpf,
        birthDate: client.birthDate,
        address: client.address,
        notes: client.notes,
        createdAt: client.createdAt,
        appointmentsCount: client._count.appointments
      }))
    })
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
