
import { SignupWizard } from '@/components/auth/signup-wizard'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="relative h-10 w-10">
              <Image
                src="/calenvo-logo.png"
                alt="Calenvo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl calenvo-gradient">Calenvo</span>
          </Link>
          <p className="text-gray-600 mt-3 text-sm">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Faça login
            </Link>
          </p>
        </div>

        {/* Wizard */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8">
          <SignupWizard />
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Ao criar uma conta, você concorda com nossos{' '}
          <Link href="/" className="underline hover:text-gray-700">termos de uso</Link>.
        </p>
      </div>
    </div>
  )
}

