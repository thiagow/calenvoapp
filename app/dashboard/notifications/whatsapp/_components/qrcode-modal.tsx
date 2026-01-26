'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone } from 'lucide-react';
import Image from 'next/image';

interface QRCodeModalProps {
  qrCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodeModal({ qrCode, open, onOpenChange }: QRCodeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo com seu WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="flex justify-center p-4 bg-white rounded-lg border">
            {qrCode.startsWith('data:image') ? (
              <Image
                src={qrCode}
                alt="QR Code WhatsApp"
                width={256}
                height={256}
                className="rounded"
              />
            ) : (
              <Image
                src={`data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                width={256}
                height={256}
                className="rounded"
              />
            )}
          </div>

          {/* Instructions */}
          <Alert>
            <AlertDescription>
              <strong>Passo a passo:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-2 text-sm">
                <li>Abra o <strong>WhatsApp</strong> no seu celular</li>
                <li>
                  Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong>
                </li>
                <li>
                  Selecione <strong>Aparelhos conectados</strong>
                </li>
                <li>
                  Toque em <strong>Conectar um aparelho</strong>
                </li>
                <li>Aponte o celular para esta tela para escanear o código QR</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="text-center text-sm text-muted-foreground">
            <p>Este código expira em alguns minutos.</p>
            <p>Se expirar, feche esta janela e gere um novo código.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
