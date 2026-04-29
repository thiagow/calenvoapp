'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Copy, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PixQrDisplayProps {
  pixPayload?: string | null
  pixEncodedImage?: string | null
  invoiceUrl?: string | null
  value?: number
}

export function PixQrDisplay({
  pixPayload,
  pixEncodedImage,
  invoiceUrl,
  value,
}: PixQrDisplayProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!pixPayload) return
    try {
      await navigator.clipboard.writeText(pixPayload)
      setCopied(true)
      toast.success('Código PIX copiado!')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente.')
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Valor */}
      {value != null && (
        <p className="text-sm text-muted-foreground">
          Valor:{' '}
          <strong className="text-foreground">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(value)}
            /mês
          </strong>
        </p>
      )}

      {/* QR Code */}
      {pixEncodedImage ? (
        <div className="border rounded-xl p-3 bg-white shadow-sm">
          <Image
            src={`data:image/png;base64,${pixEncodedImage}`}
            alt="QR Code PIX"
            width={200}
            height={200}
            className="rounded"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-[200px] h-[200px] bg-muted rounded-xl flex items-center justify-center">
          <Clock className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
      )}

      {/* Código copia-cola */}
      {pixPayload ? (
        <div className="w-full space-y-2">
          <p className="text-xs text-muted-foreground text-center">Ou copie o código abaixo:</p>
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border bg-muted px-3 py-2',
              'text-xs font-mono text-muted-foreground break-all',
            )}
          >
            <span className="flex-1 line-clamp-2">{pixPayload}</span>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 h-7 w-7 p-0"
              onClick={handleCopy}
              aria-label="Copiar código PIX"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            className="w-full"
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar código PIX
              </>
            )}
          </Button>
        </div>
      ) : null}

      {/* Link da fatura */}
      {invoiceUrl && (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline underline-offset-2"
        >
          Ver fatura completa
        </a>
      )}

      {/* Instrução */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-center">
        <Clock className="inline h-4 w-4 mr-1 -mt-0.5" />
        Seu acesso será <strong>liberado automaticamente</strong> assim que o pagamento for confirmado.
      </div>
    </div>
  )
}
