
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Phone, Mail, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useSegmentConfig } from '@/contexts/segment-context'

interface NewAppointmentForm {
  scheduleId: string
  serviceId: string
  professionalId: string
  patientName: string
  patientEmail: string
  patientPhone: string
  patientCpf: string
  date: string
  time: string
  specialty: string
  professional: string
  appointmentType: 'presencial' | 'teleconsulta'
  insuranceType: 'convenio' | 'particular'
  insuranceName: string
  duration: string
  notes: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { config: segmentConfig, isLoading: segmentLoading } = useSegmentConfig()
  const [loading, setLoading] = useState(false)
  const [schedules, setSchedules] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [availableServices, setAvailableServices] = useState<any[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableProfessionals, setAvailableProfessionals] = useState<any[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [userPlan, setUserPlan] = useState<string>('FREEMIUM')
  const [allowsMultipleProfessionals, setAllowsMultipleProfessionals] = useState(false)
  const [formData, setFormData] = useState<NewAppointmentForm>({
    scheduleId: '',
    serviceId: '',
    professionalId: '',
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientCpf: '',
    date: '',
    time: '',
    specialty: '',
    professional: '',
    appointmentType: 'presencial',
    insuranceType: 'particular',
    insuranceName: '',
    duration: '30',
    notes: ''
  })

  // Verificar autenticação e buscar dados
  useEffect(() => {
    if (status === 'loading') return // Ainda carregando

    if (status === 'unauthenticated') {
      console.log('🔒 Usuário não autenticado, redirecionando para login')
      router.push('/login')
      return
    }

    console.log('✅ Usuário autenticado:', session?.user?.email)
    
    // Buscar dados iniciais
    fetchUserPlan()
    fetchSchedulesAndServices()
    fetchProfessionals()
  }, [status, session, router])

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/user/plan')
      if (response.ok) {
        const data = await response.json()
        setUserPlan(data.planType)
        
        // Verificar se o plano permite múltiplos profissionais
        const allowsMultiple = data.planType === 'STANDARD' || data.planType === 'PREMIUM'
        setAllowsMultipleProfessionals(allowsMultiple)
      }
    } catch (error) {
      console.error('Error fetching user plan:', error)
    }
  }

  const fetchSchedulesAndServices = async () => {
    try {
      // Buscar agendas ativas
      const schedulesRes = await fetch('/api/schedules')
      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json()
        setSchedules(schedulesData.filter((s: any) => s.isActive))
      }

      // Buscar todos os serviços ativos
      const servicesRes = await fetch('/api/services')
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData.filter((s: any) => s.isActive))
      }
    } catch (error) {
      console.error('Error fetching schedules and services:', error)
    }
  }

  const fetchProfessionals = async () => {
    try {
      const response = await fetch('/api/professionals')
      if (response.ok) {
        const data = await response.json()
        setProfessionals(data.filter((p: any) => p.isActive))
      }
    } catch (error) {
      console.error('Error fetching professionals:', error)
    }
  }

  // Atualizar serviços e profissionais disponíveis quando agenda for selecionada
  useEffect(() => {
    if (formData.scheduleId) {
      const schedule = schedules.find(s => s.id === formData.scheduleId)
      setSelectedSchedule(schedule)
      
      if (schedule && schedule.services) {
        // Filtrar apenas serviços vinculados a esta agenda
        const scheduleServiceIds = schedule.services.map((ss: any) => ss.serviceId)
        const filtered = services.filter(s => scheduleServiceIds.includes(s.id))
        setAvailableServices(filtered)
        
        // Auto-selecionar duração do serviço se houver apenas um
        if (filtered.length === 1) {
          setFormData(prev => ({
            ...prev,
            serviceId: filtered[0].id,
            duration: filtered[0].duration.toString()
          }))
        } else {
          // Limpar seleção de serviço se mudar de agenda
          setFormData(prev => ({
            ...prev,
            serviceId: '',
            duration: schedule.slotDuration?.toString() || '30'
          }))
        }
      } else {
        setAvailableServices([])
        setFormData(prev => ({ ...prev, serviceId: '', duration: '30' }))
      }
      
      // Filtrar profissionais vinculados a esta agenda
      if (allowsMultipleProfessionals && schedule && schedule.professionals) {
        const scheduleProfessionalIds = schedule.professionals.map((sp: any) => sp.professionalId)
        const filtered = professionals.filter(p => scheduleProfessionalIds.includes(p.id))
        setAvailableProfessionals(filtered)
        
        // Limpar seleção de profissional se mudar de agenda
        setFormData(prev => ({
          ...prev,
          professionalId: ''
        }))
      } else {
        setAvailableProfessionals([])
      }
      
      // Limpar horários disponíveis
      setAvailableTimeSlots([])
      setFormData(prev => ({ ...prev, time: '' }))
    } else {
      setAvailableServices([])
      setAvailableProfessionals([])
      setAvailableTimeSlots([])
      setSelectedSchedule(null)
    }
  }, [formData.scheduleId, schedules, services, professionals, allowsMultipleProfessionals])
  
  // Buscar horários disponíveis quando data, agenda, serviço ou profissional mudarem
  useEffect(() => {
    if (formData.scheduleId && formData.date && formData.serviceId) {
      fetchAvailableSlots()
    } else {
      setAvailableTimeSlots([])
    }
  }, [formData.scheduleId, formData.date, formData.serviceId, formData.professionalId])
  
  const fetchAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const params = new URLSearchParams({
        scheduleId: formData.scheduleId,
        date: formData.date,
        serviceId: formData.serviceId // NOVO: Passar o serviço selecionado
      })
      
      if (formData.professionalId) {
        params.append('professionalId', formData.professionalId)
      }
      
      const response = await fetch(`/api/appointments/available-slots?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableTimeSlots(data.slots || [])
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao carregar horários disponíveis')
        setAvailableTimeSlots([])
      }
    } catch (error) {
      console.error('Error fetching available slots:', error)
      toast.error('Erro ao carregar horários disponíveis')
      setAvailableTimeSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Atualizar duração automaticamente quando serviço for selecionado
  useEffect(() => {
    if (formData.serviceId) {
      const service = services.find(s => s.id === formData.serviceId)
      if (service) {
        setFormData(prev => ({
          ...prev,
          duration: service.duration.toString(), // Duração automática do serviço
          specialty: service.name // Manter compatibilidade
        }))
      }
    }
  }, [formData.serviceId, services])

  const handleInputChange = (field: keyof NewAppointmentForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    console.log('🚀 Iniciando criação de agendamento...')
    console.log('📝 Dados do formulário:', formData)

    try {
      // Validações básicas
      if (!formData.scheduleId) {
        toast.error('Por favor, selecione uma agenda')
        setLoading(false)
        return
      }

      if (!formData.serviceId) {
        toast.error('Por favor, selecione um serviço')
        setLoading(false)
        return
      }

      if (!formData.patientName || !formData.patientPhone || !formData.date || !formData.time) {
        console.log('❌ Validação falhou - campos obrigatórios em falta')
        toast.error('Por favor, preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }
      
      console.log('✅ Validação inicial passou')

      // Primeiro, criar o cliente se não existir
      console.log('👤 Criando cliente...')
      const clientResponse = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.patientName,
          email: formData.patientEmail || null,
          phone: formData.patientPhone, // Required field
          cpf: formData.patientCpf || null,
        }),
      })

      console.log('📞 Resposta da API de clientes:', clientResponse.status, clientResponse.statusText)

      if (!clientResponse.ok) {
        const errorData = await clientResponse.json()
        console.log('❌ Erro na criação do cliente:', errorData)
        throw new Error(errorData.error || 'Erro ao criar cliente')
      }

      const client = await clientResponse.json()
      console.log('✅ Cliente criado/encontrado:', client)

      // Combinar data e hora
      const appointmentDateTime = new Date(`${formData.date}T${formData.time}:00`)
      console.log('📅 Data/hora do agendamento:', appointmentDateTime)

      // Criar o agendamento
      const appointmentData = {
        clientId: client.id,
        scheduleId: formData.scheduleId,
        serviceId: formData.serviceId,
        professionalId: formData.professionalId || null,
        date: appointmentDateTime.toISOString(),
        duration: parseInt(formData.duration),
        status: 'SCHEDULED',
        modality: formData.appointmentType === 'presencial' ? 'PRESENCIAL' : 'TELECONSULTA',
        specialty: formData.specialty || null, // Manter compatibilidade
        professional: formData.professional || null,
        insurance: formData.insuranceType === 'convenio' ? formData.insuranceName : 'Particular',
        notes: formData.notes || null,
      }
      
      console.log('📋 Dados do agendamento a ser criado:', appointmentData)
      
      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      console.log('📞 Resposta da API de agendamentos:', appointmentResponse.status, appointmentResponse.statusText)

      if (!appointmentResponse.ok) {
        const errorData = await appointmentResponse.json()
        console.log('❌ Erro na criação do agendamento:', errorData)
        throw new Error(errorData.error || 'Erro ao criar agendamento')
      }

      const newAppointment = await appointmentResponse.json()
      console.log('✅ Agendamento criado com sucesso:', newAppointment)
      
      toast.success('Agendamento criado com sucesso!')
      console.log('🔄 Redirecionando para agenda...')
      router.push('/dashboard/agenda')
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar agendamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Tela de carregamento durante verificação de autenticação
  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Verificando autenticação...</span>
        </div>
      </div>
    )
  }

  // Não renderizar nada se não estiver autenticado (já estará redirecionando)
  if (status === 'unauthenticated') {
    return null
  }

  // Terminologia dinâmica
  const t = segmentConfig.terminology
  const fields = segmentConfig.fields
  const placeholders = segmentConfig.placeholders

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="self-start"
        >
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t.appointment === 'Consulta' ? 'Nova Consulta' : `Novo ${t.appointment}`}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Preencha os dados para criar {t.appointment === 'Consulta' ? 'uma nova consulta' : `um novo ${t.appointment.toLowerCase()}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Agenda e Serviço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Selecione {t.schedule} e {t.service}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Escolha {t.schedule.toLowerCase()} e o {t.service.toLowerCase()} para este {t.appointment.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="scheduleId">{t.schedule} *</Label>
              <Select 
                value={formData.scheduleId} 
                onValueChange={(value) => handleInputChange('scheduleId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a agenda" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.length === 0 ? (
                    <SelectItem value="no-schedules" disabled>
                      Nenhuma agenda disponível
                    </SelectItem>
                  ) : (
                    schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: schedule.color }}
                          />
                          {schedule.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {schedules.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Você precisa criar uma agenda primeiro
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="serviceId">{t.service} *</Label>
              <Select 
                value={formData.serviceId} 
                onValueChange={(value) => handleInputChange('serviceId', value)}
                disabled={!formData.scheduleId || availableServices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.scheduleId 
                      ? `Selecione ${t.schedule.toLowerCase()} primeiro`
                      : availableServices.length === 0
                      ? `Nenhum ${t.service.toLowerCase()} vinculado`
                      : `Selecione o ${t.service.toLowerCase()}`
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration}min)
                      {service.price && ` - R$ ${service.price.toFixed(2)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.scheduleId && availableServices.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhum serviço vinculado a esta agenda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Paciente/Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Dados {t.client === 'Paciente' ? 'do' : 'do'} {t.client}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Informações pessoais e de contato {t.client === 'Paciente' ? 'do paciente' : `do ${t.client.toLowerCase()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="patientName">Nome Completo *</Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder={placeholders.clientName}
                required
              />
            </div>
            <div>
              <Label htmlFor="patientEmail">E-mail</Label>
              <Input
                id="patientEmail"
                type="email"
                value={formData.patientEmail}
                onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="patientPhone">Telefone *</Label>
              <Input
                id="patientPhone"
                value={formData.patientPhone}
                onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                placeholder={placeholders.clientPhone}
                required
              />
            </div>
            <div>
              <Label htmlFor="patientCpf">CPF</Label>
              <Input
                id="patientCpf"
                value={formData.patientCpf}
                onChange={(e) => handleInputChange('patientCpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações do Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dados {t.appointment === 'Consulta' ? 'da Consulta' : `do ${t.appointment}`}
            </CardTitle>
            <CardDescription>
              Defina data, horário e {t.professional.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data {t.appointment === 'Consulta' ? 'da Consulta' : `do ${t.appointment}`} *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            {allowsMultipleProfessionals && availableProfessionals.length > 0 && (
              <div>
                <Label htmlFor="professionalId">{t.professional} {availableProfessionals.length > 0 ? '*' : ''}</Label>
                <Select 
                  value={formData.professionalId} 
                  onValueChange={(value) => handleInputChange('professionalId', value)}
                  disabled={!formData.scheduleId || availableProfessionals.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.scheduleId 
                        ? `Selecione ${t.schedule.toLowerCase()} primeiro`
                        : availableProfessionals.length === 0
                        ? `Nenhum ${t.professional.toLowerCase()} vinculado`
                        : `Selecione o ${t.professional.toLowerCase()}`
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfessionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.scheduleId && availableProfessionals.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Nenhum {t.professional.toLowerCase()} vinculado a esta agenda
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="time">Horário *</Label>
              {loadingSlots ? (
                <div className="flex items-center justify-center h-10 border rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Carregando horários...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select 
                    value={formData.time} 
                    onValueChange={(value) => handleInputChange('time', value)}
                    disabled={!formData.date || !formData.serviceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.date 
                          ? "Selecione uma data primeiro"
                          : !formData.serviceId
                          ? "Selecione um serviço primeiro"
                          : availableTimeSlots.length === 0
                          ? "Nenhum horário disponível"
                          : "Selecione o horário"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots
                        .filter((slot: any) => slot.available)
                        .map((slot: any) => (
                          <SelectItem key={slot.time} value={slot.time}>
                            {slot.time}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {!formData.date && (
                    <p className="text-xs text-gray-500">
                      Selecione uma data para ver os horários disponíveis
                    </p>
                  )}
                  
                  {formData.date && !formData.serviceId && (
                    <p className="text-xs text-amber-600">
                      Selecione um serviço para ver os horários disponíveis
                    </p>
                  )}
                  
                  {formData.date && formData.serviceId && availableTimeSlots.length > 0 && availableTimeSlots.filter((s: any) => s.available).length === 0 && (
                    <p className="text-xs text-amber-600">
                      Não há horários disponíveis nesta data
                    </p>
                  )}
                </div>
              )}
            </div>
            {fields.showModality && (
              <div>
                <Label htmlFor="appointmentType">Modalidade</Label>
                <Select 
                  value={formData.appointmentType} 
                  onValueChange={(value) => handleInputChange('appointmentType', value as 'presencial' | 'teleconsulta')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="teleconsulta">Online/Remoto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="text"
                value={`${formData.duration} minutos`}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
                title="A duração é definida automaticamente pelo serviço selecionado"
              />
              {formData.serviceId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Duração automática do serviço selecionado
                </p>
              )}
              {!formData.serviceId && (
                <p className="text-xs text-amber-600 mt-1">
                  Selecione um serviço para definir a duração
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Convênio/Pagamento - Apenas para clínicas */}
        {fields.showInsurance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Convênio e Pagamento
              </CardTitle>
              <CardDescription>
                Informações sobre forma de pagamento e convênio
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insuranceType">Tipo de Atendimento</Label>
                <Select 
                  value={formData.insuranceType} 
                  onValueChange={(value) => handleInputChange('insuranceType', value as 'convenio' | 'particular')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.insuranceType === 'convenio' && (
                <div>
                  <Label htmlFor="insuranceName">Nome do Convênio</Label>
                  <Input
                    id="insuranceName"
                    value={formData.insuranceName}
                    onChange={(e) => handleInputChange('insuranceName', e.target.value)}
                    placeholder="Ex: Unimed, Bradesco Saúde..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
            <CardDescription>
              Informações adicionais sobre {t.appointment === 'Consulta' ? 'a consulta' : `o ${t.appointment.toLowerCase()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={placeholders.appointmentNotes}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 sticky bottom-0 sm:static bg-background py-3 sm:py-0 border-t sm:border-t-0 -mx-3 sm:mx-0 px-3 sm:px-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Criando...</span>
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                <span>Criar {t.appointment}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
