/**
 * lib/asaas.ts
 * Serviço de integração com o gateway de pagamentos Asaas.
 * Uso exclusivo em Server Components e Route Handlers (nunca no client bundle).
 */

// ─── Configuração base ─────────────────────────────────────────────────────
const ASAAS_API_URL =
  process.env.ASAAS_API_URL ?? 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY ?? ''

// ─── Tipos de entrada ───────────────────────────────────────────────────────

export type AsaasBillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'

export interface AsaasCreateCustomerInput {
  name: string
  email: string
  phone?: string
  mobilePhone?: string
  cpfCnpj: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  externalReference?: string
  notificationDisabled?: boolean
}

export interface AsaasCreditCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface AsaasCreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  phone?: string
  mobilePhone?: string
}

export interface AsaasCreateSubscriptionInput {
  customer: string // ID do customer no Asaas
  billingType: AsaasBillingType
  value: number
  nextDueDate: string // YYYY-MM-DD
  cycle?: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  externalReference?: string
  // Cartão de crédito (apenas quando billingType === 'CREDIT_CARD')
  creditCard?: AsaasCreditCard
  creditCardHolderInfo?: AsaasCreditCardHolderInfo
}

// ─── Tipos de resposta ──────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  phone?: string
  mobilePhone?: string
  cpfCnpj?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  externalReference?: string
  dateCreated: string
  deleted: boolean
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string
  cycle: string
  description?: string
  externalReference?: string
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  dateCreated: string
}

export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS'

export interface AsaasPayment {
  id: string
  customer: string
  subscription?: string
  billingType: AsaasBillingType
  value: number
  netValue?: number
  status: AsaasPaymentStatus
  dueDate: string
  paymentDate?: string
  invoiceUrl?: string
  invoiceNumber?: string
  externalReference?: string
  description?: string
  dateCreated: string
}

export interface AsaasPixQrCode {
  encodedImage: string // Base64 da imagem do QR Code
  payload: string      // Código copia-cola (Pix BR Code)
  expirationDate?: string
}

export interface AsaasListResponse<T> {
  object: string
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: T[]
}

export interface AsaasError {
  errors: { code: string; description: string }[]
}

// ─── Helper de fetch ────────────────────────────────────────────────────────

class AsaasApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: { code: string; description: string }[],
  ) {
    super(errors.map(e => e.description).join(' | ') || `Asaas API error ${status}`)
    this.name = 'AsaasApiError'
  }
}

async function asaasFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${ASAAS_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
      ...(init.headers as Record<string, string>),
    },
  })

  if (!response.ok) {
    let errors: { code: string; description: string }[] = []
    try {
      const body = (await response.json()) as AsaasError
      errors = body.errors ?? []
    } catch {
      errors = [{ code: 'UNKNOWN', description: `HTTP ${response.status}` }]
    }
    throw new AsaasApiError(response.status, errors)
  }

  return response.json() as Promise<T>
}

// ─── Serviço público ────────────────────────────────────────────────────────

export const asaas = {
  /**
   * Cria um novo cliente no Asaas.
   * Equivale ao POST /customers
   */
  async createCustomer(data: AsaasCreateCustomerInput): Promise<AsaasCustomer> {
    return asaasFetch<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Busca um customer existente pelo ID.
   */
  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return asaasFetch<AsaasCustomer>(`/customers/${customerId}`)
  },

  /**
   * Cria uma nova assinatura recorrente (mensal por padrão).
   * Equivale ao POST /subscriptions
   */
  async createSubscription(
    data: AsaasCreateSubscriptionInput,
  ): Promise<AsaasSubscription> {
    return asaasFetch<AsaasSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        cycle: 'MONTHLY',
        ...data,
      }),
    })
  },

  /**
   * Retorna os detalhes de uma assinatura existente.
   */
  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
  },

  /**
   * Cancela uma assinatura (soft delete no Asaas).
   */
  async cancelSubscription(subscriptionId: string): Promise<{ deleted: boolean; id: string }> {
    return asaasFetch<{ deleted: boolean; id: string }>(
      `/subscriptions/${subscriptionId}`,
      { method: 'DELETE' },
    )
  },

  /**
   * Lista os pagamentos vinculados a uma assinatura.
   * Útil para buscar o pagamento pendente mais recente.
   */
  async getPaymentsBySubscription(
    subscriptionId: string,
  ): Promise<AsaasListResponse<AsaasPayment>> {
    return asaasFetch<AsaasListResponse<AsaasPayment>>(
      `/payments?subscription=${subscriptionId}&limit=10`,
    )
  },

  /**
   * Retorna o QR Code PIX de um pagamento pendente.
   * Disponível apenas para payments com billingType PIX.
   */
  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    return asaasFetch<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`)
  },

  /**
   * Retorna os detalhes de um único pagamento.
   */
  async getPayment(paymentId: string): Promise<AsaasPayment> {
    return asaasFetch<AsaasPayment>(`/payments/${paymentId}`)
  },
}

// Re-exportar o erro para uso em route handlers
export { AsaasApiError }
