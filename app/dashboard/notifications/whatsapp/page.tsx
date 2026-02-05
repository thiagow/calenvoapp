import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppConnection } from './_components/whatsapp-connection';
import { NotificationSettings } from './_components/notification-settings';
import { NotificationTabs } from '@/components/notifications/notification-tabs';

interface ExtendedUser {
  id: string;
  email: string;
  planType?: string;
}

interface ExtendedSession {
  user: ExtendedUser;
}

export default async function NotificationsWhatsAppPage() {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Get user with plan type
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      planType: true,
      businessName: true,
    },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  const isPlanFree = user.planType === 'FREEMIUM';
  const hasAccess = !isPlanFree;

  // Get WhatsApp config if has access
  let whatsAppConfig = null;
  if (hasAccess) {
    whatsAppConfig = await prisma.whatsAppConfig.findUnique({
      where: { userId: user.id },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Notificações</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Configure notificações automáticas via WhatsApp para seus clientes
        </p>
      </div>

      {/* Tabs Navigation */}
      <NotificationTabs />

      {/* Content */}
      <div className="space-y-6">
        {/* Free Plan Blocker */}
        {isPlanFree && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Recurso Premium
              </CardTitle>
              <CardDescription>
                As notificações WhatsApp estão disponíveis apenas para planos Standard e Premium
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Benefícios das Notificações WhatsApp:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Reduza no-shows com lembretes automáticos</li>
                    <li>Confirme agendamentos instantaneamente</li>
                    <li>Notifique sobre cancelamentos</li>
                    <li>Personalize mensagens com variáveis dinâmicas</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="pt-2">
                <Link href="/dashboard/plans">
                  <Button size="lg" className="w-full sm:w-auto">
                    Fazer Upgrade do Plano
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* WhatsApp Connection (Only for paid plans) */}
        {hasAccess && (
          <>
            <WhatsAppConnection config={whatsAppConfig} />

            {/* Notification Settings */}
            {whatsAppConfig && whatsAppConfig.isConnected && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tipos de Notificações</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure quando e como suas mensagens serão enviadas
                  </p>
                </div>

                <NotificationSettings
                  config={whatsAppConfig}
                  disabled={!whatsAppConfig.isConnected}
                />
              </div>
            )}

            {/* Info when not connected */}
            {whatsAppConfig && !whatsAppConfig.isConnected && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">
                      Conecte seu WhatsApp para configurar as notificações
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
