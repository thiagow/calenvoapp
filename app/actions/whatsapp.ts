'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { WhatsAppConfig } from '@prisma/client';

// Extend session type
interface ExtendedUser {
  id: string;
  email: string;
  name?: string;
}

interface ExtendedSession {
  user: ExtendedUser;
}

// Types
export type ActionState<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Schemas
const CreateInstanceSchema = z.object({
  phoneNumber: z.string().min(10, 'Número inválido'),
});

const WhatsAppSettingsSchema = z.object({
  enabled: z.boolean(),
  notifyOnCreate: z.boolean(),
  createDelayMinutes: z.number().min(0),
  createMessage: z.string().max(120).optional(),
  notifyOnCancel: z.boolean(),
  cancelDelayMinutes: z.number().min(0),
  cancelMessage: z.string().max(120).optional(),
  notifyConfirmation: z.boolean(),
  confirmationDays: z.number().min(0),
  confirmationMessage: z.string().max(120).optional(),
  notifyReminder: z.boolean(),
  reminderHours: z.number().min(0),
  reminderMessage: z.string().max(120).optional(),
});

// Default templates
const DEFAULT_TEMPLATES = {
  createMessage: 'Olá {{nome_cliente}}! Seu agendamento foi confirmado para {{data}} às {{hora}}. Serviço: {{servico}}. Até breve!',
  cancelMessage: 'Olá {{nome_cliente}}, seu agendamento do dia {{data}} às {{hora}} foi cancelado. Entre em contato para reagendar.',
  confirmationMessage: 'Olá {{nome_cliente}}! Lembrete: você tem agendamento em {{data}} às {{hora}}. Confirme sua presença respondendo SIM.',
  reminderMessage: 'Oi {{nome_cliente}}! Seu atendimento é daqui a poucas horas ({{hora}}). Te esperamos!',
};

// n8n Types
interface N8nRequest {
  action: 'createInstance' | 'getQRCode' | 'getConnectionState' | 'sendMessage' | 'deleteInstance';
  userId: string;
  payload: {
    instanceName?: string;
    phoneNumber?: string;
    webhookUrl?: string;
    message?: string;
    number?: string;
  };
}

interface N8nResponse {
  success: boolean;
  data?: {
    instanceName?: string;
    qrCode?: string;
    state?: 'open' | 'connecting' | 'connected' | 'closed';
    phoneNumber?: string;
  };
  error?: string;
}

/**
 * Call n8n webhook with 60s timeout
 */
async function callN8n(request: N8nRequest): Promise<N8nResponse> {
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!n8nUrl) {
    console.error('[callN8n] N8N_WEBHOOK_URL not configured');
    return { success: false, error: 'N8N_WEBHOOK_URL não configurado' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[callN8n] HTTP error:', response.status, response.statusText);
      return { success: false, error: `Erro HTTP: ${response.status}` };
    }

    const data = await response.json();
    return data as N8nResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[callN8n] Timeout after 60 seconds');
        return { success: false, error: 'Tempo limite excedido (60s)' };
      }
      console.error('[callN8n] Fetch error:', error.message);
      return { success: false, error: error.message };
    }
    console.error('[callN8n] Unknown error:', error);
    return { success: false, error: 'Erro desconhecido ao chamar n8n' };
  }
}

/**
 * Create WhatsApp instance and get QR Code
 */
export async function createInstanceAction(
  phoneNumber: string
): Promise<ActionState<{ qrCode: string; instanceName: string }>> {
  try {
    // Authentication
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session?.user?.id) {
      return { success: false, error: 'Não autenticado' };
    }

    // Validate input
    const validated = CreateInstanceSchema.parse({ phoneNumber });

    // Check if user already has instance
    const existing = await prisma.whatsAppConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (existing && existing.isConnected) {
      return { success: false, error: 'Já existe uma instância conectada' };
    }

    // Generate unique instance name
    const instanceName = `calenvo_${session.user.id}_${Date.now()}`;
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/evolution`;

    // Create instance via n8n
    const n8nResult = await callN8n({
      action: 'createInstance',
      userId: session.user.id,
      payload: {
        phoneNumber: validated.phoneNumber,
        webhookUrl,
      },
    });

    if (!n8nResult.success || !n8nResult.data?.qrCode) {
      return { success: false, error: n8nResult.error || 'Falha ao gerar QR Code' };
    }

    // Use instanceName from n8n response or fallback to generated one
    const finalInstanceName = n8nResult.data.instanceName || instanceName;

    // Save/Update in database
    const apiUrl = process.env.N8N_WEBHOOK_URL || '';
    
    if (existing) {
      await prisma.whatsAppConfig.update({
        where: { id: existing.id },
        data: {
          instanceName: finalInstanceName,
          phoneNumber: validated.phoneNumber,
          qrCode: n8nResult.data.qrCode,
          isConnected: false,
          apiUrl,
          // Set default templates if not set
          createMessage: existing.createMessage || DEFAULT_TEMPLATES.createMessage,
          cancelMessage: existing.cancelMessage || DEFAULT_TEMPLATES.cancelMessage,
          confirmationMessage: existing.confirmationMessage || DEFAULT_TEMPLATES.confirmationMessage,
          reminderMessage: existing.reminderMessage || DEFAULT_TEMPLATES.reminderMessage,
        },
      });
    } else {
      await prisma.whatsAppConfig.create({
        data: {
          userId: session.user.id,
          instanceName: finalInstanceName,
          phoneNumber: validated.phoneNumber,
          qrCode: n8nResult.data.qrCode,
          isConnected: false,
          apiUrl,
          createMessage: DEFAULT_TEMPLATES.createMessage,
          cancelMessage: DEFAULT_TEMPLATES.cancelMessage,
          confirmationMessage: DEFAULT_TEMPLATES.confirmationMessage,
          reminderMessage: DEFAULT_TEMPLATES.reminderMessage,
        },
      });
    }

    return {
      success: true,
      data: {
        qrCode: n8nResult.data.qrCode,
        instanceName: finalInstanceName,
      },
    };
  } catch (error) {
    console.error('[createInstanceAction] Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Erro ao criar instância' };
  }
}

/**
 * Get current WhatsApp configuration
 */
export async function getWhatsAppConfigAction(): Promise<ActionState<WhatsAppConfig | null>> {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session?.user?.id) {
      return { success: false, error: 'Não autenticado' };
    }

    const config = await prisma.whatsAppConfig.findUnique({
      where: { userId: session.user.id },
    });

    return { success: true, data: config };
  } catch (error) {
    console.error('[getWhatsAppConfigAction] Error:', error);
    return { success: false, error: 'Erro ao buscar configuração' };
  }
}

/**
 * Check connection status
 */
export async function checkConnectionStatusAction(): Promise<ActionState<{ isConnected: boolean }>> {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session?.user?.id) {
      return { success: false, error: 'Não autenticado' };
    }

    const config = await prisma.whatsAppConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!config) {
      return { success: true, data: { isConnected: false } };
    }

    // Check with n8n
    const n8nResult = await callN8n({
      action: 'getConnectionState',
      userId: session.user.id,
      payload: {
        instanceName: config.instanceName,
      },
    });

    if (!n8nResult.success) {
      console.error('[checkConnectionStatusAction] n8n error:', n8nResult.error);
      return { success: false, error: n8nResult.error || 'Erro ao verificar status' };
    }

    const isConnected = n8nResult.data?.state === 'open' || n8nResult.data?.state === 'connected';

    // Update if different
    if (isConnected !== config.isConnected) {
      await prisma.whatsAppConfig.update({
        where: { id: config.id },
        data: { isConnected },
      });
    }

    return { success: true, data: { isConnected } };
  } catch (error) {
    console.error('[checkConnectionStatusAction] Error:', error);
    return { success: false, error: 'Erro ao verificar status' };
  }
}

/**
 * Delete instance (disconnect)
 */
export async function deleteInstanceAction(): Promise<ActionState<void>> {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session?.user?.id) {
      return { success: false, error: 'Não autenticado' };
    }

    const config = await prisma.whatsAppConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!config) {
      return { success: false, error: 'Configuração não encontrada' };
    }

    // Delete via n8n
    const n8nResult = await callN8n({
      action: 'deleteInstance',
      userId: session.user.id,
      payload: {
        instanceName: config.instanceName,
      },
    });

    if (!n8nResult.success) {
      console.error('[deleteInstanceAction] n8n error:', n8nResult.error);
      // Continue even if n8n fails - update local database
    }

    // Update database
    await prisma.whatsAppConfig.update({
      where: { id: config.id },
      data: {
        isConnected: false,
        qrCode: null,
        enabled: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[deleteInstanceAction] Error:', error);
    return { success: false, error: 'Erro ao desconectar' };
  }
}

/**
 * Update WhatsApp notification settings
 */
export async function updateWhatsAppSettingsAction(
  data: z.infer<typeof WhatsAppSettingsSchema>
): Promise<ActionState<WhatsAppConfig>> {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session?.user?.id) {
      return { success: false, error: 'Não autenticado' };
    }

    // Validate
    const validated = WhatsAppSettingsSchema.parse(data);

    const config = await prisma.whatsAppConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!config) {
      return { success: false, error: 'Configuração não encontrada. Conecte o WhatsApp primeiro.' };
    }

    // Update settings
    const updated = await prisma.whatsAppConfig.update({
      where: { id: config.id },
      data: validated,
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error('[updateWhatsAppSettingsAction] Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Erro ao salvar configurações' };
  }
}

/**
 * Send test message
 */
export async function sendTestMessageAction(
  type: 'create' | 'cancel' | 'confirmation' | 'reminder'
): Promise<ActionState<void>> {
  try {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (!session?.user?.id) {
      return { success: false, error: 'Não autenticado' };
    }

    const config = await prisma.whatsAppConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!config || !config.isConnected) {
      return { success: false, error: 'WhatsApp não conectado' };
    }

    if (!config.phoneNumber) {
      return { success: false, error: 'Número não configurado' };
    }

    // Get template based on type
    let message = '';
    switch (type) {
      case 'create':
        message = config.createMessage || DEFAULT_TEMPLATES.createMessage;
        break;
      case 'cancel':
        message = config.cancelMessage || DEFAULT_TEMPLATES.cancelMessage;
        break;
      case 'confirmation':
        message = config.confirmationMessage || DEFAULT_TEMPLATES.confirmationMessage;
        break;
      case 'reminder':
        message = config.reminderMessage || DEFAULT_TEMPLATES.reminderMessage;
        break;
    }

    // Replace variables with examples
    message = message
      .replace(/\{\{nome_cliente\}\}/g, 'João Silva')
      .replace(/\{\{data\}\}/g, '25/01/2026')
      .replace(/\{\{hora\}\}/g, '14:00')
      .replace(/\{\{servico\}\}/g, 'Exemplo de Serviço')
      .replace(/\{\{profissional\}\}/g, 'Profissional Exemplo')
      .replace(/\{\{empresa\}\}/g, 'Sua Empresa');

    // Send via n8n
    const n8nResult = await callN8n({
      action: 'sendMessage',
      userId: session.user.id,
      payload: {
        instanceName: config.instanceName,
        number: config.phoneNumber,
        message: `📱 MENSAGEM DE TESTE:\n\n${message}`,
      },
    });

    if (!n8nResult.success) {
      return { success: false, error: n8nResult.error || 'Falha ao enviar mensagem' };
    }

    return { success: true };
  } catch (error) {
    console.error('[sendTestMessageAction] Error:', error);
    return { success: false, error: 'Erro ao enviar mensagem de teste' };
  }
}
