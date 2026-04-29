
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Star, CreditCard, Zap, Loader2, QrCode, AlertTriangle, XCircle } from 'lucide-react'
import { PLAN_CONFIGS } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { PixQrDisplay } from '@/components/auth/pix-qr-display'

interface PlanUsageData {
  appointmentsThisMonth: number
  monthlyLimit: number
  usagePercentage: number
  planType: string
  userLimit: number
}

interface PendingPayment {
  paymentId: string
  invoiceUrl: string | null
  billingType: string
  value: number
  dueDate: string
  status: string
  pixPayload: string | null
  pixEncodedImage: string | null
}

interface PixUpgradeResult {
  pixPayload: string | null
  pixEncodedImage: string | null
  invoiceUrl: string | null
  value: number
}

export default function PlansPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [usageLoading, setUsageLoading] = useState(true)
  const [usageData, setUsageData] = useState<PlanUsageData | null>(null)
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null | undefined>(undefined)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [billingType, setBillingType] = useState('PIX')
  const [pixUpgradeResult, setPixUpgradeResult] = useState<PixUpgradeResult | null>(null)
  // Campos de cartão no upgrade
  const [cardHolderName, setCardHolderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpMonth, setCardExpMonth] = useState('')
  const [cardExpYear, setCardExpYear] = useState('')
  const [cardCcv, setCardCcv] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')

  const fetchUsageData = useCallback(async () => {
    try {
      const response = await fetch('/api/plans/usage')
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      setUsageLoading(false)
    }
  }, [])

  const fetchPendingPayment = useCallback(async () => {
    try {
      const res = await fetch('/api/asaas/subscription/pending-payment')
      if (res.ok) {
        const data = await res.json()
        setPendingPayment(data)
      }
    } catch {
      setPendingPayment(null)
    }
  }, [])

  useEffect(() => {
    fetchUsageData()
    fetchPendingPayment()
  }, [fetchUsageData, fetchPendingPayment])

  const currentPlan = usageData?.planType || 'FREEMIUM'
  const hasPaidPlan = currentPlan !== 'FREEMIUM'

  // ─── Upgrade ──────────────────────────────────────────────────────────────
  const handleUpgrade = async () => {
    if (!selectedPlan) return
    setLoading(selectedPlan)
    setPixUpgradeResult(null)

    try {
      const payload: Record<string, unknown> = {
        planKey: selectedPlan,
        billingType,
        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      }

      if (billingType === 'CREDIT_CARD') {
        payload.creditCard = {
          holderName: cardHolderName,
          number: cardNumber.replace(/\D/g, ''),
          expiryMonth: cardExpMonth,
          expiryYear: cardExpYear,
          ccv: cardCcv,
        }
        payload.creditCardHolderInfo = {
          name: cardHolderName,
          email: session?.user?.email ?? '',
          cpfCnpj: cpfCnpj.replace(/\D/g, ''),
          postalCode: '00000000',
          addressNumber: '0',
        }
      }

      const res = await fetch('/api/asaas/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao processar upgrade.')
        return
      }

      if (billingType === 'PIX' && (data.pixPayload || data.pixEncodedImage)) {
        setPixUpgradeResult({
          pixPayload: data.pixPayload,
          pixEncodedImage: data.pixEncodedImage,
          invoiceUrl: data.invoiceUrl,
          value: PLAN_CONFIGS[selectedPlan as keyof typeof PLAN_CONFIGS]?.price ?? 0,
        })
        toast.success('Assinatura criada! Escaneie o QR Code para ativar.')
      } else {
        toast.success('Upgrade realizado com sucesso!')
        setUpgradeOpen(false)
        setPixUpgradeResult(null)
        await fetchUsageData()
        await fetchPendingPayment()
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setLoading('')
    }
  }

  // ─── Cancelamento ─────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelLoading(true)
    try {
      const res = await fetch('/api/asaas/subscription/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao cancelar assinatura.')
        return
      }
      toast.success('Assinatura cancelada. Seu plano voltou ao Freemium.')
      setCancelOpen(false)
      await fetchUsageData()
      await fetchPendingPayment()
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge className="bg-green-100 text-green-700">
            Plano Atual: {PLAN_CONFIGS[currentPlan as keyof typeof PLAN_CONFIGS]?.name}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gerencie seu Plano
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Faça upgrade para desbloquear recursos avançados e expandir as possibilidades do seu negócio
        </p>
      </div>

      {/* Pagamento pendente */}
      {pendingPayment && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
              <AlertTriangle className="h-5 w-5" />
              {pendingPayment.status === 'OVERDUE' ? 'Pagamento em Atraso' : 'Pagamento Pendente'}
            </CardTitle>
            <CardDescription className="text-amber-700">
              {pendingPayment.status === 'OVERDUE'
                ? 'Seu acesso está suspenso. Regularize para reativar.'
                : 'Aguardando confirmação do pagamento.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingPayment.billingType === 'PIX' && pendingPayment.pixPayload ? (
              <PixQrDisplay
                pixPayload={pendingPayment.pixPayload}
                pixEncodedImage={pendingPayment.pixEncodedImage}
                invoiceUrl={pendingPayment.invoiceUrl}
                value={pendingPayment.value}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Valor: {formatCurrency(pendingPayment.value)} — Vencimento: {new Date(pendingPayment.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {pendingPayment.invoiceUrl && (
                  <a href={pendingPayment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      Pagar agora
                    </Button>
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Plan Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Zap className="h-5 w-5 text-blue-600 mr-2" />
            Status do Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : usageData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {usageData.appointmentsThisMonth}
                </div>
                <p className="text-sm text-gray-600">Agendamentos este mês</p>
                {usageData.usagePercentage > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {usageData.usagePercentage}% utilizado
                  </p>
                )}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {usageData.monthlyLimit === -1 ? '∞' : usageData.monthlyLimit}
                </div>
                <p className="text-sm text-gray-600">Limite mensal</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {usageData.userLimit}
                </div>
                <p className="text-sm text-gray-600">Usuários permitidos</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Não foi possível carregar os dados de uso
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancelar assinatura */}
      {hasPaidPlan && (
        <div className="flex justify-end">
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Assinatura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Cancelar Assinatura
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ao cancelar, seu plano voltará ao <strong>Freemium</strong> imediatamente e você
                  perderá acesso às funcionalidades do plano atual.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Limite de 60 agendamentos/mês</li>
                  <li>• Apenas 1 usuário</li>
                  <li>• Sem notificações WhatsApp</li>
                </ul>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>
                    Manter assinatura
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Confirmar Cancelamento
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Plans Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLAN_CONFIGS).map(([planId, config]) => {
          const isCurrent = currentPlan === planId
          const isUpgrade = planId !== 'FREEMIUM' && !isCurrent

          return (
            <Card key={planId} className={`relative ${isCurrent ? 'border-blue-500 shadow-lg' : ''} ${planId === 'STANDARD' ? 'scale-105' : ''}`}>
              {isCurrent && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Plano Atual
                </Badge>
              )}
              {planId === 'STANDARD' && !isCurrent && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                  <Star className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="text-xl text-center">{config.name}</CardTitle>
                <CardDescription className="text-center">
                  {planId === 'FREEMIUM' && 'Perfeito para começar'}
                  {planId === 'STANDARD' && 'Para negócios em crescimento'}
                  {planId === 'PREMIUM' && 'Para negócios estabelecidos'}
                </CardDescription>
                <div className="text-center py-4">
                  {config.price === 0 ? (
                    <span className="text-3xl font-bold">Grátis</span>
                  ) : planId === 'PREMIUM' ? (
                    <div>
                      <span className="text-2xl font-bold text-gray-700">Sob Consulta</span>
                      <p className="text-sm text-gray-500 mt-1">Entre em contato</p>
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{formatCurrency(config.price)}</span>
                      <p className="text-sm text-gray-600 mt-1">/mês</p>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {config.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button className="w-full" disabled>
                    Plano Atual
                  </Button>
                ) : isUpgrade ? (
                  <Dialog
                    open={upgradeOpen && selectedPlan === planId}
                    onOpenChange={open => {
                      setUpgradeOpen(open)
                      if (open) {
                        setSelectedPlan(planId)
                        setPixUpgradeResult(null)
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className={`w-full ${planId === 'STANDARD' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        variant={planId === 'STANDARD' ? 'default' : 'outline'}
                        onClick={() => setSelectedPlan(planId)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {planId === 'PREMIUM' ? 'Falar com Vendas' : 'Fazer Upgrade'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          Upgrade para {config.name} — {formatCurrency(config.price)}/mês
                        </DialogTitle>
                      </DialogHeader>

                      {pixUpgradeResult ? (
                        <div className="space-y-4">
                          <PixQrDisplay
                            pixPayload={pixUpgradeResult.pixPayload}
                            pixEncodedImage={pixUpgradeResult.pixEncodedImage}
                            invoiceUrl={pixUpgradeResult.invoiceUrl}
                            value={pixUpgradeResult.value}
                          />
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setUpgradeOpen(false)
                              setPixUpgradeResult(null)
                            }}
                          >
                            Fechar
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* CPF/CNPJ */}
                          <div className="space-y-1.5">
                            <Label htmlFor="upgrade-doc">CPF / CNPJ *</Label>
                            <Input
                              id="upgrade-doc"
                              value={cpfCnpj}
                              onChange={e => setCpfCnpj(e.target.value)}
                              placeholder="000.000.000-00"
                            />
                          </div>

                          {/* Forma de pagamento */}
                          <div className="space-y-2">
                            <Label>Forma de pagamento</Label>
                            <Tabs value={billingType} onValueChange={setBillingType}>
                              <TabsList className="w-full">
                                <TabsTrigger value="PIX" className="flex-1">
                                  <QrCode className="h-4 w-4 mr-2" />
                                  PIX
                                </TabsTrigger>
                                <TabsTrigger value="CREDIT_CARD" className="flex-1">
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Cartão
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="PIX">
                                <p className="text-xs text-muted-foreground mt-2">
                                  Um QR Code PIX será gerado após a confirmação.
                                </p>
                              </TabsContent>
                              <TabsContent value="CREDIT_CARD" className="space-y-3 mt-2">
                                <div className="space-y-1.5">
                                  <Label>Nome no cartão</Label>
                                  <Input value={cardHolderName} onChange={e => setCardHolderName(e.target.value)} placeholder="Como no cartão" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Número do cartão</Label>
                                  <Input
                                    value={cardNumber}
                                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '))}
                                    placeholder="0000 0000 0000 0000"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="space-y-1.5">
                                    <Label>Mês</Label>
                                    <Input value={cardExpMonth} onChange={e => setCardExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="MM" maxLength={2} />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label>Ano</Label>
                                    <Input value={cardExpYear} onChange={e => setCardExpYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="AAAA" maxLength={4} />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label>CVV</Label>
                                    <Input value={cardCcv} onChange={e => setCardCcv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" maxLength={4} />
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button variant="outline" className="flex-1" onClick={() => setUpgradeOpen(false)}>
                              Cancelar
                            </Button>
                            <Button
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={handleUpgrade}
                              disabled={!!loading}
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : billingType === 'PIX' ? (
                                <QrCode className="h-4 w-4 mr-2" />
                              ) : (
                                <CreditCard className="h-4 w-4 mr-2" />
                              )}
                              {loading ? 'Processando...' : 'Confirmar Upgrade'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    {planId === 'FREEMIUM' ? 'Plano Básico' : 'Fazer Downgrade'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
