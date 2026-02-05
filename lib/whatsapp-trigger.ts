/**
 * WhatsApp Notification Trigger Service v3.1
 * 
 * Centralized service for sending automated notifications to clients.
 * It interacts with n8n workflows that handle the actual message delivery logic,
 * including delays and scheduling.
 */

import { prisma } from './db';
import { Appointment, Client, WhatsAppConfig } from '@prisma/client';
import axios from 'axios';

/**
 * Payload structure sent to the n8n generic webhook
 */
interface NotificationPayload {
  /** Event identifier for the n8n workflow */
  event: 'appointment.created' | 'appointment.cancelled';
  /** ID of the associated appointment */
  appointmentId: string;
  /** ID of the owner user */
  userId: string;
  /** The WhatsApp instance to use for sending */
  instanceName: string;
  /** Destination phone number (client) */
  clientPhone: string;
  /** Name of the recipient */
  clientName: string;
  /** ISO timestamp of the appointment */
  appointmentDate: string;
  /** Optional service name */
  serviceName?: string;
  /** Optional assigned professional name */
  professionalName?: string;
  /** Optional business name */
  businessName?: string;
  /** The final formatted message to send */
  messageTemplate: string;
  /** Configured delay in minutes (handled by n8n) */
  delayMinutes: number;
}

export class WhatsAppTriggerService {
  /** Main webhook URL for generic notification actions */
  private static n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  /**
   * Replace mustache-style variables in message templates.
   * Supported: {{nome_cliente}}, {{data}}, {{hora}}, {{servico}}, {{profissional}}, {{empresa}}
   */
  private static replaceVariables(
    template: string,
    data: {
      clientName: string;
      appointmentDate: Date;
      serviceName?: string;
      professionalName?: string;
      businessName?: string;
    }
  ): string {
    const dateFormatted = new Date(data.appointmentDate).toLocaleDateString('pt-BR');
    const timeFormatted = new Date(data.appointmentDate).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return template
      .replace(/\{\{nome_cliente\}\}/g, data.clientName)
      .replace(/\{\{data\}\}/g, dateFormatted)
      .replace(/\{\{hora\}\}/g, timeFormatted)
      .replace(/\{\{servico\}\}/g, data.serviceName || 'Agendamento')
      .replace(/\{\{profissional\}\}/g, data.professionalName || 'Equipe')
      .replace(/\{\{empresa\}\}/g, data.businessName || 'Nossa Empresa');
  }

  /**
   * Send notification via n8n webhook
   */
  private static async sendToN8n(payload: NotificationPayload): Promise<boolean> {
    if (!this.n8nWebhookUrl) {
      console.warn('[WhatsAppTrigger] N8N webhook URL not configured');
      return false;
    }

    try {
      await axios.post(this.n8nWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds
      });

      console.log('[WhatsAppTrigger] Notification sent to n8n:', {
        event: payload.event,
        appointmentId: payload.appointmentId,
      });

      return true;
    } catch (error) {
      console.error('[WhatsAppTrigger] Error sending to n8n:', error);
      return false;
    }
  }

  /**
   * Trigger notification on appointment creation
   */
  static async onAppointmentCreated(
    appointment: Appointment & { client: Client; user: { businessName?: string | null } },
    serviceName?: string,
    professionalName?: string
  ): Promise<void> {
    try {
      // Get WhatsApp config
      const config = await prisma.whatsAppConfig.findUnique({
        where: { userId: appointment.userId },
      });

      // Check if notifications are enabled
      if (!config || !config.enabled || !config.isConnected || !config.notifyOnCreate) {
        console.log('[WhatsAppTrigger] Notifications disabled for appointment creation');
        return;
      }

      // Check if client has phone
      if (!appointment.client.phone) {
        console.warn('[WhatsAppTrigger] Client has no phone number');
        return;
      }

      // Prepare message
      const messageTemplate = config.createMessage || '';
      const message = this.replaceVariables(messageTemplate, {
        clientName: appointment.client.name,
        appointmentDate: appointment.date,
        serviceName,
        professionalName,
        businessName: appointment.user.businessName || undefined,
      });

      // Send to n8n
      await this.sendToN8n({
        event: 'appointment.created',
        appointmentId: appointment.id,
        userId: appointment.userId,
        instanceName: config.instanceName,
        clientPhone: appointment.client.phone,
        clientName: appointment.client.name,
        appointmentDate: appointment.date.toISOString(),
        serviceName,
        professionalName,
        businessName: appointment.user.businessName || undefined,
        messageTemplate: message,
        delayMinutes: config.createDelayMinutes,
      });
    } catch (error) {
      console.error('[WhatsAppTrigger] Error in onAppointmentCreated:', error);
      // Don't throw - notification failure shouldn't break appointment creation
    }
  }

  /**
   * Trigger notification on appointment cancellation
   */
  static async onAppointmentCancelled(
    appointment: Appointment & { client: Client; user: { businessName?: string | null } },
    serviceName?: string,
    professionalName?: string
  ): Promise<void> {
    try {
      // Get WhatsApp config
      const config = await prisma.whatsAppConfig.findUnique({
        where: { userId: appointment.userId },
      });

      // Check if notifications are enabled
      if (!config || !config.enabled || !config.isConnected || !config.notifyOnCancel) {
        console.log('[WhatsAppTrigger] Notifications disabled for appointment cancellation');
        return;
      }

      // Check if client has phone
      if (!appointment.client.phone) {
        console.warn('[WhatsAppTrigger] Client has no phone number');
        return;
      }

      // Prepare message
      const messageTemplate = config.cancelMessage || '';
      const message = this.replaceVariables(messageTemplate, {
        clientName: appointment.client.name,
        appointmentDate: appointment.date,
        serviceName,
        professionalName,
        businessName: appointment.user.businessName || undefined,
      });

      // Send to n8n
      await this.sendToN8n({
        event: 'appointment.cancelled',
        appointmentId: appointment.id,
        userId: appointment.userId,
        instanceName: config.instanceName,
        clientPhone: appointment.client.phone,
        clientName: appointment.client.name,
        appointmentDate: appointment.date.toISOString(),
        serviceName,
        professionalName,
        businessName: appointment.user.businessName || undefined,
        messageTemplate: message,
        delayMinutes: config.cancelDelayMinutes,
      });
    } catch (error) {
      console.error('[WhatsAppTrigger] Error in onAppointmentCancelled:', error);
      // Don't throw - notification failure shouldn't break cancellation
    }
  }
}
