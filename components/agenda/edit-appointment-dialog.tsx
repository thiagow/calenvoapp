
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Loader2, AlertCircle } from 'lucide-react'
import { AppointmentStatus, ModalityType } from '@prisma/client'
import { STATUS_LABELS, STATUS_COLORS, MODALITY_LABELS } from '@/lib/types'
import toast from 'react-hot-toast'

interface EditAppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  onUpdate: (id: string, data: any) => Promise<void>
}

const STATUS_OPTIONS: AppointmentStatus[] = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
]

const MODALITY_OPTIONS: ModalityType[] = ['PRESENCIAL', 'TELECONSULTA']

export function EditAppointmentDialog({
  isOpen,
  onClose,
  appointment,
  onUpdate
}: EditAppointmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [professionalName, setProfessionalName] = useState<string>('')
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 30,
    status: 'SCHEDULED' as AppointmentStatus,
    modality: 'PRESENCIAL' as ModalityType,
    specialty: '',
    professional: '',
    notes: '',
    price: ''
  })

  useEffect(() => {
    if (appointment) {
      const appointmentDate = new Date(appointment.date)
      const dateStr = appointmentDate.toISOString().split('T')[0]
      const timeStr = appointmentDate.toTimeString().slice(0, 5)

      setFormData({
        date: dateStr,
        time: timeStr,
        duration: appointment.duration || 30,
        status: appointment.status || 'SCHEDULED',
        modality: appointment.modality || 'PRESENCIAL',
        specialty: appointment.specialty || '',
        professional: appointment.professional || '',
        notes: appointment.notes || '',
        price: appointment.price ? appointment.price.toString() : ''
      })
      
      // Buscar nome do profissional se houver professionalId
      const fetchProfessionalName = async () => {
        if (appointment.professionalId) {
          try {
            const response = await fetch(`/api/professionals/${appointment.professionalId}`)
            if (response.ok) {
              const prof = await response.json()
              setProfessionalName(prof.name)
            }
          } catch (error) {
            console.error('Error fetching professional:', error)
          }
        } else if (appointment.professional) {
          // Usar o campo legado se não houver professionalId
          setProfessionalName(appointment.professional)
        } else {
          // Buscar o usuário master (dono da conta)
          try {
            const response = await fetch(`/api/user/profile`)
            if (response.ok) {
              const user = await response.json()
              setProfessionalName(user.name)
            }
          } catch (error) {
            console.error('Error fetching user profile:', error)
            setProfessionalName('Profissional não definido')
          }
        }
      }
      
      fetchProfessionalName()
    }
  }, [appointment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.date || !formData.time) {
      toast.error('Data e hora são obrigatórios')
      return
    }

    setLoading(true)

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`)
      
      const updateData: any = {
        date: dateTime.toISOString(),
        duration: Number(formData.duration),
        status: formData.status,
        modality: formData.modality,
        specialty: formData.specialty || null,
        professional: formData.professional || null,
        notes: formData.notes || null,
        price: formData.price ? parseFloat(formData.price) : null
      }

      await onUpdate(appointment.id, updateData)
      toast.success('Agendamento atualizado com sucesso!')
      onClose()
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Erro ao atualizar agendamento')
    } finally {
      setLoading(false)
    }
  }

  if (!appointment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Calendar className="mr-2 h-5 w-5 text-blue-600" />
            Editar Agendamento
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do agendamento de {appointment.patient.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Info - Read Only */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Paciente:</span>
              <span className="text-blue-700">{appointment.patient.name}</span>
            </div>
            {appointment.patient.phone && (
              <div className="text-sm text-blue-600 ml-6 mt-1">
                {appointment.patient.phone}
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                Hora *
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
            />
          </div>

          {/* Status and Modality */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as AppointmentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      <Badge className={STATUS_COLORS[status]}>
                        {STATUS_LABELS[status]}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modality">Modalidade</Label>
              <Select
                value={formData.modality}
                onValueChange={(value) => setFormData({ ...formData, modality: value as ModalityType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODALITY_OPTIONS.map((modality) => (
                    <SelectItem key={modality} value={modality}>
                      {MODALITY_LABELS[modality]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service and Professional */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Serviço</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="Ex: Consulta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professionalName">Profissional</Label>
              <Input
                id="professionalName"
                value={professionalName}
                readOnly
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Valor (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais sobre a consulta..."
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
