
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Users, 
  Settings, 
  BarChart3, 
  CreditCard,
  Menu,
  X,
  Home,
  Briefcase,
  CalendarCheck,
  UserCog,
  Bell
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Agendamentos', href: '/dashboard/agenda', icon: CalendarCheck },
  { name: 'Agendas', href: '/dashboard/schedules', icon: Calendar },
  { name: 'Serviços', href: '/dashboard/services', icon: Briefcase },
  { name: 'Profissionais', href: '/dashboard/professionals', icon: UserCog },
  { name: 'Clientes', href: '/dashboard/patients', icon: Users },
  { name: 'Notificações', href: '/dashboard/notifications', icon: Bell },
  { name: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Planos', href: '/dashboard/plans', icon: CreditCard },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-50"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        'fixed top-0 left-0 z-40 h-screen w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="relative h-10 w-10">
                <Image
                  src="/calenvo-logo.png"
                  alt="Calenvo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl calenvo-gradient">Calenvo</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-gray-200 p-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <h3 className="text-sm font-medium text-blue-900">
                Precisa de ajuda?
              </h3>
              <p className="mt-1 text-xs text-blue-700">
                Entre em contato com nosso suporte
              </p>
              <Button 
                size="sm" 
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  window.open('mailto:suporte@calenvo.com.br?subject=Preciso de Ajuda - Calenvo', '_blank')
                }}
              >
                Falar com Suporte
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
