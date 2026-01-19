
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { AppointmentStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET - Buscar estatísticas para relatórios
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Total de agendamentos
    const totalAppointments = await prisma.appointment.count({
      where: {
        userId
      }
    })

    // Confirmados
    const confirmedAppointments = await prisma.appointment.count({
      where: {
        userId,
        status: 'CONFIRMED'
      }
    })

    // Cancelados
    const cancelledAppointments = await prisma.appointment.count({
      where: {
        userId,
        status: 'CANCELLED'
      }
    })

    // Faltou (NO_SHOW)
    const noShowAppointments = await prisma.appointment.count({
      where: {
        userId,
        status: 'NO_SHOW'
      }
    })

    // Agendamentos por serviço
    const appointmentsByService = await prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        userId,
        serviceId: {
          not: null
        }
      },
      _count: {
        id: true
      }
    })

    // Buscar nomes dos serviços
    const serviceIds = appointmentsByService.map(item => item.serviceId).filter(id => id !== null) as string[]
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    const serviceMap = new Map(services.map(s => [s.id, s.name]))

    const servicesStats = appointmentsByService.map(item => ({
      serviceName: item.serviceId ? serviceMap.get(item.serviceId) || 'Serviço Desconhecido' : 'Não especificado',
      count: item._count.id,
      percentage: totalAppointments > 0 ? Math.round((item._count.id / totalAppointments) * 100) : 0
    }))

    // Evolução mensal (últimos 6 meses)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyData = await prisma.appointment.groupBy({
      by: ['date'],
      where: {
        userId,
        date: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        id: true
      }
    })

    // Agrupar por mês
    const monthlyStats = new Map<string, number>()
    monthlyData.forEach(item => {
      const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`
      monthlyStats.set(monthKey, (monthlyStats.get(monthKey) || 0) + item._count.id)
    })

    // Gerar últimos 6 meses com dados
    const evolutionData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const count = monthlyStats.get(monthKey) || 0
      
      evolutionData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'long' }),
        appointments: count
      })
    }

    return NextResponse.json({
      mainStats: {
        total: totalAppointments,
        confirmed: confirmedAppointments,
        cancelled: cancelledAppointments,
        noShow: noShowAppointments
      },
      servicesStats: servicesStats.sort((a, b) => b.count - a.count).slice(0, 5), // Top 5
      evolutionData
    })
  } catch (error) {
    console.error('Error fetching report stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
