
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Calendar,
  Globe,
  Upload,
  Copy,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Save,
  Info
} from 'lucide-react'
import { generateSlug } from '@/lib/utils'
import { toast } from 'sonner'
import { useUserRole } from '@/hooks/use-user-role'

interface BusinessConfig {
  autoConfirm: boolean
  allowOnlineBooking: boolean
  businessLogo: string | null
  publicUrl: string | null
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { isProfessional } = useUserRole()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<BusinessConfig>({
    autoConfirm: false,
    allowOnlineBooking: true,
    businessLogo: null,
    publicUrl: null
  })
  const [businessName, setBusinessName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig()
    fetchUserProfile()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/settings/business-config')
      if (response.ok) {
        const data = await response.json()
        setConfig({
          autoConfirm: data.autoConfirm || false,
          allowOnlineBooking: data.allowOnlineBooking ?? true,
          businessLogo: data.businessLogo || null,
          publicUrl: data.publicUrl || null
        })

        // logoPreview is only for local FileReader preview, not for saved images
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setBusinessName(data.businessName || data.name || '')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('O arquivo deve ter no máximo 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida')
        return
      }

      setLogoFile(file)

      // Criar preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload automático para S3
      setSaving(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload/logo', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          setConfig({ ...config, businessLogo: data.cloud_storage_path })
          toast.success('Logo enviado com sucesso!')
          await fetchConfig()
        } else {
          throw new Error('Erro ao enviar logo')
        }
      } catch (error) {
        console.error('Erro no upload:', error)
        toast.error('Erro ao enviar logo')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSaveAppointmentSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/business-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoConfirm: config.autoConfirm,
          allowOnlineBooking: config.allowOnlineBooking
        })
      })

      if (response.ok) {
        toast.success('Configurações de agendamento salvas com sucesso!')
        await fetchConfig()
      } else {
        throw new Error('Erro ao salvar')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePageCustomization = async () => {
    setSaving(true)
    try {
      // Salvar nome do negócio no perfil do usuário
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName
        })
      })

      toast.success('Nome do negócio salvo com sucesso! URL atualizada automaticamente.')
      await fetchConfig()
      await fetchUserProfile()
    } catch (error) {
      console.error('Error saving customization:', error)
      toast.error('Erro ao salvar personalização')
    } finally {
      setSaving(false)
    }
  }

  const copyPublicUrl = () => {
    const url = getPublicUrl()
    navigator.clipboard.writeText(url)
    toast.success('URL copiada para a área de transferência!')
  }

  const getPublicUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const slug = config.publicUrl || generateSlug(businessName) || (session?.user as any)?.id?.substring(0, 8) || 'agendamento'
    return `${baseUrl}/booking/${slug}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">
            {isProfessional
              ? 'Visualize informações da conta'
              : 'Personalize o funcionamento do seu negócio'}
          </p>
        </div>
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <Settings className="mr-1 h-3 w-3" />
          Configurações
        </Badge>
      </div>

      {/* Aviso para profissionais */}
      {isProfessional && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm mb-1">
                  Visualização Limitada
                </h4>
                <p className="text-xs text-blue-700">
                  Como profissional, você pode visualizar apenas as informações da URL pública de agendamento.
                  Para alterar configurações do negócio, entre em contato com o administrador da conta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Configurações de Agendamento - Apenas para MASTER */}
        {!isProfessional && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-green-600" />
                Configurações de Agendamento
              </CardTitle>
              <CardDescription>
                Regras e preferências para novos agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agendamento Online */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="allowOnlineBooking" className="text-base font-medium cursor-pointer">
                    Agendamento Online
                  </Label>
                  <p className="text-sm text-gray-600">
                    Permitir que clientes agendem pela internet através de uma página pública
                  </p>
                </div>
                <Switch
                  id="allowOnlineBooking"
                  checked={config.allowOnlineBooking}
                  onCheckedChange={(checked) => setConfig({ ...config, allowOnlineBooking: checked })}
                />
              </div>

              {/* Confirmação Automática */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="autoConfirm" className="text-base font-medium cursor-pointer">
                    Confirmação Automática
                  </Label>
                  <p className="text-sm text-gray-600">
                    {config.autoConfirm
                      ? 'Agendamentos externos são confirmados automaticamente e bloqueiam o horário'
                      : 'Agendamentos externos precisam de aprovação manual antes de bloquear o horário'}
                  </p>
                </div>
                <Switch
                  id="autoConfirm"
                  checked={config.autoConfirm}
                  onCheckedChange={(checked) => setConfig({ ...config, autoConfirm: checked })}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveAppointmentSettings}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* URL Pública - Visível para todos, mas readonly para PROFESSIONAL */}
        {config.allowOnlineBooking && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5 text-purple-600" />
                {isProfessional ? 'URL de Agendamento' : 'Personalizar Página de Agendamento do Cliente'}
              </CardTitle>
              <CardDescription>
                {isProfessional
                  ? 'URL pública para compartilhar com clientes'
                  : 'Configure a aparência da sua página pública de agendamentos'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo - Apenas para MASTER */}
              {!isProfessional && (
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo do Negócio</Label>
                  <div className="flex items-start gap-4">
                    {/* Preview do logo */}
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                      {logoPreview || config.businessLogo ? (
                        <img
                          src={logoPreview || (config.businessLogo ? `/api/files/logo?key=${config.businessLogo}` : '')}
                          alt="Logo preview"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">Nenhuma imagem</p>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="cursor-pointer"
                          disabled={saving}
                        />
                        {config.businessLogo && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setConfig({ ...config, businessLogo: null })
                              setLogoPreview(null)
                              setLogoFile(null)
                            }}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Recomendado: imagem quadrada, formato PNG ou JPG, até 5MB
                      </p>
                      {saving && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Enviando imagem...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Nome da Empresa - Apenas para MASTER */}
              {!isProfessional && (
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nome do Negócio</Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Ex: Clínica Saúde Total"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500">
                    Este nome aparecerá como título na sua página de agendamentos e será usado para gerar a URL personalizada
                  </p>
                </div>
              )}

              {/* URL Pública - Visível para todos */}
              <div className="space-y-2">
                <Label htmlFor="publicUrl">URL Pública</Label>
                <div className="flex gap-2">
                  <Input
                    id="publicUrl"
                    type="text"
                    value={getPublicUrl()}
                    readOnly
                    className="bg-gray-50 cursor-default"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPublicUrl}
                    title="Copiar URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(getPublicUrl(), '_blank')}
                    title="Abrir em nova aba"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {isProfessional
                    ? 'Compartilhe esta URL com seus clientes para que possam agendar online'
                    : 'A URL é gerada automaticamente a partir do nome do negócio (sem acentos, minúsculas, com hífens)'}
                </p>
              </div>

              {/* Preview - Apenas para MASTER */}
              {!isProfessional && (
                <>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 text-sm mb-1">
                          Como seus clientes verão
                        </h4>
                        <p className="text-xs text-blue-700">
                          A página pública exibirá seu logo, nome do negócio, e permitirá que os clientes selecionem serviços e horários disponíveis.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSavePageCustomization}
                      disabled={saving}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Personalização
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
