'use client';

import { useState } from 'react';
import { WhatsAppConfig } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Smartphone, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  createInstanceAction, 
  checkConnectionStatusAction, 
  deleteInstanceAction 
} from '@/app/actions/whatsapp';
import { QRCodeModal } from './qrcode-modal';

interface WhatsAppConnectionProps {
  config: WhatsAppConfig | null;
}

export function WhatsAppConnection({ config: initialConfig }: WhatsAppConnectionProps) {
  const [config, setConfig] = useState(initialConfig);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const { toast } = useToast();

  const isConnected = config?.isConnected ?? false;

  const handleConnect = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: 'Erro',
        description: 'Informe um número de telefone válido',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createInstanceAction(phoneNumber);
      
      if (result.success && result.data) {
        setQrCode(result.data.qrCode);
        setShowQRModal(true);
        
        toast({
          title: 'QR Code gerado',
          description: 'Escaneie o QR Code com seu WhatsApp',
        });
        
        // Refresh config after modal opens
        setTimeout(async () => {
          const statusResult = await checkConnectionStatusAction();
          if (statusResult.success) {
            window.location.reload();
          }
        }, 2000);
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao gerar QR Code',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao conectar WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      const result = await checkConnectionStatusAction();
      
      if (result.success && result.data) {
        const newStatus = result.data.isConnected;
        
        toast({
          title: newStatus ? 'Conectado' : 'Desconectado',
          description: newStatus 
            ? 'WhatsApp está conectado' 
            : 'WhatsApp não está conectado',
          variant: newStatus ? 'default' : 'destructive',
        });
        
        if (newStatus !== isConnected) {
          window.location.reload();
        }
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao verificar status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Status check error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao verificar status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar o WhatsApp? As notificações automáticas serão desativadas.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteInstanceAction();
      
      if (result.success) {
        toast({
          title: 'Desconectado',
          description: 'WhatsApp desconectado com sucesso',
        });
        window.location.reload();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao desconectar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desconectar WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Conexão WhatsApp
          </CardTitle>
          <CardDescription>
            Conecte seu número do WhatsApp Business para enviar notificações automáticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {isConnected ? 'Conectado' : 'Não conectado'}
                </p>
                {config?.phoneNumber && (
                  <p className="text-sm text-muted-foreground">
                    {config.phoneNumber}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Not Connected - Show Connection Form */}
          {!isConnected && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Como conectar:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Digite o número do WhatsApp Business (com DDD)</li>
                    <li>Clique em "Gerar QR Code"</li>
                    <li>Abra o WhatsApp no celular</li>
                    <li>Vá em Configurações → Aparelhos conectados</li>
                    <li>Escaneie o QR Code que aparecerá na tela</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número do WhatsApp (com DDD)</Label>
                <Input
                  id="phoneNumber"
                  placeholder="Ex: 11999999999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Informe apenas números, sem espaços ou caracteres especiais
                </p>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={loading || !phoneNumber}
                className="w-full"
              >
                {loading ? 'Gerando QR Code...' : 'Gerar QR Code'}
              </Button>
            </div>
          )}

          {/* Connected - Show Actions */}
          {isConnected && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCheckStatus}
                disabled={loading}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Verificar Status
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {qrCode && (
        <QRCodeModal
          qrCode={qrCode}
          open={showQRModal}
          onOpenChange={setShowQRModal}
        />
      )}
    </>
  );
}
