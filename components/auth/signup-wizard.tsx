'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CheckCircle, CreditCard, QrCode, ChevronLeft, Zap, Star, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PLAN_CONFIGS, AVAILABLE_SEGMENTS } from '@/lib/types'
import { PixQrDisplay } from './pix-qr-display'
import { PlanType } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingType = 'PIX' | 'CREDIT_CARD'

interface WizardData {
  // Etapa 1: Dados da conta
  name: string
  email: string
  password: string
  confirmPassword: string
  businessName: string
  segmentType: string
  phone: string
  // Etapa 2: Pagamento (planos pagos)
  billingType: BillingType
  document: string
  postalCode: string
  address: string
  addressNumber: string
  // Cartão
  cardHolderName: string
  cardNumber: string
  cardExpMonth: string
  cardExpYear: string
  cardCcv: string
  // Etapa 3: Plano
  planKey: PlanType
}

interface PixResult {
  pixPayload: string | null
  pixEncodedImage: string | null
  invoiceUrl: string | null
  value: number
}

const INITIAL_DATA: WizardData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  businessName: '',
  segmentType: 'BEAUTY_SALON',
  phone: '',
  billingType: 'PIX',
  document: '',
  postalCode: '',
  address: '',
  addressNumber: '',
  cardHolderName: '',
  cardNumber: '',
  cardExpMonth: '',
  cardExpYear: '',
  cardCcv: '',
  planKey: 'STANDARD',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDocument(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function formatCep(value: string) {
  return value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
              i + 1 < current
                ? 'bg-green-600 text-white'
                : i + 1 === current
                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                : 'bg-gray-200 text-gray-700',
            )}
          >
            {i + 1 < current ? <CheckCircle className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={cn(
                'h-1 w-8 rounded transition-all',
                i + 1 < current ? 'bg-green-600' : 'bg-gray-200',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Etapa 1: Dados da conta ─────────────────────────────────────────────────

function Step1Account({
  data,
  onChange,
  onNext,
}: {
  data: WizardData
  onChange: (field: keyof WizardData, value: string) => void
  onNext: () => void
}) {
  function validate() {
    if (!data.name.trim()) { toast.error('Informe seu nome completo'); return false }
    if (!data.email.trim() || !data.email.includes('@')) { toast.error('Informe um e-mail válido'); return false }
    if (data.password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return false }
    if (data.password !== data.confirmPassword) { toast.error('As senhas não coincidem'); return false }
    if (!data.businessName.trim()) { toast.error('Informe o nome do seu negócio'); return false }
    if (!data.phone.trim()) { toast.error('Informe seu telefone'); return false }
    return true
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Dados da conta</h2>
        <p className="text-base text-gray-800">Informações para acessar o Calenvo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="font-semibold text-gray-900">Nome completo *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={e => onChange('name', e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            className="border-gray-300"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName" className="font-semibold text-gray-900">Nome do negócio *</Label>
          <Input
            id="businessName"
            value={data.businessName}
            onChange={e => onChange('businessName', e.target.value)}
            placeholder="Ex: Salão da Maria"
            className="border-gray-300"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-semibold text-gray-900">E-mail *</Label>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={e => onChange('email', e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          className="border-gray-300"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="font-semibold text-gray-900">Senha *</Label>
          <Input
            id="password"
            type="password"
            value={data.password}
            onChange={e => onChange('password', e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            className="border-gray-300"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-semibold text-gray-900">Confirmar senha *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={data.confirmPassword}
            onChange={e => onChange('confirmPassword', e.target.value)}
            placeholder="Repita a senha"
            autoComplete="new-password"
            className="border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="font-semibold text-gray-900">Telefone / WhatsApp *</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={e => onChange('phone', formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            inputMode="numeric"
            className="border-gray-300"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="segmentType" className="font-semibold text-gray-900">Segmento *</Label>
          <Select
            value={data.segmentType}
            onValueChange={v => onChange('segmentType', v)}
          >
            <SelectTrigger id="segmentType" className="border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_SEGMENTS.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.icon} {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button className="w-full mt-6 h-11 font-semibold" onClick={() => { if (validate()) onNext() }}>
        Continuar
      </Button>
    </div>
  )
}

// ─── Etapa 2: Pagamento (planos pagos) ───────────────────────────────────────

function Step2Payment({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData
  onChange: (field: keyof WizardData, value: string) => void
  onNext: () => void
  onBack: () => void
}) {
  function validate() {
    const cleanDoc = data.document.replace(/\D/g, '')
    if (cleanDoc.length < 11) { toast.error('CPF ou CNPJ inválido'); return false }
    if (data.billingType === 'CREDIT_CARD') {
      if (!data.cardHolderName.trim()) { toast.error('Informe o nome no cartão'); return false }
      if (data.cardNumber.replace(/\D/g, '').length < 16) { toast.error('Número do cartão inválido'); return false }
      if (!data.cardExpMonth || !data.cardExpYear) { toast.error('Informe a validade do cartão'); return false }
      if (!data.cardCcv) { toast.error('Informe o CVV'); return false }
    }
    return true
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Dados de pagamento</h2>
        <p className="text-base text-gray-800">Informações para processar sua transação</p>
      </div>

      {/* Documento */}
      <div className="space-y-2">
        <Label htmlFor="document" className="font-semibold text-gray-900">CPF / CNPJ *</Label>
        <Input
          id="document"
          value={data.document}
          onChange={e => onChange('document', formatDocument(e.target.value))}
          placeholder="000.000.000-00"
          inputMode="numeric"
          className="border-gray-300"
        />
      </div>

      {/* Endereço */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="address" className="font-semibold text-gray-900">Endereço</Label>
          <Input
            id="address"
            value={data.address}
            onChange={e => onChange('address', e.target.value)}
            placeholder="Rua, Av..."
            className="border-gray-300"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressNumber" className="font-semibold text-gray-900">Número</Label>
          <Input
            id="addressNumber"
            value={data.addressNumber}
            onChange={e => onChange('addressNumber', e.target.value)}
            placeholder="123"
            className="border-gray-300"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="postalCode" className="font-semibold text-gray-900">CEP</Label>
        <Input
          id="postalCode"
          value={data.postalCode}
          onChange={e => onChange('postalCode', formatCep(e.target.value))}
          placeholder="00000-000"
          inputMode="numeric"
          className="border-gray-300 max-w-[180px]"
        />
      </div>

      {/* Forma de pagamento */}
      <div className="space-y-3 pt-2">
        <Label className="font-semibold text-gray-900">Forma de pagamento *</Label>
        <Tabs
          value={data.billingType}
          onValueChange={v => onChange('billingType', v as BillingType)}
        >
          <TabsList className="w-full grid grid-cols-2 bg-gray-100">
            <TabsTrigger value="PIX" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <QrCode className="h-4 w-4" /> PIX
            </TabsTrigger>
            <TabsTrigger value="CREDIT_CARD" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CreditCard className="h-4 w-4" /> Cartão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="PIX" className="mt-4">
            <div className="rounded-lg border-2 border-green-400 bg-green-50 p-4 text-sm space-y-2">
              <p className="font-semibold text-green-900">Como funciona o PIX:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-900">
                <li>Clique em "Continuar para plano"</li>
                <li>Escaneie o QR Code ou copie o código PIX</li>
                <li>Assim que o pagamento for confirmado, sua conta é ativada automaticamente</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="CREDIT_CARD" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardHolderName" className="font-semibold text-gray-900">Nome no cartão *</Label>
              <Input
                id="cardHolderName"
                value={data.cardHolderName}
                onChange={e => onChange('cardHolderName', e.target.value.toUpperCase())}
                placeholder="NOME SOBRENOME"
                className="border-gray-300 uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="font-semibold text-gray-900">Número do cartão *</Label>
              <Input
                id="cardNumber"
                value={data.cardNumber}
                onChange={e =>
                  onChange(
                    'cardNumber',
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 16)
                      .replace(/(\d{4})(?=\d)/g, '$1 '),
                  )
                }
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                className="border-gray-300"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cardExpMonth" className="font-semibold text-gray-900">Mês *</Label>
                <Input
                  id="cardExpMonth"
                  value={data.cardExpMonth}
                  onChange={e => onChange('cardExpMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="MM"
                  inputMode="numeric"
                  maxLength={2}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardExpYear" className="font-semibold text-gray-900">Ano *</Label>
                <Input
                  id="cardExpYear"
                  value={data.cardExpYear}
                  onChange={e => onChange('cardExpYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="AAAA"
                  inputMode="numeric"
                  maxLength={4}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCcv" className="font-semibold text-gray-900">CVV *</Label>
                <Input
                  id="cardCcv"
                  value={data.cardCcv}
                  onChange={e => onChange('cardCcv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="000"
                  inputMode="numeric"
                  maxLength={4}
                  className="border-gray-300"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button
          className="flex-1 font-semibold h-11"
          onClick={() => { if (validate()) onNext() }}
        >
          Continuar para plano
        </Button>
      </div>
    </div>
  )
}

// ─── Etapa 3: Seleção do plano ────────────────────────────────────────────────

function Step3Plan({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData
  onChange: (field: keyof WizardData, value: string) => void
  onNext: () => void
  onBack: () => void
}) {
  const plans = [
    { key: 'FREEMIUM', name: 'Freemium', icon: null },
    { key: 'STANDARD', name: 'Standard', icon: <Zap className="h-5 w-5" /> },
    { key: 'PREMIUM', name: 'Premium', icon: <Star className="h-5 w-5" /> },
  ] as const

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Escolha seu plano</h2>
        <p className="text-base text-gray-800">Você poderá alterá-lo a qualquer momento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const config = PLAN_CONFIGS[plan.key as PlanType]
          const isSelected = data.planKey === plan.key
          return (
            <button
              key={plan.key}
              onClick={() => onChange('planKey', plan.key)}
              className={cn(
                'p-6 rounded-lg border-2 transition-all text-left space-y-3',
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{config?.name}</h3>
                  <p className="text-xs text-gray-700 mt-1">
                    {plan.key === 'FREEMIUM' ? 'Plano gratuito' : 
                     plan.key === 'STANDARD' ? 'Para pequenas empresas' : 'Para empresas em crescimento'}
                  </p>
                </div>
                {plan.icon && <span className="text-blue-600">{plan.icon}</span>}
              </div>
              {config?.price && config.price > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {(config.price / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-700">por mês</p>
                </div>
              )}
              {plan.key === 'FREEMIUM' && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-base font-semibold text-green-600">Grátis</p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button className="flex-1 font-semibold h-11" onClick={onNext}>
          Continuar
        </Button>
      </div>
    </div>
  )
}

// ─── Etapa 4: Conclusão ──────────────────────────────────────────────────────

function Step4Done({
  planKey,
  pixResult,
}: {
  planKey: PlanType
  pixResult: PixResult | null
}) {
  const router = useRouter()

  if (pixResult) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900">Conta criada!</h2>
          <p className="text-base text-gray-800">
            Realize o pagamento via PIX para ativar seu acesso.
          </p>
        </div>

        <PixQrDisplay
          pixPayload={pixResult.pixPayload}
          pixEncodedImage={pixResult.pixEncodedImage}
          invoiceUrl={pixResult.invoiceUrl}
          value={pixResult.value}
        />

        <p className="text-center text-sm text-gray-800">
          Após a confirmação do pagamento, seu plano é ativado automaticamente.
          <br />
          Faça login com seu e-mail e senha cadastrados.
        </p>

        <Button variant="outline" className="w-full h-11" onClick={() => router.push('/login')}>
          Ir para o Login
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Tudo pronto!</h2>
        <p className="text-lg text-gray-800">
          {planKey === 'FREEMIUM'
            ? 'Sua conta foi criada. Você já está conectado!'
            : 'Assinatura confirmada. Seu acesso está ativo!'}
        </p>
      </div>
      <Button className="w-full h-11 font-semibold" size="lg" onClick={() => router.push('/dashboard')}>
        Acessar o Calenvo
      </Button>
    </div>
  )
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

export function SignupWizard() {
  const router = useRouter()
  const [data, setData] = useState<WizardData>(INITIAL_DATA)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [pixResult, setPixResult] = useState<PixResult | null>(null)
  const [done, setDone] = useState(false)

  const isPaid = data.planKey !== 'FREEMIUM'

  function handleChange(field: keyof WizardData, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  // Para Freemium: do passo 2 vai direto submeter
  async function submitFreemium() {
    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          businessName: data.businessName,
          segmentType: data.segmentType,
          phone: data.phone.replace(/\D/g, ''),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.message ?? json.error ?? 'Erro ao criar conta.')
        return
      }
      // Auto-login
      const login = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (login?.ok) {
        setDone(true)
        setStep(4)
        setTimeout(() => router.push('/dashboard'), 1000)
      } else {
        toast.success('Conta criada! Faça login para acessar.')
        router.push('/login')
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Para planos pagos
  async function submitPaid() {
    setLoading(true)
    const cleanDoc = data.document.replace(/\D/g, '')
    const cleanCep = data.postalCode.replace(/\D/g, '')
    const cleanPhone = data.phone.replace(/\D/g, '')

    const payload: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      password: data.password,
      businessName: data.businessName,
      segmentType: data.segmentType,
      phone: cleanPhone || undefined,
      planKey: data.planKey,
      billingType: data.billingType,
      document: cleanDoc,
      postalCode: cleanCep || undefined,
      address: data.address || undefined,
      addressNumber: data.addressNumber || undefined,
    }

    if (data.billingType === 'CREDIT_CARD') {
      payload.creditCard = {
        holderName: data.cardHolderName,
        number: data.cardNumber.replace(/\D/g, ''),
        expiryMonth: data.cardExpMonth,
        expiryYear: data.cardExpYear,
        ccv: data.cardCcv,
      }
      payload.creditCardHolderInfo = {
        name: data.cardHolderName,
        email: data.email,
        cpfCnpj: cleanDoc,
        postalCode: cleanCep,
        addressNumber: data.addressNumber,
        phone: cleanPhone || undefined,
      }
    }

    try {
      const res = await fetch('/api/asaas/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao processar cadastro.')
        return
      }

      if (data.billingType === 'PIX' && (json.pixPayload || json.pixEncodedImage)) {
        setPixResult({
          pixPayload: json.pixPayload,
          pixEncodedImage: json.pixEncodedImage,
          invoiceUrl: json.invoiceUrl,
          value: PLAN_CONFIGS[data.planKey]?.price ?? 0,
        })
      } else {
        setDone(true)
      }
      setStep(4)
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Handlers
  function handleStep1Next() {
    setStep(2)
  }

  function handleStep2Next() {
    if (isPaid) {
      setStep(3)
    } else {
      submitFreemium()
    }
  }

  function handleStep3Next() {
    if (isPaid) {
      submitPaid()
    }
  }

  const totalSteps = 4

  return (
    <div>
      {/* Indicador de etapas */}
      {!done && step < 4 && <StepIndicator current={step} total={totalSteps} />}

      {/* Etapa 1: Conta */}
      {step === 1 && <Step1Account data={data} onChange={handleChange} onNext={handleStep1Next} />}

      {/* Etapa 2: Pagamento (somente para planos pagos, mas mostrado pra todos depois) */}
      {step === 2 && (
        <Step2Payment
          data={data}
          onChange={handleChange}
          onNext={handleStep2Next}
          onBack={() => setStep(1)}
        />
      )}

      {/* Etapa 3: Plano */}
      {step === 3 && (
        <Step3Plan
          data={data}
          onChange={handleChange}
          onNext={handleStep3Next}
          onBack={() => setStep(2)}
        />
      )}

      {/* Etapa 4: Conclusão */}
      {step === 4 && <Step4Done planKey={data.planKey} pixResult={pixResult} />}

      {/* Loading intermediário (freemium no step 2 → 4) */}
      {loading && step === 2 && !isPaid && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-gray-800">Criando sua conta...</p>
          </div>
        </div>
      )}

      {/* Loading para paid (step 3 → 4) */}
      {loading && step === 3 && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-gray-800">Processando assinatura...</p>
          </div>
        </div>
      )}
    </div>
  )
}
