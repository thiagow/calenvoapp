'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CreditCard, QrCode, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PLAN_CONFIGS } from '@/lib/types'
import { PixQrDisplay } from './pix-qr-display'
import { PlanType } from '@prisma/client'

const SEGMENT_OPTIONS = [
  { value: 'BEAUTY_SALON', label: 'Salão de Beleza' },
  { value: 'BARBERSHOP', label: 'Barbearia' },
  { value: 'AESTHETIC_CLINIC', label: 'Clínica de Estética' },
  { value: 'TECH_SAAS', label: 'Tecnologia / SaaS' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Consultoria / Mentoria' },
  { value: 'HR', label: 'Recursos Humanos' },
  { value: 'PHYSIOTHERAPY', label: 'Fisioterapia' },
  { value: 'EDUCATION', label: 'Educação' },
  { value: 'PET_SHOP', label: 'Pet Shop' },
  { value: 'OTHER', label: 'Outro' },
]

interface PixResult {
  pixPayload: string | null
  pixEncodedImage: string | null
  invoiceUrl: string | null
  value: number
}

interface AsaasSignupFormProps {
  defaultPlan?: PlanType
}

export function AsaasSignupForm({ defaultPlan = 'STANDARD' }: AsaasSignupFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pixResult, setPixResult] = useState<PixResult | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    segmentType: 'BEAUTY_SALON',
    phone: '',
    planKey: defaultPlan as string,
    billingType: 'PIX',
    document: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    // Cartão
    cardHolderName: '',
    cardNumber: '',
    cardExpMonth: '',
    cardExpYear: '',
    cardCcv: '',
    cardHolderCpf: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function formatDocument(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  function formatPostalCode(value: string) {
    return value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
  }

  function formatPhone(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const cleanDoc = form.document.replace(/\D/g, '')
    const cleanCep = form.postalCode.replace(/\D/g, '')
    const cleanPhone = form.phone.replace(/\D/g, '')

    const payload: Record<string, unknown> = {
      email: form.email,
      password: form.password,
      name: form.name,
      businessName: form.businessName,
      segmentType: form.segmentType,
      phone: cleanPhone || undefined,
      planKey: form.planKey,
      billingType: form.billingType,
      document: cleanDoc,
      postalCode: cleanCep || undefined,
      address: form.address || undefined,
      addressNumber: form.addressNumber || undefined,
    }

    if (form.billingType === 'CREDIT_CARD') {
      payload.creditCard = {
        holderName: form.cardHolderName,
        number: form.cardNumber.replace(/\D/g, ''),
        expiryMonth: form.cardExpMonth,
        expiryYear: form.cardExpYear,
        ccv: form.cardCcv,
      }
      payload.creditCardHolderInfo = {
        name: form.cardHolderName,
        email: form.email,
        cpfCnpj: form.cardHolderCpf.replace(/\D/g, '') || cleanDoc,
        postalCode: cleanCep,
        addressNumber: form.addressNumber,
        phone: cleanPhone || undefined,
      }
    }

    try {
      const res = await fetch('/api/asaas/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao criar conta. Tente novamente.')
        return
      }

      if (form.billingType === 'PIX' && (data.pixPayload || data.pixEncodedImage)) {
        setPixResult({
          pixPayload: data.pixPayload,
          pixEncodedImage: data.pixEncodedImage,
          invoiceUrl: data.invoiceUrl,
          value: PLAN_CONFIGS[form.planKey as PlanType]?.price ?? 0,
        })
        toast.success('Conta criada! Realize o pagamento para ativar.')
      } else {
        toast.success('Conta criada com sucesso! Faça login para continuar.')
        router.push('/login?message=Conta criada! Faça login.')
      }
    } catch {
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Exibir QR Code após cadastro PIX
  if (pixResult) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
          <h2 className="text-xl font-bold">Conta criada!</h2>
          <p className="text-sm text-muted-foreground">
            Pague com PIX para ativar o acesso ao Calenvo.
          </p>
        </div>
        <PixQrDisplay
          pixPayload={pixResult.pixPayload}
          pixEncodedImage={pixResult.pixEncodedImage}
          invoiceUrl={pixResult.invoiceUrl}
          value={pixResult.value}
        />
        <p className="text-center text-xs text-muted-foreground">
          Após a confirmação do pagamento, faça login com seu e-mail e senha cadastrados.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/login')}
        >
          Ir para o Login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Seleção de plano */}
      <div className="grid grid-cols-2 gap-3">
        {(['STANDARD', 'PREMIUM'] as PlanType[]).map(plan => {
          const cfg = PLAN_CONFIGS[plan]
          const selected = form.planKey === plan
          return (
            <button
              key={plan}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, planKey: plan }))}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                selected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <div className="font-semibold text-sm">{cfg.name}</div>
              <div className="text-lg font-bold text-primary">
                R$ {cfg.price.toFixed(2).replace('.', ',')}
                <span className="text-xs font-normal text-muted-foreground">/mês</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Dados pessoais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo *</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Seu nome"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessName">Nome do negócio *</Label>
          <Input
            id="businessName"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            placeholder="Ex: Salão da Maria"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="voce@email.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Celular</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={e =>
              setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))
            }
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="segmentType">Segmento *</Label>
          <Select
            value={form.segmentType}
            onValueChange={v => setForm(prev => ({ ...prev, segmentType: v }))}
          >
            <SelectTrigger id="segmentType">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {SEGMENT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dados de cobrança */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="document">CPF / CNPJ *</Label>
          <Input
            id="document"
            name="document"
            value={form.document}
            onChange={e =>
              setForm(prev => ({ ...prev, document: formatDocument(e.target.value) }))
            }
            placeholder="000.000.000-00"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postalCode">CEP</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={form.postalCode}
            onChange={e =>
              setForm(prev => ({ ...prev, postalCode: formatPostalCode(e.target.value) }))
            }
            placeholder="00000-000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Rua, Avenida..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addressNumber">Número</Label>
          <Input
            id="addressNumber"
            name="addressNumber"
            value={form.addressNumber}
            onChange={handleChange}
            placeholder="123"
          />
        </div>
      </div>

      {/* Método de pagamento */}
      <div className="space-y-2">
        <Label>Forma de pagamento *</Label>
        <Tabs
          value={form.billingType}
          onValueChange={v => setForm(prev => ({ ...prev, billingType: v }))}
        >
          <TabsList className="w-full">
            <TabsTrigger value="PIX" className="flex-1">
              <QrCode className="h-4 w-4 mr-2" />
              PIX
            </TabsTrigger>
            <TabsTrigger value="CREDIT_CARD" className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              Cartão de Crédito
            </TabsTrigger>
          </TabsList>

          <TabsContent value="PIX">
            <Card>
              <CardContent className="pt-4 pb-3 text-sm text-muted-foreground space-y-1">
                <p>✓ Pagamento instantâneo via Pix</p>
                <p>✓ QR Code gerado após o cadastro</p>
                <p>✓ Acesso liberado automaticamente após confirmação</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="CREDIT_CARD">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cardHolderName">Nome no cartão *</Label>
                  <Input
                    id="cardHolderName"
                    name="cardHolderName"
                    value={form.cardHolderName}
                    onChange={handleChange}
                    placeholder="Como impresso no cartão"
                    required={form.billingType === 'CREDIT_CARD'}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cardNumber">Número do cartão *</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        cardNumber: e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 16)
                          .replace(/(\d{4})(?=\d)/g, '$1 '),
                      }))
                    }
                    placeholder="0000 0000 0000 0000"
                    required={form.billingType === 'CREDIT_CARD'}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cardExpMonth">Mês *</Label>
                    <Input
                      id="cardExpMonth"
                      name="cardExpMonth"
                      value={form.cardExpMonth}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          cardExpMonth: e.target.value.replace(/\D/g, '').slice(0, 2),
                        }))
                      }
                      placeholder="MM"
                      maxLength={2}
                      required={form.billingType === 'CREDIT_CARD'}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cardExpYear">Ano *</Label>
                    <Input
                      id="cardExpYear"
                      name="cardExpYear"
                      value={form.cardExpYear}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          cardExpYear: e.target.value.replace(/\D/g, '').slice(0, 4),
                        }))
                      }
                      placeholder="AAAA"
                      maxLength={4}
                      required={form.billingType === 'CREDIT_CARD'}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cardCcv">CVV *</Label>
                    <Input
                      id="cardCcv"
                      name="cardCcv"
                      value={form.cardCcv}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          cardCcv: e.target.value.replace(/\D/g, '').slice(0, 4),
                        }))
                      }
                      placeholder="123"
                      maxLength={4}
                      required={form.billingType === 'CREDIT_CARD'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            {form.billingType === 'PIX' ? (
              <QrCode className="h-4 w-4 mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Criar conta e {form.billingType === 'PIX' ? 'gerar PIX' : 'assinar'}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Já tem uma conta?{' '}
        <a href="/login" className="text-primary underline underline-offset-2">
          Fazer login
        </a>
      </p>
    </form>
  )
}
