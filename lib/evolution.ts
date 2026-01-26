/**
 * Evolution API Integration Service
 * Handles communication with Evolution API for WhatsApp integration
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Types
export interface EvolutionInstance {
  instanceName: string;
  status: 'created' | 'connected' | 'disconnected';
  qrcode?: string;
}

export interface EvolutionConnectionState {
  state: 'open' | 'close' | 'connecting';
  instanceName: string;
}

export interface SendTextMessagePayload {
  number: string;
  text: string;
}

export interface SendTextMessageResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    extendedTextMessage: {
      text: string;
    };
  };
  messageTimestamp: number;
  status: string;
}

// Evolution API Service
export class EvolutionApiService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';

    if (!this.baseUrl || !this.apiKey) {
      console.warn('Evolution API credentials not configured');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(instanceName: string): Promise<EvolutionInstance> {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName,
        token: this.apiKey,
        qrcode: true,
      });

      return {
        instanceName: response.data.instance.instanceName,
        status: response.data.instance.status || 'created',
        qrcode: response.data.qrcode?.base64 || response.data.qrcode?.code,
      };
    } catch (error) {
      this.handleError(error, 'createInstance');
      throw error;
    }
  }

  /**
   * Get QR Code for connection
   */
  async getQRCode(instanceName: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/instance/connect/${instanceName}`);
      return response.data.qrcode?.base64 || response.data.qrcode?.code || null;
    } catch (error) {
      this.handleError(error, 'getQRCode');
      return null;
    }
  }

  /**
   * Get connection state of instance
   */
  async getConnectionState(instanceName: string): Promise<EvolutionConnectionState | null> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`);
      return {
        state: response.data.state,
        instanceName: response.data.instance?.instanceName || instanceName,
      };
    } catch (error) {
      this.handleError(error, 'getConnectionState');
      return null;
    }
  }

  /**
   * Delete instance (logout)
   */
  async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      await this.client.delete(`/instance/delete/${instanceName}`);
      return true;
    } catch (error) {
      this.handleError(error, 'deleteInstance');
      return false;
    }
  }

  /**
   * Send text message via WhatsApp
   */
  async sendTextMessage(
    instanceName: string,
    payload: SendTextMessagePayload
  ): Promise<SendTextMessageResponse | null> {
    try {
      const response = await this.client.post(
        `/message/sendText/${instanceName}`,
        payload
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'sendTextMessage');
      return null;
    }
  }

  /**
   * Set webhook URL for instance
   */
  async setWebhook(instanceName: string, webhookUrl: string): Promise<boolean> {
    try {
      await this.client.post(`/webhook/set/${instanceName}`, {
        url: webhookUrl,
        webhook_by_events: true,
        events: ['connection.update', 'messages.upsert'],
      });
      return true;
    } catch (error) {
      this.handleError(error, 'setWebhook');
      return false;
    }
  }

  /**
   * Error handler
   */
  private handleError(error: unknown, method: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`[EvolutionAPI:${method}] Error:`, {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
    } else {
      console.error(`[EvolutionAPI:${method}] Unexpected error:`, error);
    }
  }
}

// Export singleton instance
export const evolutionApi = new EvolutionApiService();
