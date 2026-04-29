# ⚡ Asaas Integration - Quick Start (Copy & Paste)

**Tempo estimado**: 2-3 horas para projeto já estruturado com NestJS + Prisma.

---

## 🚀 Pre-requisitos Rápido

```bash
# 1. Ter conta Asaas (sandbox)
# https://sandbox.asaas.com
# Obter: API_KEY e WEBHOOK_TOKEN

# 2. Dependências já instaladas:
npm list @nestjs/common @nestjs/config @nestjs/axios prisma
```

---

## 📋 Checklist de Implementação (Copy-Paste Direto)

### ✅ Etapa 1: Variáveis de Ambiente (5 min)

**Arquivo: `backend/.env`**

```env
# ASAAS (Pagamentos)
ASAAS_API_KEY=$aact_hmlg_YOUR_KEY_HERE
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=whsec_YOUR_TOKEN_HERE
```

**Arquivo: `backend/.env.example`** (commit no git)

```env
# ASAAS (Pagamentos)
ASAAS_API_KEY=your-asaas-api-key
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=your-webhook-token
```

### ✅ Etapa 2: Prisma Schema (5 min)

**Arquivo: `backend/prisma/schema.prisma`**

Encontre o modelo `Academy` e adicione:

```prisma
model Academy {
  // ... campos existentes

  // SaaS Payment Integration
  platformPlanId      String?
  platformPlan        PlatformPlan? @relation(fields: [platformPlanId], references: [id])
  asaasCustomerId     String?
  asaasSubscriptionId String?
  isActive            Boolean       @default(true)
  
  // ... resto do modelo
}
```

Adicione ao final do schema (antes de `@@map`):

```prisma
model AsaasWebhookLog {
  id         String   @id @default(cuid())
  asaasEvent String
  paymentId  String?
  payload    Json
  processed  Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([paymentId])
  @@map("asaas_webhook_logs")
}
```

**Executar migração:**

```bash
cd backend
npm run prisma:migrate -- --name add_asaas_integration
npm run prisma:generate
```

### ✅ Etapa 3: AsaasService (10 min)

**Arquivo: `backend/src/modules/asaas/asaas.service.ts`**

```typescript
import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AsaasService {
    private readonly logger = new Logger(AsaasService.name);
    private readonly apiUrl: string;
    private readonly apiKey: string;

    constructor(
        @Inject(HttpService) private readonly httpService: HttpService,
        @Inject(ConfigService) private readonly configService: ConfigService,
    ) {
        this.apiUrl = this.configService.get<string>('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3';
        this.apiKey = this.configService.get<string>('ASAAS_API_KEY') || '';
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            access_token: this.apiKey,
        };
    }

    async createCustomer(data: any) {
        try {
            this.logger.log(`Creating Asaas customer for ${data.email}`);
            const response = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/customers`, data, { headers: this.headers })
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to create Asaas customer: ${JSON.stringify(error?.response?.data)}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async createSubscription(data: any) {
        try {
            this.logger.log(`Creating Asaas subscription for customer ${data.customer}`);
            const response = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/subscriptions`, data, { headers: this.headers })
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to create Asaas subscription: ${JSON.stringify(error?.response?.data)}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async cancelSubscription(subscriptionId: string) {
        try {
            this.logger.log(`Canceling Asaas subscription ${subscriptionId}`);
            const response = await firstValueFrom(
                this.httpService.delete(`${this.apiUrl}/subscriptions/${subscriptionId}`, { headers: this.headers })
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to cancel Asaas subscription: ${JSON.stringify(error?.response?.data)}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getPaymentsBySubscription(subscriptionId: string) {
        try {
            this.logger.log(`Fetching payments for subscription ${subscriptionId}`);
            const response = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/payments?subscription=${subscriptionId}`, { headers: this.headers })
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to fetch payments: ${JSON.stringify(error?.response?.data)}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getPixQrCode(paymentId: string) {
        try {
            this.logger.log(`Fetching PIX QR Code for payment ${paymentId}`);
            const response = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/payments/${paymentId}/pixQrCode`, { headers: this.headers })
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to fetch PIX QR Code: ${JSON.stringify(error?.response?.data)}`);
            throw new HttpException(
                error?.response?.data || 'Failed to fetch PIX QR Code from Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getSubscription(subscriptionId: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/subscriptions/${subscriptionId}`, { headers: this.headers })
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to get Asaas subscription: ${JSON.stringify(error?.response?.data)}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
```

### ✅ Etapa 4: AsaasModule (5 min)

**Arquivo: `backend/src/modules/asaas/asaas.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AsaasService } from './asaas.service';
import { AsaasWebhookController } from './asaas.webhook.controller';
import { AsaasController } from './asaas.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [HttpModule, ConfigModule, PrismaModule],
    controllers: [AsaasWebhookController, AsaasController],
    providers: [AsaasService],
    exports: [AsaasService],
})
export class AsaasModule { }
```

### ✅ Etapa 5: AsaasController (10 min)

**Arquivo: `backend/src/modules/asaas/asaas.controller.ts`**

```typescript
import { Controller, Post, Get, Body, UseGuards, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from './asaas.service';

interface UserPayload {
  id: string;
  email: string;
  role: string;
  academyId?: string;
}

@Controller('asaas/subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AsaasController {
    constructor(
        @Inject(PrismaService) private readonly prisma: PrismaService,
        @Inject(AsaasService) private readonly asaasService: AsaasService,
    ) { }

    @Post('cancel')
    @Roles(UserRole.MANAGER)
    async cancelSubscription(@GetUser() user: UserPayload) {
        const academy = await this.prisma.academy.findUnique({
            where: { id: user.academyId },
        });

        if (!academy?.asaasSubscriptionId) {
            throw new BadRequestException('Nenhuma assinatura ativa encontrada.');
        }

        try {
            await this.asaasService.cancelSubscription(academy.asaasSubscriptionId);
            await this.prisma.academy.update({
                where: { id: academy.id },
                data: { platformPlanId: null, asaasSubscriptionId: null }
            });
            return { message: 'Assinatura cancelada com sucesso.' };
        } catch (error: any) {
            throw new BadRequestException(`Erro ao cancelar: ${error.message}`);
        }
    }

    @Post('upgrade')
    @Roles(UserRole.MANAGER)
    async upgradeSubscription(
        @GetUser() user: UserPayload,
        @Body() body: { newPlanId: string; creditCard?: any; creditCardHolderInfo?: any }
    ) {
        const { newPlanId, creditCard, creditCardHolderInfo } = body;
        const academy = await this.prisma.academy.findUnique({ where: { id: user.academyId } });
        const newPlan = await this.prisma.platformPlan.findUnique({ where: { id: newPlanId } });

        if (!academy || !newPlan || Number(newPlan.price) === 0) {
            throw new BadRequestException('Academia ou plano inválido.');
        }

        if (!academy.asaasCustomerId) {
            throw new BadRequestException('Cliente não registrado no Asaas.');
        }

        try {
            if (academy.asaasSubscriptionId) {
                await this.asaasService.cancelSubscription(academy.asaasSubscriptionId);
            }

            const subscription = await this.asaasService.createSubscription({
                customer: academy.asaasCustomerId,
                billingType: 'CREDIT_CARD',
                value: Number(newPlan.price),
                nextDueDate: new Date().toISOString().split('T')[0],
                cycle: 'MONTHLY',
                description: `Upgrade para ${newPlan.name}`,
                externalReference: academy.id,
                creditCard,
                creditCardHolderInfo,
            });

            await this.prisma.academy.update({
                where: { id: academy.id },
                data: { asaasSubscriptionId: subscription.id, platformPlanId: newPlan.id }
            });

            return { message: 'Plano atualizado com sucesso.' };
        } catch (error: any) {
            throw new BadRequestException(`Erro ao fazer upgrade: ${error.message}`);
        }
    }

    @Get('pending-payment')
    @Roles(UserRole.MANAGER)
    async getPendingPayment(@GetUser() user: UserPayload) {
        const academy = await this.prisma.academy.findUnique({
            where: { id: user.academyId },
            select: { asaasSubscriptionId: true }
        });

        if (!academy?.asaasSubscriptionId) return null;

        try {
            const paymentsResponse = await this.asaasService.getPaymentsBySubscription(academy.asaasSubscriptionId);
            const pendingPayment = paymentsResponse?.data?.find((p: any) => ['PENDING', 'OVERDUE'].includes(p.status));

            if (!pendingPayment) return null;

            let pixPayload = null, pixEncodedImage = null;
            if (pendingPayment.billingType === 'PIX') {
                try {
                    const qrCodeData = await this.asaasService.getPixQrCode(pendingPayment.id);
                    pixPayload = qrCodeData.payload;
                    pixEncodedImage = qrCodeData.encodedImage;
                } catch (qrError) { }
            }

            return {
                invoiceUrl: pendingPayment.invoiceUrl,
                billingType: pendingPayment.billingType,
                value: pendingPayment.value,
                dueDate: pendingPayment.dueDate,
                status: pendingPayment.status,
                pixPayload,
                pixEncodedImage,
            };
        } catch (error: any) {
            throw new BadRequestException(`Erro ao buscar pagamento: ${error.message}`);
        }
    }
}
```

### ✅ Etapa 6: AsaasWebhookController (10 min)

**Arquivo: `backend/src/modules/asaas/asaas.webhook.controller.ts`**

```typescript
import { Controller, Post, Body, Logger, Headers, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('asaas/webhook')
export class AsaasWebhookController {
    private readonly logger = new Logger(AsaasWebhookController.name);

    constructor(
        @Inject(PrismaService) private readonly prisma: PrismaService,
        @Inject(ConfigService) private readonly configService: ConfigService,
    ) { }

    @Post()
    async handleWebhook(
        @Body() payload: any,
        @Headers('asaas-access-token') asaasAccessToken: string,
    ) {
        this.logger.log(`Received Asaas webhook event: ${payload.event}`);

        const expectedToken = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN');
        if (expectedToken && asaasAccessToken !== expectedToken) {
            this.logger.warn('Invalid Asaas access token');
            throw new UnauthorizedException('Invalid webhook token');
        }

        if (!payload?.event || !payload?.payment) {
            this.logger.warn('Invalid webhook payload');
            return { received: true };
        }

        const eventType = payload.event;
        const paymentData = payload.payment;
        const paymentId = paymentData.id;
        const customerId = paymentData.customer;
        const academyIdRef = paymentData.externalReference;

        const webhookLog = await this.prisma.asaasWebhookLog.create({
            data: { asaasEvent: eventType, paymentId, payload }
        });

        try {
            if (paymentId) {
                const alreadyProcessed = await this.prisma.asaasWebhookLog.findFirst({
                    where: { paymentId, processed: true, asaasEvent: eventType }
                });
                if (alreadyProcessed) {
                    this.logger.log(`Webhook already processed for ${paymentId}`);
                    return { received: true };
                }
            }

            let academy = null;
            if (academyIdRef) {
                academy = await this.prisma.academy.findUnique({ where: { id: academyIdRef } });
            }
            if (!academy && customerId) {
                academy = await this.prisma.academy.findFirst({ where: { asaasCustomerId: customerId } });
            }

            if (!academy) {
                this.logger.warn(`No academy found for event ${eventType}`);
                return { received: true };
            }

            let shouldUpdateStatus = false;
            let targetIsActive = academy.isActive;

            switch (eventType) {
                case 'PAYMENT_RECEIVED':
                case 'PAYMENT_CONFIRMED':
                    shouldUpdateStatus = true;
                    targetIsActive = true;
                    break;
                case 'PAYMENT_OVERDUE':
                case 'PAYMENT_REFUNDED':
                case 'PAYMENT_CHARGEBACK_REQUESTED':
                    shouldUpdateStatus = true;
                    targetIsActive = false;
                    break;
                default:
                    this.logger.log(`Informational event: ${eventType}`);
            }

            if (shouldUpdateStatus) {
                await this.prisma.academy.update({
                    where: { id: academy.id },
                    data: { isActive: targetIsActive }
                });
                this.logger.log(`Academy ${academy.id} ${targetIsActive ? 'activated' : 'deactivated'}`);
            }

            await this.prisma.asaasWebhookLog.update({
                where: { id: webhookLog.id },
                data: { processed: true }
            });

        } catch (error) {
            this.logger.error('Error processing webhook:', error);
            throw error;
        }

        return { received: true };
    }
}
```

### ✅ Etapa 7: Importar AsaasModule em AuthModule (5 min)

**Arquivo: `backend/src/modules/auth/auth.module.ts`**

Adicione a importação:

```typescript
import { AsaasModule } from '../asaas/asaas.module';

@Module({
    imports: [
        PrismaModule,
        AsaasModule, // ← ADICIONAR AQUI
        PassportModule,
        // ... resto
    ],
    // ...
})
export class AuthModule { }
```

### ✅ Etapa 8: Registrar AsaasModule em AppModule (5 min)

**Arquivo: `backend/src/app.module.ts`**

Adicione a importação:

```typescript
import { AsaasModule } from './modules/asaas/asaas.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        AsaasModule, // ← ADICIONAR AQUI
        AuthModule,
        // ... resto
    ],
})
export class AppModule { }
```

### ✅ Etapa 9: Atualizar AuthService.register() (15 min)

**Arquivo: `backend/src/modules/auth/auth.service.ts`**

Injetar AsaasService:

```typescript
import { AsaasService } from '../asaas/asaas.service';

@Injectable()
export class AuthService {
    constructor(
        // ... outros
        @Inject(AsaasService) private readonly asaasService: AsaasService,
    ) { }
```

Na função `register()`, após criar academy e user, adicione:

```typescript
// 4. ASAAS Integration
let asaasCustomerId = null;
let asaasSubscriptionId = null;
let pixPayload = null;
let pixEncodedImage = null;

try {
    const asaasCustomer = await this.asaasService.createCustomer({
        name: registerDto.academyName,
        email: registerDto.email,
        phone: registerDto.phone,
        cpfCnpj: registerDto.document,
        externalReference: academy.id,
        postalCode: registerDto.postalCode,
        address: registerDto.address,
        addressNumber: registerDto.addressNumber,
    });

    asaasCustomerId = asaasCustomer.id;

    if (isPaidPlan) {
        const subscription = await this.asaasService.createSubscription({
            customer: asaasCustomerId,
            billingType: 'CREDIT_CARD',
            value: Number(platformPlan.price),
            nextDueDate: new Date().toISOString().split('T')[0],
            cycle: 'MONTHLY',
            description: `Assinatura Saas - ${platformPlan.name}`,
            externalReference: academy.id,
            creditCard: registerDto.creditCard,
            creditCardHolderInfo: registerDto.creditCardHolderInfo,
        });

        asaasSubscriptionId = subscription.id;

        if (registerDto.paymentMethod === 'PIX') {
            const paymentsResponse = await this.asaasService.getPaymentsBySubscription(subscription.id);
            if (paymentsResponse?.data?.length > 0) {
                const firstPayment = paymentsResponse.data[0];
                try {
                    const qrCodeData = await this.asaasService.getPixQrCode(firstPayment.id);
                    pixPayload = qrCodeData.payload;
                    pixEncodedImage = qrCodeData.encodedImage;
                } catch (qrError) {
                    this.logger.warn(`Failed to fetch PIX QR Code`);
                }
            }
        }
    }
} catch (error: any) {
    throw new BadRequestException(`Confirmação financeira falhou: ${error.message}`);
}

// 5. Atualizar academy
await tx.academy.update({
    where: { id: academy.id },
    data: { asaasCustomerId, asaasSubscriptionId }
});
```

Adicionar aos retornos:

```typescript
return {
    accessToken,
    refreshToken,
    user: { /* ... */ },
    pixPayload,
    pixEncodedImage,
};
```

### ✅ Etapa 10: Frontend - Consumir API (5 min)

**Arquivo: `src/api/asaas-service.ts`** (criar novo)

```typescript
import { apiClient } from './index';

export const asaasService = {
    cancelSubscription: () => apiClient.post('/asaas/subscription/cancel'),
    upgradeSubscription: (newPlanId: string, creditCard?: any, creditCardHolderInfo?: any) =>
        apiClient.post('/asaas/subscription/upgrade', { newPlanId, creditCard, creditCardHolderInfo }),
    getPendingPayment: () => apiClient.get('/asaas/subscription/pending-payment'),
};
```

**Uso em componentes:**

```typescript
import { asaasService } from '../api/asaas-service';

// Cancelar
await asaasService.cancelSubscription();

// Upgrade
await asaasService.upgradeSubscription(planId, creditCard, holderInfo);

// Pagamento pendente
const pending = await asaasService.getPendingPayment();
```

### ✅ Etapa 11: Testar (10 min)

**Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev
```

**Terminal 2 - Testar Webhook com curl:**

```bash
curl -X POST http://localhost:3000/asaas/webhook \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: whsec_YOUR_TOKEN_HERE" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_123",
      "customer": "cus_123",
      "externalReference": "academy-id-here",
      "status": "CONFIRMED",
      "value": 99.99,
      "billingType": "PIX"
    }
  }'
```

**Esperado:** `{ "received": true }`

---

## 🧪 Teste Manual Rápido

### 1. Registrar nova academia com plano pago

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "academyName": "Test Academy",
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123",
    "phone": "11987654321",
    "planId": "your-plan-id",
    "document": "12345678901234",
    "paymentMethod": "PIX",
    "postalCode": "01234567",
    "address": "Rua Test",
    "addressNumber": "123"
  }'
```

**Resposta esperada:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "...", "email": "test@example.com" },
  "pixPayload": "00020126...",
  "pixEncodedImage": "iVBORw0KG..."
}
```

### 2. Verificar pagamento pendente

```bash
curl -X GET http://localhost:3000/asaas/subscription/pending-payment \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Cancelar assinatura

```bash
curl -X POST http://localhost:3000/asaas/subscription/cancel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🆘 Troubleshooting Rápido

| Erro | Causa | Solução |
|------|-------|---------|
| `ASAAS_API_KEY is undefined` | .env não carregado | Reiniciar `npm run start:dev` |
| `Invalid webhook token` | Token errado | Copiar token correto do Asaas dashboard |
| `Failed to create Asaas customer` | CPF/CNPJ inválido | Validar 11 ou 14 dígitos sem máscara |
| `No academy found` | `externalReference` não enviado | Verificar se `academy.id` está sendo passado |
| `Webhook not arriving` | URL não acessível | Usar ngrok: `ngrok http 3000` |

---

## 📦 Estrutura Final de Pastas

```
backend/src/
├── modules/
│   ├── asaas/
│   │   ├── asaas.service.ts ✅
│   │   ├── asaas.controller.ts ✅
│   │   ├── asaas.webhook.controller.ts ✅
│   │   └── asaas.module.ts ✅
│   ├── auth/
│   │   ├── auth.service.ts (modificado) ✅
│   │   └── auth.module.ts (modificado) ✅
│   └── prisma/
│       └── prisma.service.ts
├── app.module.ts (modificado) ✅
└── main.ts

backend/prisma/
├── schema.prisma (modificado) ✅
├── migrations/
│   └── 20260426_add_asaas_integration/ (gerada)
└── seed.ts (opcional)

src/
└── api/
    └── asaas-service.ts (novo) ✅
```

---

## ✨ Pronto!

Você agora tem:
- ✅ Serviço Asaas completo
- ✅ Endpoints de assinatura (cancel, upgrade, pending)
- ✅ Webhook receiver com idempotência
- ✅ Integração no fluxo de registro
- ✅ Frontend pronto para consumir

**Próximos passos opcionais:**
- Refund/estorno
- Dashboard de pagamentos
- Relatórios financeiros
- Suporte a múltiplos gateways

---

**Tempo total**: ~60-90 minutos ⏱️
