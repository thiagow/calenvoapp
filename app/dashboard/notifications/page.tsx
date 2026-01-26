
'use client'

import { Bell, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NotificationTabs } from '@/components/notifications/notification-tabs'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Notificações</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Gerencie e visualize suas notificações
        </p>
      </div>

      {/* Tabs Navigation */}
      <NotificationTabs />

      {/* Content */}
      <div className="space-y-6">
        {/* Notificações Internas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notificações Internas</CardTitle>
            </div>
            <CardDescription>
              Notificações exibidas no ícone de sino no topo da página
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                As notificações internas estão sempre ativas para todos os planos. 
                Você receberá alertas sobre novos agendamentos, confirmações e cancelamentos.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Nenhuma notificação recente para exibir.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
