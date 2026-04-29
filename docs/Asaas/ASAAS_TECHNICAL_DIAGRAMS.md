# 🔧 Asaas Integration - Diagramas Técnicos & Casos de Uso

---

## 📊 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONT-END (React)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  RegisterForm    │  │ PlanProfileScreen│  │PendingPaymentSc│ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────┘  │
│           │                     │                     │         │
└───────────┼─────────────────────┼─────────────────────┼─────────┘
            │ POST /register      │ POST /cancel        │ GET /pending
            │ + cartão/PIX        │ + JWT               │ + JWT
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (NestJS)                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   AUTH MODULE                            │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ AuthController                                   │   │  │
│  │  │ - POST /register (RegisterDto)                  │   │  │
│  │  └─────────────────┬───────────────────────────────┘   │  │
│  │                    │                                    │  │
│  │  ┌────────────────▼────────────────────────────────┐   │  │
│  │  │ AuthService.register()                          │   │  │
│  │  │ 1. Validar email único                          │   │  │
│  │  │ 2. Hash password                                │   │  │
│  │  │ 3. Tx.academy.create()                          │   │  │
│  │  │ 4. Tx.user.create()                             │   │  │
│  │  │ 5. → AsaasService.createCustomer() ──────┐     │   │  │
│  │  │ 6. → AsaasService.createSubscription() ──┼┐    │   │  │
│  │  │ 7. → AsaasService.getPaymentsBySubscription()─┐│    │   │  │
│  │  │ 8. → AsaasService.getPixQrCode() ────────┼┼┬┐  │   │  │
│  │  │ 9. Tx.academy.update(asaasIds)          │││││  │   │  │
│  │  │ 10. Gerar JWT tokens                     │││││  │   │  │
│  │  │ 11. Retornar { tokens, pixPayload }    │││││  │   │  │
│  │  └────────────────┬───────────────────────│││││──┘   │  │
│  └─────────────────┼──────────────────────┼───┼┼┼┘      │  │
│                    │                      │   │││        │  │
│  ┌────────────────┴──────────────────┬───┴───┘││        │  │
│  │           ASAAS MODULE             │       ││        │  │
│  │  ┌────────────────────────────────▼─┐    ││        │  │
│  │  │ AsaasService                      │    ││        │  │
│  │  │ - createCustomer(...)            │◀────┘│        │  │
│  │  │ - createSubscription(...)        │◀─────┘        │  │
│  │  │ - cancelSubscription(...)        │               │  │
│  │  │ - getPaymentsBySubscription(...) │               │  │
│  │  │ - getPixQrCode(...)              │               │  │
│  │  │ - getSubscription(...)           │               │  │
│  │  └────────┬───────────────────────┬─┘               │  │
│  │           │                       │                 │  │
│  │  ┌────────▼──────────────────────▼─────┐            │  │
│  │  │ AsaasController                      │            │  │
│  │  │ - POST /subscription/cancel         │            │  │
│  │  │ - POST /subscription/upgrade        │            │  │
│  │  │ - GET /subscription/pending-payment │            │  │
│  │  └────────┬───────────────────────────┘             │  │
│  │           │                                         │  │
│  │  ┌────────▼──────────────────────────────────────┐  │  │
│  │  │ AsaasWebhookController                        │  │  │
│  │  │ - POST /webhook                               │  │  │
│  │  │ - Validar token                               │  │  │
│  │  │ - Log + Idempotência                          │  │  │
│  │  │ - Processar eventos:                          │  │  │
│  │  │   • PAYMENT_RECEIVED → isActive=true          │  │  │
│  │  │   • PAYMENT_OVERDUE → isActive=false          │  │  │
│  │  │   • PAYMENT_REFUNDED → isActive=false         │  │  │
│  │  └──────────────┬────────────────────────────────┘  │  │
│  └───────────────┼──────────────────────────────────────┘  │
│                  │                                         │
└──────────────────┼─────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   PRISMA / Database  │
        │  ┌────────────────┐  │
        │  │ academies      │  │
        │  │ - id           │  │
        │  │ - name         │  │
        │  │ - isActive     │  │
        │  │ - asaasCustom..│  │
        │  │ - asaasSubscr..│  │
        │  └────────────────┘  │
        │  ┌────────────────┐  │
        │  │ asaas_webhook_│  │
        │  │ logs           │  │
        │  │ - id           │  │
        │  │ - asaasEvent   │  │
        │  │ - paymentId    │  │
        │  │ - processed    │  │
        │  │ - payload      │  │
        │  └────────────────┘  │
        └──────────────────────┘
                   ▲
                   │
        ┌──────────┴──────────────┐
        │  ASAAS EXTERNAL API     │
        │ https://sandbox.asaas.. │
        │                         │
        │ POST /customers         │
        │ POST /subscriptions     │
        │ DELETE /subscriptions   │
        │ GET /payments           │
        │ GET /payments/.../pix.. │
        │ GET /subscriptions      │
        └─────────────────────────┘
```

---

## 🔄 Sequência: Registro com Plano Pago (PIX)

```
Frontend                    Backend                     Asaas
  │                          │                          │
  ├─ POST /register ────────▶│                          │
  │  {academyName,          │ AuthService.register()    │
  │   email,                │ ├─ Criar Academy (TX)     │
  │   password,             │ ├─ Criar User (TX)        │
  │   phone,                │ └─ Criar MembershipPlan   │
  │   planId,               │    (TX)                   │
  │   document,             │                          │
  │   paymentMethod: PIX}   │                          │
  │                          │                          │
  │                          ├─ createCustomer()       │
  │                          ├─────────────────────────▶│
  │                          │                         │
  │                          │◀─ { id: cus_... }      │
  │                          │                        │
  │                          ├─ createSubscription()  │
  │                          │ (billingType: PIX)      │
  │                          ├────────────────────────▶│
  │                          │                        │
  │                          │◀─ { id: sub_..., ... } │
  │                          │                        │
  │                          ├─ getPaymentsBySubscr() │
  │                          ├────────────────────────▶│
  │                          │                        │
  │                          │◀─ { data: [{id: pay_..│
  │                          │              status:   │
  │                          │              PENDING}] │
  │                          │                        │
  │                          ├─ getPixQrCode()       │
  │                          ├────────────────────────▶│
  │                          │                        │
  │                          │◀─ { encodedImage,      │
  │                          │     payload,           │
  │                          │     expirationDate }   │
  │                          │                        │
  │                          ├─ academy.update()      │
  │                          │ (asaasCustomerId,      │
  │                          │  asaasSubscriptionId)  │
  │                          │                        │
  │◀────────────────────────│                        │
  │ {accessToken,            │                        │
  │  pixPayload,             │                        │
  │  pixEncodedImage}        │                        │
  │                          │                        │
  ├─ Exibir QR Code ────────┤                        │
  │ (usuário escaneia e │                        │
  │  confirma PIX)      │                        │
  │                          │  webhook: PAYMENT_  │
  │                          │  RECEIVED ◀─────────┤
  │                          │                     │
  │                          ├─ handleWebhook()    │
  │                          ├─ Validar token      │
  │                          ├─ Verificar dup.    │
  │                          ├─ Encontrar academy  │
  │                          ├─ academy.update()  │
  │                          │ (isActive: true)   │
  │                          ├─ Log webhook proc. │
  │                          │                    │
  │ Acesso habilitado ◀──────┤                    │
```

---

## 🔄 Sequência: Cancelamento de Assinatura

```
Frontend                    Backend              Asaas
  │                          │                   │
  ├─ POST /cancel ─────────▶│ AsaasController    │
  │  (JWT token)             │ cancelSubscription()
  │                          │ ├─ Verificar role  │
  │                          │ ├─ Encontrar acad. │
  │                          │ │                  │
  │                          │ ├─ cancelSub()    │
  │                          │ ├─────────────────▶│
  │                          │                   │
  │                          │◀─ success        │
  │                          │                   │
  │                          ├─ academy.update()│
  │                          │ (asaasSub=null)  │
  │                          │                   │
  │◀───────────────────────│                    │
  │ {message: "Cancelada"}  │                    │
  │                          │  webhook: PAYMENT_│
  │                          │  DELETED ◀────────┤
  │                          │                  │
  │                          ├─ handleWebhook() │
  │                          ├─ Log event       │
  │                          │ (informativo)    │
```

---

## 🔄 Sequência: Webhook com Idempotência

```
Asaas                       Backend                Database
  │                          │                      │
  ├─ Webhook #1 ───────────▶│                      │
  │ PAYMENT_RECEIVED         │ handleWebhook()      │
  │                          │ ├─ validar token    │
  │                          ├─ asaasWebhookLog   │
  │                          ├─ CREATE (proc=false)├──▶
  │                          │                      │
  │                          ├─ findFirst()       │
  │                          │ (paymentId=X,       ├──▶
  │                          │  processed=true)    │
  │                          │ ├─ NOT FOUND        │
  │                          │ ├─ academy.update() ├──▶
  │                          │ │ (isActive=true)   │
  │                          │ ├─ webhook UPDATE   ├──▶
  │                          │ │ (processed=true)  │
  │                          │ ├─ return {200}    │
  │                          │                     │
  │ (retry) ──────────────▶│                     │
  │ Webhook #2              │ handleWebhook()      │
  │ PAYMENT_RECEIVED        │ ├─ validar token    │
  │                          ├─ asaasWebhookLog   │
  │                          ├─ CREATE (proc=false)├──▶
  │                          │                      │
  │                          ├─ findFirst()       │
  │                          │ (paymentId=X,       ├──▶
  │                          │  processed=true)    │
  │                          │ ├─ FOUND! ✓        │
  │                          │ ├─ return {200}    │
  │                          │ │ (sem duplicar)    │
  │                          │                     │
```

---

## 📦 Data Models & DTOs

### RegisterDto (Entrada)

```typescript
{
  academyName: string;
  email: string;
  name: string;
  password: string;
  phone: string;
  planId?: string;
  trialDays?: number;
  document?: string; // CPF/CNPJ
  paymentMethod?: 'PIX' | 'CREDIT_CARD'; // Para selector
  creditCard?: {
    holderName: string;
    number: string;        // sem espaços: 4111111111111111
    expiryMonth: string;   // "12"
    expiryYear: string;    // "25"
    ccv: string;          // "123"
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;      // 11 ou 14 dígitos, sem máscara
    postalCode: string;   // "01234567"
    addressNumber: string; // "123"
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
  postalCode?: string;
  address?: string;
  addressNumber?: string;
}
```

### AsaasService.createCustomer() → Response

```typescript
{
  id: "cus_123456789abc",      // ID único do cliente no Asaas
  name: "Iron Fist Gym",
  email: "admin@ironfist.com",
  phone: "11987654321",
  cpfCnpj: "12345678901234",
  externalReference: "acad-uuid", // nosso academyId
  postalCode: "01234567",
  address: "Rua Principal",
  addressNumber: "123",
  createdAt: "2026-04-26T10:00:00Z",
  // ... mais fields
}
```

### AsaasService.createSubscription() → Response

```typescript
{
  id: "sub_123456789abc",       // ID único da assinatura
  customer: "cus_123456789abc",
  billingType: "PIX",
  value: 99.99,
  cycle: "MONTHLY",
  status: "PENDING",
  nextDueDate: "2026-05-26",
  description: "Assinatura Saas - Plano Pro",
  externalReference: "acad-uuid",
  createdAt: "2026-04-26T10:00:00Z",
  // ... mais fields
}
```

### Payment Object (from getPaymentsBySubscription())

```typescript
{
  id: "pay_123456789abc",
  subscription: "sub_123456789abc",
  customer: "cus_123456789abc",
  billingType: "PIX",
  status: "PENDING" | "CONFIRMED" | "OVERDUE" | "REFUNDED",
  value: 99.99,
  dueDate: "2026-05-26",
  invoiceUrl: "https://asaas.com/invoice/...",
  externalReference: "acad-uuid",
  createdAt: "2026-04-26T10:00:00Z",
  // ... mais fields
}
```

### PIX QR Code Response

```typescript
{
  encodedImage: "iVBORw0KGgoAAAANSUhEUgAAAKgAA...", // Base64 PNG
  payload: "00020126360014br.gov.bcb.brcode...",      // String PIX copia-cola
  expirationDate: "2026-04-26T12:00:00Z",
  status: "ACTIVE"
}
```

### Webhook Payload (Asaas → Backend)

```typescript
{
  event: "PAYMENT_RECEIVED" | "PAYMENT_CONFIRMED" | "PAYMENT_OVERDUE" | 
         "PAYMENT_REFUNDED" | "PAYMENT_CHARGEBACK_REQUESTED" | "PAYMENT_DELETED",
  payment: {
    id: "pay_123456789abc",
    subscription: "sub_123456789abc",
    customer: "cus_123456789abc",
    status: "CONFIRMED",
    value: 99.99,
    dueDate: "2026-05-26",
    confirmedDate: "2026-04-26",
    externalReference: "acad-uuid", // ← KEY para encontrar academy
    billingType: "PIX",
    invoiceUrl: "https://...",
    // ... mais fields
  }
}
```

---

## 📋 Eventos de Webhook & Ações

| Evento | Descrição | Ação no Backend |
|--------|-----------|-----------------|
| `PAYMENT_RECEIVED` | Pagamento recebido e confirmado | `academy.isActive = true` |
| `PAYMENT_CONFIRMED` | Cartão confirmado (igual a RECEIVED) | `academy.isActive = true` |
| `PAYMENT_PENDING` | Pagamento pendente (waiting) | (informativo, sem ação) |
| `PAYMENT_OVERDUE` | Pagamento vencido | `academy.isActive = false` |
| `PAYMENT_REFUNDED` | Reembolso processado | `academy.isActive = false` |
| `PAYMENT_CHARGEBACK_REQUESTED` | Disputa/chargeback | `academy.isActive = false` |
| `PAYMENT_DELETED` | Pagamento deletado (assinatura cancelada) | (log apenas) |
| `PAYMENT_AWAITING_RISK_ANALYSIS` | Análise de fraude | (informativo) |

---

## 🔒 Campos Obrigatórios por Operação

### createCustomer()

```
✓ name (string)
✓ email (string)
○ phone (string) - recomendado
○ cpfCnpj (string) - recomendado
○ externalReference (string) - obrigatório para match webhook
○ postalCode (string) - recomendado
○ address (string) - recomendado
○ addressNumber (string) - recomendado
```

### createSubscription()

```
✓ customer (string) - ID do customer
✓ billingType (enum) - 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED'
✓ value (number) - valor em real (ex: 99.99)
✓ nextDueDate (string) - formato YYYY-MM-DD
✓ cycle (enum) - 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
○ description (string) - recomendado para notas
○ externalReference (string) - obrigatório para match webhook
○ creditCard (object) - obrigatório se billingType = 'CREDIT_CARD'
  ✓ holderName (string)
  ✓ number (string) - sem espaços/caracteres
  ✓ expiryMonth (string) - "01" a "12"
  ✓ expiryYear (string) - "25" para 2025
  ✓ ccv (string) - "123"
○ creditCardHolderInfo (object) - obrigatório se creditCard fornecido
  ✓ name (string)
  ✓ email (string)
  ✓ cpfCnpj (string) - 11 (CPF) ou 14 (CNPJ) dígitos
  ✓ postalCode (string) - 8 dígitos
  ✓ addressNumber (string)
  ○ addressComplement (string)
  ✓ phone (string)
  ○ mobilePhone (string)
```

---

## 🛡️ Validações Críticas

### CPF/CNPJ

```typescript
// CPF: 11 dígitos
// CNPJ: 14 dígitos
// Sem pontuação

export function isValidCpfCnpj(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length === 11 || cleaned.length === 14;
}
```

### CEP

```typescript
// CEP: 8 dígitos
// Sem hífen

export function isValidCep(value: string): boolean {
  return /^\d{8}$/.test(value.replace(/\D/g, ''));
}
```

### Cartão de Crédito

```typescript
// Luhn Algorithm para validação básica
export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if ((digits.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
```

---

## 🚀 Performance & Best Practices

### 1. Caching de Subscription Info

```typescript
// Evitar buscas repetidas
@CacheTTL(300) // 5 minutos
@Get('subscription/info')
async getSubscriptionInfo(@GetUser() user: UserPayload) {
  const academy = await this.prisma.academy.findUnique({
    where: { id: user.academyId },
  });
  return this.asaasService.getSubscription(academy.asaasSubscriptionId);
}
```

### 2. Batch Processing de Webhooks

Se receber muitos webhooks simultâneos, usar fila (Bull/RabbitMQ):

```typescript
import { Queue } from 'bull';

@Inject('ASAAS_WEBHOOK_QUEUE')
private readonly webhookQueue: Queue;

@Post('/webhook')
async handleWebhook(@Body() payload: any) {
  // Apenas enfileirar, não processar sincronamente
  await this.webhookQueue.add(payload);
  return { received: true };
}
```

### 3. Rate Limiting

```bash
npm install @nestjs/throttler
```

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Post('cancel')
async cancelSubscription(@GetUser() user: UserPayload) { ... }
```

---

## 📝 Logging Strategy

```typescript
// asaas.service.ts
private readonly logger = new Logger(AsaasService.name);

// Log níveis:
// ERROR: falhas de API (500, timeouts)
// WARN: validações falhas, QR não disponível
// LOG: operações normais (createCustomer, cancelSubscription)
// DEBUG: detalhes de request/response (optional)

this.logger.error(`Failed to create subscription: ${JSON.stringify(error?.response?.data)}`);
this.logger.warn(`QR Code not available for payment ${paymentId}`);
this.logger.log(`Creating subscription for customer ${customerId}`);
```

---

## 🔐 Environment Variables Summary

```env
# Obrigatórios
ASAAS_API_KEY=<sua-chave-api-sandbox-ou-produção>
ASAAS_API_URL=https://sandbox.asaas.com/api/v3 # ou produção
ASAAS_WEBHOOK_TOKEN=<seu-webhook-token>

# Banco de dados
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=<seu-jwt-secret>
JWT_REFRESH_SECRET=<seu-jwt-refresh-secret>

# URLs de callback (webhook)
FRONTEND_URL=https://seu-dominio.com
BACKEND_URL=https://api.seu-dominio.com
```

---

## 📞 Endpoints Asaas (Referência)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/customers` | Criar cliente |
| `GET` | `/customers/{id}` | Obter cliente |
| `PATCH` | `/customers/{id}` | Atualizar cliente |
| `POST` | `/subscriptions` | Criar assinatura |
| `GET` | `/subscriptions/{id}` | Obter assinatura |
| `DELETE` | `/subscriptions/{id}` | Cancelar assinatura |
| `GET` | `/payments` | Listar pagamentos (com filtros) |
| `GET` | `/payments/{id}` | Obter detalhes pagamento |
| `GET` | `/payments/{id}/pixQrCode` | Obter QR Code PIX |
| `POST` | `/transfers` | Transferência bancária (saque) |

---

## 🎓 Exemplos de Requests cURL

### Criar Customer

```bash
curl -X POST https://sandbox.asaas.com/api/v3/customers \
  -H "Content-Type: application/json" \
  -H "access_token: $aact_..." \
  -d '{
    "name": "Iron Fist Gym",
    "email": "admin@ironfist.com",
    "phone": "11987654321",
    "cpfCnpj": "12345678901234",
    "externalReference": "academy-123",
    "postalCode": "01234567",
    "address": "Rua Principal",
    "addressNumber": "123"
  }'
```

### Criar Subscription (Crédito)

```bash
curl -X POST https://sandbox.asaas.com/api/v3/subscriptions \
  -H "Content-Type: application/json" \
  -H "access_token: $aact_..." \
  -d '{
    "customer": "cus_123456789abc",
    "billingType": "CREDIT_CARD",
    "value": 99.99,
    "nextDueDate": "2026-05-26",
    "cycle": "MONTHLY",
    "description": "Plano Pro",
    "externalReference": "academy-123",
    "creditCard": {
      "holderName": "João Silva",
      "number": "4111111111111111",
      "expiryMonth": "12",
      "expiryYear": "25",
      "ccv": "123"
    },
    "creditCardHolderInfo": {
      "name": "João Silva",
      "email": "joao@ironfist.com",
      "cpfCnpj": "12345678901",
      "postalCode": "01234567",
      "addressNumber": "123",
      "phone": "11987654321"
    }
  }'
```

### Listar Pagamentos

```bash
curl -X GET "https://sandbox.asaas.com/api/v3/payments?subscription=sub_123456789abc" \
  -H "access_token: $aact_..."
```

---

**Última atualização**: 2026-04-26
