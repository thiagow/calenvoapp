
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  CalendarCheck,
  UserCheck,
  AlertCircle,
  Plus
} from 'lucide-react'
import { PLAN_CONFIGS } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface DashboardOverviewProps {
  sessionData: {
    user: {
      name?: string | null
      email?: string | null
      planType?: string
      clinicName?: string | null
    }
  }
}

interface DashboardStats {
  todayAppointments: number
  weekAppointments: number
  monthAppointments: number
  totalClients: number
  pendingAppointments: number
  completedAppointments: number
}

interface RecentAppointment {
  id: string
  patient: string
  time: string
  status: string
  type: string
}

export function DashboardOverview({ sessionData }: DashboardOverviewProps) {
  const userPlan = sessionData?.user?.planType || 'FREEMIUM'
  const planConfig = PLAN_CONFIGS[userPlan as keyof typeof PLAN_CONFIGS]

  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    monthAppointments: 0,
    totalClients: 0,
    pendingAppointments: 0,
    completedAppointments: 0
  })

  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar dados reais do banco
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setRecentAppointments(data.recentAppointments || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {sessionData?.user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600 mt-1">
            Aqui está um resumo do seu negócio hoje
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Plano {planConfig?.name}
          </Badge>
          <Link href="/dashboard/appointments/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.todayAppointments}
            </div>
            <p className="text-xs text-gray-600">
              agendamentos hoje
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Esta Semana
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.weekAppointments}
            </div>
            <p className="text-xs text-gray-600">
              agendamentos esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalClients}
            </div>
            <p className="text-xs text-gray-600">
              cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendentes
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.pendingAppointments}
            </div>
            <p className="text-xs text-gray-600">
              aguardando confirmação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              Próximos Agendamentos
            </CardTitle>
            <CardDescription>
              Agendamentos programados para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>Nenhum agendamento para hoje</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <UserCheck className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.patient}
                        </p>
                        <p className="text-xs text-gray-600">
                          {appointment.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={appointment.status === 'CONFIRMED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {appointment.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {appointment.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link href="/dashboard/agenda">
                <Button variant="outline" className="w-full">
                  Ver Agenda Completa
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Plan Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
              Uso do Plano
            </CardTitle>
            <CardDescription>
              Limite de agendamentos do mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Agendamentos este mês</span>
                  <span className="text-gray-600">
                    {stats.monthAppointments} / {planConfig?.monthlyLimit === -1 ? '∞' : planConfig?.monthlyLimit}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: planConfig?.monthlyLimit === -1 
                        ? '20%' 
                        : `${Math.min((stats.monthAppointments / planConfig?.monthlyLimit!) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plano Atual</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {planConfig?.name}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {planConfig?.price === 0 ? 'Gratuito' : `${formatCurrency(planConfig?.price!)} por mês`}
                </p>
                
                {userPlan === 'FREEMIUM' && (
                  <div className="mt-4">
                    <Link href="/dashboard/plans">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                        Fazer Upgrade
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
