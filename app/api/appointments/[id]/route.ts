
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { AppointmentStatus, ModalityType } from '@prisma/client'
import { NotificationService } from '@/lib/notification-service'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { WhatsAppTriggerService } from '@/lib/whatsapp-trigger'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        userId: userId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Transform the response
    const transformedAppointment = {
      id: appointment.id,
      date: appointment.date,
      patient: {
        name: appointment.client.name,
        phone: appointment.client.phone,
        email: appointment.client.email
      },
      specialty: appointment.specialty || 'Consulta Geral',
      status: appointment.status,
      modality: appointment.modality,
      duration: appointment.duration,
      insurance: appointment.insurance || 'Particular',
      notes: appointment.notes || '',
      professional: appointment.professional || 'Não definido',
      price: appointment.price
    }

    return NextResponse.json(transformedAppointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const {
      date,
      duration,
      status,
      modality,
      specialty,
      insurance,
      professional,
      notes,
      price
    } = body

    // Verify appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        userId: userId
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(duration && { duration: Number(duration) }),
        ...(status && { status: status as AppointmentStatus }),
        ...(modality && { modality: modality as ModalityType }),
        ...(specialty !== undefined && { specialty }),
        ...(insurance !== undefined && { insurance }),
        ...(professional !== undefined && { professional }),
        ...(notes !== undefined && { notes }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null })
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            businessName: true,
            whatsappConfig: {
              select: {
                enabled: true,
                isConnected: true,
                notifyOnCancel: true
              }
            }
          }
        }
      }
    })

    // Criar notificações baseadas na mudança de status
    try {
      const serviceName = updatedAppointment.service?.name || updatedAppointment.specialty || 'Serviço'
      const oldDate = existingAppointment.date
      const newDate = updatedAppointment.date
      
      // Se o status mudou
      if (status && status !== existingAppointment.status) {
        const whatsappConfig = updatedAppointment.user.whatsappConfig
        
        switch (status) {
          case 'CONFIRMED':
            await NotificationService.notifyAppointmentConfirmed(
              userId,
              updatedAppointment.id,
              updatedAppointment.client.name,
              serviceName,
              updatedAppointment.date
            )
            break
            
          case 'CANCELLED':
            await NotificationService.notifyAppointmentCancelled(
              userId,
              updatedAppointment.id,
              updatedAppointment.client.name,
              serviceName,
              updatedAppointment.date
            )
            // Enviar notificação via WhatsApp (usando novo sistema)
            await WhatsAppTriggerService.onAppointmentCancelled(
              updatedAppointment as any,
              serviceName,
              updatedAppointment.professional || undefined
            )
            break
            
          case 'COMPLETED':
            await NotificationService.notifyAppointmentCompleted(
              userId,
              updatedAppointment.id,
              updatedAppointment.client.name,
              serviceName,
              updatedAppointment.date
            )
            break
        }
      }
      
      // Se a data mudou (reagendamento)
      if (date && oldDate.getTime() !== newDate.getTime()) {
        await NotificationService.notifyAppointmentRescheduled(
          userId,
          updatedAppointment.id,
          updatedAppointment.client.name,
          serviceName,
          oldDate,
          newDate
        )
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error)
      // Não falhar a atualização se houver erro nas notificações
    }

    // Transform the response
    const transformedAppointment = {
      id: updatedAppointment.id,
      date: updatedAppointment.date,
      patient: {
        name: updatedAppointment.client.name,
        phone: updatedAppointment.client.phone,
        email: updatedAppointment.client.email
      },
      specialty: updatedAppointment.specialty || 'Consulta Geral',
      status: updatedAppointment.status,
      modality: updatedAppointment.modality,
      duration: updatedAppointment.duration,
      insurance: updatedAppointment.insurance || 'Particular',
      notes: updatedAppointment.notes || '',
      professional: updatedAppointment.professional || 'Não definido',
      price: updatedAppointment.price
    }

    return NextResponse.json(transformedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Verify appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        userId: userId
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
