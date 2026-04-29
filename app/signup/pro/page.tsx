import { Metadata } from 'next'
import Link from 'next/link'
import { PLAN_CONFIGS } from '@/lib/types'
import { AsaasSignupForm } from '@/components/auth/asaas-signup-form'

export const metadata: Metadata = {
  title: 'Cadastro Pro — Calenvo',
  description: 'Crie sua conta no plano Standard ou Premium com pagamento via PIX ou cartão.',
}

export default function ProSignupPage() {
  const standard = PLAN_CONFIGS['STANDARD']
  const premium = PLAN_CONFIGS['PREMIUM']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo / branding */}
        <div className="text-center mb-8 space-y-2">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">Calenvo</h1>
          </Link>
          <p className="text-muted-foreground">
            Assine o plano <strong>{standard.name}</strong> (R${' '}
            {standard.price.toFixed(2).replace('.', ',')}/mês) ou{' '}
            <strong>{premium.name}</strong> (R$ {premium.price.toFixed(2).replace('.', ',')}/mês)
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-background rounded-2xl shadow-lg border p-8">
          <h2 className="text-xl font-bold mb-6">Criar conta profissional</h2>
          <AsaasSignupForm defaultPlan="STANDARD" />
        </div>

        {/* Link plano gratuito */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Quer começar gratuitamente?{' '}
          <Link href="/signup" className="text-primary underline underline-offset-2">
            Cadastre-se no plano Freemium
          </Link>
        </p>
      </div>
    </div>
  )
}
