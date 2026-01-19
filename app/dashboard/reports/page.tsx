
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  UserX,
  BarChart3
} from 'lucide-react'
import { useSegmentConfig } from '@/contexts/segment-context'

interface MainStats {
  total: number
  confirmed: number
  cancelled: number
  noShow: number
}

interface ServiceStat {
  serviceName: string
  count: number
  percentage: number
}

interface EvolutionData {
  month: string
  appointments: number
}

export default function ReportsPage() {
  const { config: segmentConfig, isLoading: segmentLoading } = useSegmentConfig()
  const [mainStats, setMainStats] = useState<MainStats>({
    total: 0,
    confirmed: 0,
    cancelled: 0,
    noShow: 0
  })
  const [servicesStats, setServicesStats] = useState<ServiceStat[]>([])
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar dados reais
  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const response = await fetch('/api/reports/stats')
        if (response.ok) {
          const data = await response.json()
          setMainStats(data.mainStats)
          setServicesStats(data.servicesStats || [])
          setEvolutionData(data.evolutionData || [])
        }
      } catch (error) {
        console.error('Error fetching reports data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportsData()
  }, [])

  // Terminologia dinâmica
  const t = segmentConfig.terminology

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">
            Análise detalhada do desempenho dos seus agendamentos
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <BarChart3 className="mr-1 h-3 w-3" />
          Relatórios
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>

      {/* Stats Cards - ATUALIZADO */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Agendas
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {mainStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {t.appointments} criados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Confirmados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {mainStats.confirmed}
            </div>
            <p className="text-xs text-green-600">
              {mainStats.total > 0 ? `${Math.round((mainStats.confirmed / mainStats.total) * 100)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cancelados
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {mainStats.cancelled}
            </div>
            <p className="text-xs text-red-600">
              {mainStats.total > 0 ? `${Math.round((mainStats.cancelled / mainStats.total) * 100)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Faltou
            </CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {mainStats.noShow}
            </div>
            <p className="text-xs text-orange-600">
              {mainStats.total > 0 ? `${Math.round((mainStats.noShow / mainStats.total) * 100)}%` : '0%'} do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Evolução Mensal - ATUALIZADO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>
              Crescimento da agenda nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evolutionData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum dado disponível ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evolutionData.map((item, index) => {
                  const previousCount = index > 0 ? evolutionData[index - 1].appointments : item.appointments
                  const growth = previousCount > 0 ? Math.round(((item.appointments - previousCount) / previousCount) * 100) : 0
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{item.month}</p>
                        <p className="text-sm text-gray-600">{item.appointments} {item.appointments === 1 ? t.appointment.toLowerCase() : t.appointments.toLowerCase()}</p>
                      </div>
                      <div className="text-right">
                        {index > 0 && (
                          <p className={`text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {growth >= 0 ? '+' : ''}{growth}%
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Serviços Agendados - ATUALIZADO (antes era "Perfil dos Pacientes") */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
              {t.services} Agendados
            </CardTitle>
            <CardDescription>
              Distribuição por {t.service.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {servicesStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum {t.service.toLowerCase()} agendado ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {servicesStats.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{item.serviceName}</span>
                      <span className="text-sm text-gray-600">{item.count} {item.count === 1 ? t.appointment.toLowerCase() : t.appointments.toLowerCase()} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  )
}
