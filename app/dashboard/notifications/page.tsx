
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageSquare, Bell, Smartphone, QrCode, CheckCircle, XCircle, Settings, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

interface WhatsAppConfig {
  id: string
  instanceName: string
  apiUrl: string
  isConnected: boolean
  enabled: boolean
  qrCode?: string
  phoneNumber?: string
  notifyOnCreate: boolean
  notifyOnConfirm: boolean
  notifyOnCancel: boolean
  notifyReminder: boolean
  reminderHours: number
}

export default function NotificationsPage() {
  const { data: session } = useSession() || {}
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  
  // Formulário para criar instância
  const [instanceName, setInstanceName] = useState('')
  const [apiUrl, setApiUrl] = useState('')

  const planType = (session?.user as any)?.planType || 'FREEMIUM'
  const isPaidPlan = planType !== 'FREEMIUM'

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        if (data?.qrCode) {
          setQrCode(data.qrCode)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInstance = async () => {
    if (!instanceName || !apiUrl) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      setConnecting(true)
      const response = await fetch('/api/whatsapp/instance/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName, apiUrl }),
      })

      if (response.ok) {
        toast.success('Instância criada com sucesso!')
        await loadConfig()
        await getQRCode()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar instância')
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error)
      toast.error('Erro ao criar instância')
    } finally {
      setConnecting(false)
    }
  }

  const getQRCode = async () => {
    try {
      setConnecting(true)
      const response = await fetch('/api/whatsapp/qrcode')
      
      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        
        // Verifica o status a cada 5 segundos
        const interval = setInterval(async () => {
          const statusResponse = await fetch('/api/whatsapp/status')
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.isConnected) {
              clearInterval(interval)
              toast.success('WhatsApp conectado com sucesso!')
              await loadConfig()
              setQrCode(null)
            }
          }
        }, 5000)

        // Para de verificar após 2 minutos
        setTimeout(() => clearInterval(interval), 120000)
      } else {
        toast.error('Erro ao obter QR Code')
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error)
      toast.error('Erro ao obter QR Code')
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('WhatsApp desconectado')
        await loadConfig()
        setQrCode(null)
      } else {
        toast.error('Erro ao desconectar')
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error)
      toast.error('Erro ao desconectar')
    }
  }

  const deleteInstance = async () => {
    if (!confirm('Tem certeza que deseja deletar a instância? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch('/api/whatsapp/delete', {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Instância deletada')
        setConfig(null)
        setQrCode(null)
        setInstanceName('')
        setApiUrl('')
      } else {
        toast.error('Erro ao deletar instância')
      }
    } catch (error) {
      console.error('Erro ao deletar instância:', error)
      toast.error('Erro ao deletar instância')
    }
  }

  const updateConfig = async (updates: Partial<WhatsAppConfig>) => {
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        toast.success('Configuração atualizada')
      } else {
        toast.error('Erro ao atualizar configuração')
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error)
      toast.error('Erro ao atualizar configuração')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Notificações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie como você e seus clientes recebem notificações
        </p>
      </div>

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
        </CardContent>
      </Card>

      {/* Notificações via WhatsApp */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Notificações via WhatsApp</CardTitle>
            {isPaidPlan ? (
              <Badge variant="default">Disponível</Badge>
            ) : (
              <Badge variant="outline">Apenas planos pagos</Badge>
            )}
          </div>
          <CardDescription>
            Envie notificações automáticas para seus clientes via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isPaidPlan ? (
            <Alert>
              <AlertDescription>
                Para usar notificações via WhatsApp, faça upgrade para um plano pago (Standard ou Premium).
              </AlertDescription>
            </Alert>
          ) : !config ? (
            <>
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Configure a integração com a Evolution API para enviar notificações via WhatsApp.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="instanceName">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    placeholder="Ex: minha_clinica"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    disabled={connecting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Um nome único para identificar sua instância
                  </p>
                </div>

                <div>
                  <Label htmlFor="apiUrl">URL da API Evolution</Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://api.evolution.com"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    disabled={connecting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL base da sua instalação da Evolution API
                  </p>
                </div>

                <Button 
                  onClick={createInstance} 
                  disabled={connecting}
                  className="w-full"
                >
                  {connecting ? 'Criando...' : 'Criar Instância'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Status da Conexão */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {config.isConnected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Conectado</p>
                        <p className="text-sm text-muted-foreground">
                          {config.phoneNumber || 'WhatsApp ativo'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">Desconectado</p>
                        <p className="text-sm text-muted-foreground">
                          Escaneie o QR Code para conectar
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {!config.isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getQRCode}
                      disabled={connecting}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar QR Code
                    </Button>
                  )}
                  {config.isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnect}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteInstance}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              {qrCode && (
                <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Aguardando escaneamento do QR Code...
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground max-w-md">
                    Abra o WhatsApp no seu celular, vá em Configurações {'>'} Aparelhos conectados {'>'} Conectar aparelho
                    e escaneie o QR Code acima.
                  </p>
                </div>
              )}

              <Separator />

              {/* Configurações de Envio */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações de Envio
                </h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enabled">Notificações WhatsApp Ativas</Label>
                    <p className="text-xs text-muted-foreground">
                      Ative ou desative todas as notificações via WhatsApp
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={config.enabled}
                    onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                    disabled={!config.isConnected}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifyOnCreate">Notificar ao criar agendamento</Label>
                    <Switch
                      id="notifyOnCreate"
                      checked={config.notifyOnCreate}
                      onCheckedChange={(checked) => updateConfig({ notifyOnCreate: checked })}
                      disabled={!config.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifyOnConfirm">Notificar ao confirmar agendamento</Label>
                    <Switch
                      id="notifyOnConfirm"
                      checked={config.notifyOnConfirm}
                      onCheckedChange={(checked) => updateConfig({ notifyOnConfirm: checked })}
                      disabled={!config.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifyOnCancel">Notificar ao cancelar agendamento</Label>
                    <Switch
                      id="notifyOnCancel"
                      checked={config.notifyOnCancel}
                      onCheckedChange={(checked) => updateConfig({ notifyOnCancel: checked })}
                      disabled={!config.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifyReminder">Enviar lembretes</Label>
                    <Switch
                      id="notifyReminder"
                      checked={config.notifyReminder}
                      onCheckedChange={(checked) => updateConfig({ notifyReminder: checked })}
                      disabled={!config.enabled}
                    />
                  </div>

                  {config.notifyReminder && (
                    <div>
                      <Label htmlFor="reminderHours">Horas antes para lembrete</Label>
                      <Input
                        id="reminderHours"
                        type="number"
                        min="1"
                        max="72"
                        value={config.reminderHours}
                        onChange={(e) => updateConfig({ reminderHours: parseInt(e.target.value) })}
                        disabled={!config.enabled}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Documentação */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">1. Evolution API</h4>
            <p className="text-sm text-muted-foreground">
              A Evolution API é uma solução para integrar o WhatsApp com aplicações. 
              Você precisa ter uma instância da Evolution API rodando para usar este recurso.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Criando uma instância</h4>
            <p className="text-sm text-muted-foreground">
              Informe o nome da instância e a URL da sua Evolution API. 
              O sistema criará automaticamente uma instância para seu negócio.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Conectando o WhatsApp</h4>
            <p className="text-sm text-muted-foreground">
              Após criar a instância, gere o QR Code e escaneie com seu WhatsApp. 
              As notificações serão enviadas do número conectado.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">4. Documentação</h4>
            <p className="text-sm text-muted-foreground">
              Para mais informações sobre a Evolution API, acesse:{' '}
              <a 
                href="https://doc.evolution-api.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                doc.evolution-api.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
