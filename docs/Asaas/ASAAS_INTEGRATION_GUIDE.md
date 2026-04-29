# 🔐 Guia Completo de Integração com Asaas

**Versão:** 1.0  
**Data:** 2026-04-26  
**Aplicável a:** NestJS + Prisma + React (ou qualquer stack com backend Node)

---

## 📋 Índice

1. [Visão Geral Arquitetural](#visão-geral-arquitetural)
2. [Conceitos & Padrões](#conceitos--padrões)
3. [Estrutura de Pastas & Módulos](#estrutura-de-pastas--módulos)
4. [Implementação Passo-a-Passo](#implementação-passo-a-passo)
5. [Fluxos de Negócio](#fluxos-de-negócio)
6. [Segurança & Idempotência](#segurança--idempotência)
7. [Testing & Validação](#testing--validação)
8. [Troubleshooting](#troubleshooting)

---

## Visão Geral Arquitetural

A integração com Asaas segue um modelo de **Service-oriented Architecture** com separação clara entre:

- **Serviço**: `AsaasService` — encapsula chamadas REST à API Asaas
- **Controller HTTP**: `AsaasController` — expõe endpoints para front-end (cancel, upgrade, pending payment)
- **Webhook Receiver**: `AsaasWebhookController` — recebe e processa eventos de pagamento em tempo real
- **Auth Integration**: Asaas é integrado no fluxo de registro (`AuthService.register`)
- **Database**: Campos adicionais na entidade de cliente armazenam `asaasCustomerId` e `asaasSubscriptionId`

### Diagrama de Fluxo Simplificado

```
[Front-end]
    |
    +---> POST /register (academia + plano pago)
    |         |
    |         v
    +---> [AuthService.register]
    |         |
    |         v
    +---> [AsaasService.createCustomer]  --- (API REST) ---> [Asaas]
    |         |
    |         v
    +---> [AsaasService.createSubscription]
    |         |
    |         v
    +---> [AsaasService.getPaymentsBySubscription]
    |         |
    |         v
    +---> [AsaasService.getPixQrCode] (se PIX)
    |         |
    |         v
    +---> Resposta com QR Code ou Invoice URL
    |
    +---> Webhook: PAYMENT_RECEIVED/PAYMENT_OVERDUE
    |         |
    |         v
    +---> [AsaasWebhookController.handleWebhook]
    |         |
    |         v
    +---> [Prisma] atualiza academy.isActive
```

---

## Conceitos & Padrões

### 1. **Service Pattern**
O `AsaasService` é um wrapper injeável que encapsula toda a lógica de comunicação com Asaas.

**Benefícios:**
- Centraliza a lógica de integração
- Facilita testes (mock do serviço)
- Isola mudanças de API em um único local
- Permite reutilização entre controladores

### 2. **Dependency Injection (NestJS)**
```typescript
@Injectable()
export class AsaasService {
  constructor(
    @Inject(HttpService) private readonly httpService: HttpService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) { }
}
```

### 3. **Transaction Pattern (Prisma)**
Registro e criação de cliente Asaas dentro de uma transação garante consistência:
- Se o Asaas falhar, academy/user não são criados
- Se o DB falhar após Asaas, a transação é revertida

### 4. **Idempotency Pattern**
Webhooks são idempotentes: grava evento no DB, verifica se já foi processado antes de agir.

### 5. **Error Mapping**
Erros do Asaas são transformados em `HttpException` com mensagens amigáveis ao usuário:
```typescript
throw new HttpException(
  error?.response?.data || 'Failed to communicate with Asaas',
  error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
);
```

---

## Estrutura de Pastas & Módulos

```
backend/src/
├── modules/
│   ├── asaas/
│   │   ├── asaas.service.ts          # Serviço com métodos para API Asaas
│   │   ├── asaas.controller.ts       # Endpoints HTTP (cancel, upgrade, pending)
│   │   ├── asaas.webhook.controller.ts  # Receiver de webhooks
│   │   └── asaas.module.ts           # Declaração do módulo NestJS
│   │
│   ├── auth/
│   │   ├── auth.service.ts           # Integra AsaasService no registro
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts            # Importa AsaasModule
│   │   └── dto/
│   │       └── register.dto.ts       # DTO com campos de cartão + plano
│   │
│   └── prisma/
│       └── prisma.service.ts         # Serviço Prisma compartilhado
│
├── common/
│   ├── decorators/
│   │   ├── get-user.decorator.ts     # Extrai usuário do JWT
│   │   ├── roles.decorator.ts        # Marca roles permitidas
│   │   └── public.decorator.ts       # Marca rotas públicas
│   │
│   └── interfaces/
│       └── auth.interface.ts         # Interface JwtPayload
│
└── app.module.ts                     # Importa AsaasModule globalmente
```

---

## Implementação Passo-a-Passo

### Pré-requisitos

1. **Conta Asaas**: https://sandbox.asaas.com (sandbox) ou https://asaas.com (produção)
2. **Credenciais**:
   - API Key (formato: `$aact_...`)
   - Webhook Token (formato: `whsec_...`)
3. **Banco de dados**: PostgreSQL com Prisma ORM

### Etapa 1: Setup de Variáveis de Ambiente

**Arquivo: `backend/.env.example`**

```env
# ============================================================
# ASAAS (Pagamentos)
# ============================================================
ASAAS_API_KEY=your-asaas-api-key
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=your-webhook-token
```

**Arquivo: `backend/.env`** (git-ignored)

```env
ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmYzMDg0YzIwLTI4NTEtNGZhYy04MzRiLWY1ZTA5Yjo6JGFhY2hfOTYwNGE2MzYtODYzNy00MDJjLWI0MDktOTlhZTg1NDFlYzE3
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=whsec_IKhqliIPWuIti6Z4iOud9M1VjjZNyDBFWJ_rSk8mZRI
```

### Etapa 2: Schema Prisma

**Arquivo: `backend/prisma/schema.prisma`**

```prisma
model Academy {
  id                  String  @id @default(cuid())
  name                String
  email               String  @unique
  phone               String?
  
  // ========== Asaas Integration ==========
  asaasCustomerId     String?   // ID do cliente no Asaas (cus_...)
  asaasSubscriptionId String?   // ID da assinatura no Asaas (sub_...)
  platformPlanId      String?
  platformPlan        PlatformPlan? @relation(fields: [platformPlanId], references: [id])
  isActive            Boolean   @default(true)
  trialEndsAt         DateTime?
  
  // Endereço (obrigatório para Asaas)
  document            String?   // CPF/CNPJ
  cep                 String?
  street              String?
  number              String?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  users               User[]
  @@map("academies")
}

model AsaasWebhookLog {
  id         String   @id @default(cuid())
  asaasEvent String   // ex: "PAYMENT_RECEIVED", "PAYMENT_OVERDUE"
  paymentId  String?
  payload    Json     // JSON completo do webhook
  processed  Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([paymentId])
  @@map("asaas_webhook_logs")
}
```

**Executar migração:**

```bash
npm run prisma:migrate -- --name add_asaas_integration
npm run prisma:generate
```

### Etapa 3: Implementar AsaasService

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

    /**
     * Cria um cliente (customer) no Asaas
     * Obrigatório: name, email
     * Recomendado: cpfCnpj, postalCode, address, addressNumber (para validações Asaas)
     */
    async createCustomer(data: {
        name: string;
        email: string;
        phone?: string;
        mobilePhone?: string;
        cpfCnpj?: string;
        externalReference?: string;
        postalCode?: string;
        address?: string;
        addressNumber?: string;
    }) {
        try {
            this.logger.log(`Creating Asaas customer for ${data.email}`);
            const response = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/customers`, data, { headers: this.headers })
            );
            return response.data; // { id: "cus_...", name, email, ... }
        } catch (error: any) {
            this.logger.error(`Failed to create Asaas customer: ${JSON.stringify(error?.response?.data) || error.message}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Cria uma assinatura (subscription) no Asaas
     * Tipos de billing: CREDIT_CARD, BOLETO, PIX, UNDEFINED
     * Cycles: MONTHLY, QUARTERLY, SEMIANNUALLY, YEARLY
     */
    async createSubscription(data: {
        customer: string;
        billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED';
        value: number;
        nextDueDate: string; // ISO format: YYYY-MM-DD
        cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
        description?: string;
        externalReference?: string;
        creditCard?: {
            holderName: string;
            number: string;
            expiryMonth: string;
            expiryYear: string;
            ccv: string;
        };
        creditCardHolderInfo?: {
            name: string;
            email: string;
            cpfCnpj: string;
            postalCode: string;
            addressNumber: string;
            addressComplement?: string;
            phone: string;
            mobilePhone?: string;
        };
    }) {
        try {
            this.logger.log(`Creating Asaas subscription for customer ${data.customer}`);
            const response = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/subscriptions`, data, { headers: this.headers })
            );
            return response.data; // { id: "sub_...", status, nextDueDate, ... }
        } catch (error: any) {
            this.logger.error(`Failed to create Asaas subscription: ${JSON.stringify(error?.response?.data) || error.message}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Cancela uma assinatura
     */
    async cancelSubscription(subscriptionId: string) {
        try {
            this.logger.log(`Canceling Asaas subscription ${subscriptionId}`);
            const response = await firstValueFrom(
                this.httpService.delete(`${this.apiUrl}/subscriptions/${subscriptionId}`, { headers: this.headers })
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to cancel Asaas subscription: ${JSON.stringify(error?.response?.data) || error.message}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Busca pagamentos de uma assinatura
     */
    async getPaymentsBySubscription(subscriptionId: string) {
        try {
            this.logger.log(`Fetching payments for subscription ${subscriptionId}`);
            const response = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/payments?subscription=${subscriptionId}`, { headers: this.headers })
            );
            return response.data; // { data: [ payment1, payment2... ] }
        } catch (error: any) {
            this.logger.error(`Failed to fetch payments: ${JSON.stringify(error?.response?.data) || error.message}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Obtém QR Code PIX para um pagamento
     */
    async getPixQrCode(paymentId: string) {
        try {
            this.logger.log(`Fetching PIX QR Code for payment ${paymentId}`);
            const response = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/payments/${paymentId}/pixQrCode`, { headers: this.headers })
            );
            return response.data; // { encodedImage, payload, expirationDate }
        } catch (error: any) {
            this.logger.error(`Failed to fetch PIX QR Code: ${JSON.stringify(error?.response?.data) || error.message}`);
            throw new HttpException(
                error?.response?.data || 'Failed to fetch PIX QR Code from Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Obtém detalhes de uma assinatura
     */
    async getSubscription(subscriptionId: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/subscriptions/${subscriptionId}`, { headers: this.headers })
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to get Asaas subscription: ${JSON.stringify(error?.response?.data) || error.message}`);
            throw new HttpException(
                error?.response?.data || 'Failed to communicate with Asaas',
                error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
```

### Etapa 4: Implementar AsaasModule

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
    exports: [AsaasService], // Exporta para ser injetado em AuthModule
})
export class AsaasModule { }
```

### Etapa 5: Implementar AsaasController

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
  isActive?: boolean;
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
        if (!user || user.role !== UserRole.MANAGER) {
            throw new UnauthorizedException('Apenas gerentes podem cancelar a assinatura.');
        }

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
                data: {
                    platformPlanId: null,
                    asaasSubscriptionId: null,
                }
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

        const academy = await this.prisma.academy.findUnique({
            where: { id: user.academyId },
        });

        if (!academy) throw new BadRequestException('Academia não encontrada.');

        const newPlan = await this.prisma.platformPlan.findUnique({
            where: { id: newPlanId },
        });

        if (!newPlan || Number(newPlan.price) === 0) {
            throw new BadRequestException('Plano inválido ou gratuito.');
        }

        if (!academy.asaasCustomerId) {
            throw new BadRequestException('Cliente não registrado no Asaas.');
        }

        try {
            if (academy.asaasSubscriptionId) {
                await this.asaasService.cancelSubscription(academy.asaasSubscriptionId);
            }

            const nextDueDate = new Date().toISOString().split('T')[0];

            const subscription = await this.asaasService.createSubscription({
                customer: academy.asaasCustomerId,
                billingType: 'CREDIT_CARD',
                value: Number(newPlan.price),
                nextDueDate,
                cycle: 'MONTHLY',
                description: `Upgrade para ${newPlan.name}`,
                externalReference: academy.id,
                creditCard,
                creditCardHolderInfo,
            });

            await this.prisma.academy.update({
                where: { id: academy.id },
                data: {
                    asaasSubscriptionId: subscription.id,
                    platformPlanId: newPlan.id
                }
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
            const pendingPayment = paymentsResponse?.data?.find((p: any) => 
                ['PENDING', 'OVERDUE'].includes(p.status)
            );

            if (!pendingPayment) return null;

            let pixPayload = null;
            let pixEncodedImage = null;

            if (pendingPayment.billingType === 'PIX') {
                try {
                    const qrCodeData = await this.asaasService.getPixQrCode(pendingPayment.id);
                    pixPayload = qrCodeData.payload;
                    pixEncodedImage = qrCodeData.encodedImage;
                } catch (qrError) {
                    // Ignore se QR não estiver disponível
                }
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

### Etapa 6: Implementar AsaasWebhookController

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

        // 1. Validar token
        const expectedToken = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN');
        if (expectedToken && asaasAccessToken !== expectedToken) {
            this.logger.warn('Invalid Asaas access token provided in webhook');
            throw new UnauthorizedException('Invalid webhook token');
        }

        if (!payload?.event || !payload?.payment) {
            this.logger.warn('Invalid webhook payload structure');
            return { received: true };
        }

        const eventType = payload.event;
        const paymentData = payload.payment;
        const paymentId = paymentData.id;
        const customerId = paymentData.customer;
        const academyIdRef = paymentData.externalReference;

        // 2. Log webhook (para debug e auditoria)
        const webhookLog = await this.prisma.asaasWebhookLog.create({
            data: {
                asaasEvent: eventType,
                paymentId: paymentId,
                payload: payload,
            }
        });

        try {
            // 3. Verificar idempotência
            if (paymentId) {
                const alreadyProcessed = await this.prisma.asaasWebhookLog.findFirst({
                    where: {
                        paymentId: paymentId,
                        processed: true,
                        asaasEvent: eventType
                    }
                });

                if (alreadyProcessed) {
                    this.logger.log(`Webhook for payment ${paymentId} (${eventType}) already processed.`);
                    return { received: true };
                }
            }

            // 4. Encontrar academia
            let academy = null;
            if (academyIdRef) {
                academy = await this.prisma.academy.findUnique({
                    where: { id: academyIdRef },
                });
            }

            if (!academy && customerId) {
                academy = await this.prisma.academy.findFirst({
                    where: { asaasCustomerId: customerId },
                });
            }

            if (!academy) {
                this.logger.warn(`No academy found for Asaas event ${eventType}`);
                return { received: true };
            }

            // 5. Processar eventos
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

                case 'PAYMENT_DELETED':
                    this.logger.warn(`Payment ${paymentId} deleted in Asaas for academy ${academy.id}`);
                    break;

                default:
                    this.logger.log(`Informational event: ${eventType}`);
            }

            if (shouldUpdateStatus) {
                await this.prisma.academy.update({
                    where: { id: academy.id },
                    data: { isActive: targetIsActive },
                });
                this.logger.log(`Academy ${academy.id} ${targetIsActive ? 'activated' : 'deactivated'} by event: ${eventType}.`);
            }

            // 6. Marcar como processado
            await this.prisma.asaasWebhookLog.update({
                where: { id: webhookLog.id },
                data: { processed: true }
            });

        } catch (error) {
            this.logger.error('Error processing Asaas webhook:', error);
            throw error;
        }

        return { received: true };
    }
}
```

### Etapa 7: Integrar AsaasModule em AuthModule

**Arquivo: `backend/src/modules/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PrismaModule } from '../../prisma/prisma.module';
import { AsaasModule } from '../asaas/asaas.module'; // ← Adicionar aqui

@Module({
    imports: [
        PrismaModule,
        AsaasModule, // ← Adicionar aqui
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    providers: [AuthService, JwtStrategy, LocalStrategy],
    controllers: [AuthController],
})
export class AuthModule { }
```

### Etapa 8: Integrar AsaasService em AuthService

**Arquivo: `backend/src/modules/auth/auth.service.ts` (seção de register)**

```typescript
import { Inject } from '@nestjs/common';
import { AsaasService } from '../asaas/asaas.service';

@Injectable()
export class AuthService {
    constructor(
        // ... outros injetáveis
        @Inject(AsaasService) private readonly asaasService: AsaasService,
    ) { }

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        // ... validações iniciais

        try {
            result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // 1. Criar academia
                const isPaidPlan = platformPlan && Number(platformPlan.price) > 0;
                const academy = await tx.academy.create({
                    data: {
                        name: registerDto.academyName,
                        email: registerDto.email,
                        phone: registerDto.phone,
                        platformPlanId: registerDto.planId,
                        isActive: !isPaidPlan, // Bloqueado até pagamento confirmado
                        cep: registerDto.postalCode,
                        street: registerDto.address,
                        number: registerDto.addressNumber,
                    },
                });

                // 2. Criar usuário
                const user = await tx.user.create({
                    data: {
                        academyId: academy.id,
                        email: registerDto.email,
                        password: hashedPassword,
                        name: registerDto.name,
                        role: UserRole.MANAGER,
                    },
                });

                // 3. Criar plano padrão
                await tx.membershipPlan.create({
                    data: {
                        academyId: academy.id,
                        name: 'Plano Livre',
                        price: 0,
                        period: PlanPeriod.MONTHLY,
                        isSystemDefault: true,
                    },
                });

                // 4. ← ASAAS Integration
                let asaasCustomerId = null;
                let asaasSubscriptionId = null;
                let invoiceUrl = null;
                let pixPayload = null;
                let pixEncodedImage = null;

                try {
                    // Criar customer
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

                    // Criar subscription se plano pago
                    if (isPaidPlan) {
                        const billingType = registerDto.paymentMethod === 'PIX' ? 'PIX' : 'CREDIT_CARD';

                        const targetDate = new Date(
                            Date.now() + (registerDto.trialDays || 0) * 86400000
                        );
                        const nextDueDate = targetDate.toISOString().split('T')[0];

                        const subscription = await this.asaasService.createSubscription({
                            customer: asaasCustomerId,
                            billingType,
                            value: Number(platformPlan!.price),
                            nextDueDate,
                            cycle: 'MONTHLY',
                            description: `Assinatura Saas - ${platformPlan!.name}`,
                            externalReference: academy.id,
                            ...(billingType === 'CREDIT_CARD' && {
                                creditCard: registerDto.creditCard,
                                creditCardHolderInfo: registerDto.creditCardHolderInfo,
                            }),
                        });

                        asaasSubscriptionId = subscription.id;

                        // Se PIX, buscar QR Code
                        if (billingType === 'PIX') {
                            const paymentsResponse = await this.asaasService.getPaymentsBySubscription(subscription.id);
                            if (paymentsResponse?.data?.length > 0) {
                                const firstPayment = paymentsResponse.data[0];
                                invoiceUrl = firstPayment.invoiceUrl;
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
                    const asaasErrorMsg = error?.message || 'Erro ao processar dados no Asaas.';
                    this.logger.error(`Asaas integration failed: ${asaasErrorMsg}`);
                    throw new BadRequestException(`Confirmação financeira falhou: ${asaasErrorMsg}`);
                }

                // 5. Atualizar academia com IDs Asaas
                await tx.academy.update({
                    where: { id: academy.id },
                    data: { asaasCustomerId, asaasSubscriptionId }
                });

                return { academy, user, invoiceUrl, pixPayload, pixEncodedImage };
            });
        } catch (error: any) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error('Registration failed:', error);
            throw error;
        }

        // ... gerar tokens e retornar
        return {
            accessToken,
            refreshToken,
            user: { /* ... */ },
            invoiceUrl: result.invoiceUrl,
            pixPayload: result.pixPayload,
            pixEncodedImage: result.pixEncodedImage,
        };
    }
}
```

### Etapa 9: Registrar AsaasModule em AppModule

**Arquivo: `backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AsaasModule } from './modules/asaas/asaas.module'; // ← Adicionar
import { AuthModule } from './modules/auth/auth.module';
// ... outros imports

@Module({
    imports: [
        ConfigModule.forRoot(),
        AsaasModule, // ← Adicionar aqui
        AuthModule,
        // ... outros módulos
    ],
})
export class AppModule { }
```

### Etapa 10: Frontend - Chamadas de API

**Arquivo: `src/api/asaas/service.ts` (exemplo)**

```typescript
import { apiClient } from '../index';

export const asaasService = {
    cancelSubscription: async () => {
        return apiClient.post('/asaas/subscription/cancel');
    },

    upgradeSubscription: async (newPlanId: string, creditCard?: any, creditCardHolderInfo?: any) => {
        return apiClient.post('/asaas/subscription/upgrade', {
            newPlanId,
            creditCard,
            creditCardHolderInfo,
        });
    },

    getPendingPayment: async () => {
        return apiClient.get('/asaas/subscription/pending-payment');
    },
};
```

---

## Fluxos de Negócio

### Fluxo 1: Registro com Plano Pago

```
1. Usuário acessa /register (Front-end)
2. Preenche: email, senha, nome academia, CPF/CNPJ, endereço, cartão
3. POST /register
   ├─> AuthService.register()
   │   ├─> Criar Academy (isActive: false)
   │   ├─> Criar User
   │   ├─> AsaasService.createCustomer()
   │   │   └─> API Asaas: POST /customers
   │   ├─> AsaasService.createSubscription()
   │   │   └─> API Asaas: POST /subscriptions
   │   ├─> AsaasService.getPaymentsBySubscription()
   │   │   └─> API Asaas: GET /payments?subscription=...
   │   ├─> AsaasService.getPixQrCode() (se PIX)
   │   │   └─> API Asaas: GET /payments/{id}/pixQrCode
   │   └─> Atualizar Academy com asaasCustomerId, asaasSubscriptionId
   │
4. Retornar tokens + QR Code (PIX) ou Invoice URL (Cartão)
5. Front-end exibe: QR Code PIX para escanear OU link da fatura
6. Usuário realiza pagamento
7. Asaas envia webhook: PAYMENT_RECEIVED
8. AsaasWebhookController.handleWebhook()
   ├─> Validar token webhook
   ├─> Log webhook (idempotência)
   ├─> Encontrar Academy por customerId
   ├─> Atualizar Academy.isActive = true
   └─> Marcar webhook como processado
9. Academia agora ativa ✓
```

### Fluxo 2: Cancelamento de Assinatura

```
1. Usuário clica "Cancelar Assinatura" (Front-end)
2. POST /asaas/subscription/cancel (requer JWT + MANAGER role)
   ├─> AsaasController.cancelSubscription()
   │   ├─> Encontrar Academy
   │   ├─> AsaasService.cancelSubscription(asaasSubscriptionId)
   │   │   └─> API Asaas: DELETE /subscriptions/{id}
   │   └─> Atualizar Academy: platformPlanId=null, asaasSubscriptionId=null
   │
3. Retornar sucesso
4. Asaas eventualmente envia webhook: PAYMENT_DELETED
5. Academy pode ser marcada como inativa (conforme lógica)
```

### Fluxo 3: Upgrade de Plano

```
1. Usuário seleciona novo plano (Front-end)
2. POST /asaas/subscription/upgrade com { newPlanId, creditCard, creditCardHolderInfo }
   ├─> AsaasController.upgradeSubscription()
   │   ├─> Encontrar Academy e novo plano
   │   ├─> Se existe assinatura anterior: cancelar
   │   ├─> AsaasService.createSubscription() com novo valor
   │   │   └─> API Asaas: POST /subscriptions
   │   └─> Atualizar Academy: platformPlanId, asaasSubscriptionId
   │
3. Retornar sucesso
4. Nova assinatura ativa com novo valor/ciclo
```

---

## Segurança & Idempotência

### 1. Autenticação HTTP (Asaas ← → Backend)

**Header obrigatório em todas as chamadas:**
```
access_token: $aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmYzMDg0YzIwLTI4NTEtNGZhYy04MzRiLWY1ZTA5Yjo6JGFhY2hfOTYwNGE2MzYtODYzNy00MDJjLWI0MDktOTlhZTg1NDFlYzE3
```

### 2. Validação de Webhook

**Header do webhook:**
```
POST /asaas/webhook
Content-Type: application/json
asaas-access-token: whsec_IKhqliIPWuIti6Z4iOud9M1VjjZNyDBFWJ_rSk8mZRI

{ "event": "PAYMENT_RECEIVED", "payment": { ... } }
```

**Validação no backend:**
```typescript
const expectedToken = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN');
if (expectedToken && asaasAccessToken !== expectedToken) {
    throw new UnauthorizedException('Invalid webhook token');
}
```

### 3. Idempotência

Webhooks podem ser enviados múltiplas vezes. Solução:

```typescript
// Log o webhook ANTES de processar
const webhookLog = await this.prisma.asaasWebhookLog.create({
    data: {
        asaasEvent: eventType,
        paymentId: paymentId,
        payload: payload,
        processed: false,
    }
});

// Verificar se já foi processado
const alreadyProcessed = await this.prisma.asaasWebhookLog.findFirst({
    where: {
        paymentId: paymentId,
        processed: true,
        asaasEvent: eventType
    }
});

if (alreadyProcessed) return { received: true }; // Skip

// Processar...

// Marcar como processado
await this.prisma.asaasWebhookLog.update({
    where: { id: webhookLog.id },
    data: { processed: true }
});
```

### 4. RBAC (Role-Based Access Control)

```typescript
@Post('cancel')
@Roles(UserRole.MANAGER) // ← Apenas MANAGERs podem cancelar
async cancelSubscription(@GetUser() user: UserPayload) { ... }
```

### 5. Rate Limiting (Opcional)

Adicione throttle para evitar abuso:

```bash
npm install @nestjs/throttler
```

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Post('cancel')
async cancelSubscription(@GetUser() user: UserPayload) { ... }
```

---

## Testing & Validação

### 1. Teste de Webhook Local

**Usar Postman ou curl:**

```bash
curl -X POST http://localhost:3000/asaas/webhook \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: whsec_IKhqliIPWuIti6Z4iOud9M1VjjZNyDBFWJ_rSk8mZRI" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_123456",
      "customer": "cus_123456",
      "externalReference": "academy-id-here",
      "value": 99.99,
      "dueDate": "2026-04-26",
      "status": "CONFIRMED",
      "billingType": "CREDIT_CARD",
      "invoiceUrl": "https://..."
    }
  }'
```

**Response esperado:**
```json
{
  "received": true
}
```

### 2. Teste Unitário (Jest)

```typescript
// asaas.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AsaasService } from './asaas.service';
import { of } from 'rxjs';

describe('AsaasService', () => {
  let service: AsaasService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsaasService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const config = {
                ASAAS_API_URL: 'https://sandbox.asaas.com/api/v3',
                ASAAS_API_KEY: 'test-key',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AsaasService>(AsaasService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should create customer', async () => {
    const mockResponse = {
      data: { id: 'cus_123', name: 'Test Academy', email: 'test@example.com' }
    };

    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

    const result = await service.createCustomer({
      name: 'Test Academy',
      email: 'test@example.com',
    });

    expect(result.id).toBe('cus_123');
    expect(httpService.post).toHaveBeenCalled();
  });

  it('should handle Asaas errors', async () => {
    jest.spyOn(httpService, 'post').mockReturnValue(
      throwError(new HttpException('API Error', HttpStatus.BAD_REQUEST))
    );

    await expect(
      service.createCustomer({
        name: 'Test Academy',
        email: 'test@example.com',
      })
    ).rejects.toThrow(HttpException);
  });
});
```

**Executar:**
```bash
npm run test -- asaas.service.spec.ts
```

### 3. Teste de E2E (Playwright)

```typescript
// tests/auth.register.spec.ts
import { test, expect } from '@playwright/test';

test('should register with paid plan', async ({ page }) => {
  await page.goto('http://localhost:5173/register');

  await page.fill('[name="academyName"]', 'Iron Fist Gym');
  await page.fill('[name="email"]', 'admin@ironfist.com');
  await page.fill('[name="password"]', 'password123');
  await page.fill('[name="phone"]', '11987654321');

  // Selecionar plano pago
  await page.click('[data-testid="plan-pro"]');

  // Preencher cartão
  await page.fill('[name="cardNumber"]', '4111111111111111');
  await page.fill('[name="expiryMonth"]', '12');
  await page.fill('[name="expiryYear"]', '25');
  await page.fill('[name="cvv"]', '123');

  // Submeter
  await page.click('button:has-text("Registrar")');

  // Aguardar sucesso (deve exibir QR Code ou Invoice)
  await expect(page.locator('text=QR Code PIX')).toBeVisible();
});
```

**Executar:**
```bash
npm run test:headed
```

---

## Troubleshooting

### ❌ Erro: "ASAAS_API_KEY não definida"

**Causa**: Variável de ambiente não carregada.

**Solução**:
```bash
# Verificar .env
cat backend/.env | grep ASAAS

# Reiniciar servidor
npm run start:dev
```

### ❌ Erro: "Invalid webhook token"

**Causa**: `ASAAS_WEBHOOK_TOKEN` incorreto.

**Solução**:
1. Obter token correto em: https://sandbox.asaas.com/settings/webhooks
2. Copiar e colar em `backend/.env`
3. Testar webhook:
```bash
curl -X POST http://localhost:3000/asaas/webhook \
  -H "asaas-access-token: whsec_..."
```

### ❌ Erro: "Failed to create Asaas customer"

**Causa**: Campos obrigatórios faltando ou validação Asaas.

**Solução**:
- Verificar `cpfCnpj` válido (11 dígitos CPF ou 14 CNPJ)
- Verificar CEP válido
- Ver logs: `console.error(error?.response?.data)`

### ❌ Webhook não chega

**Causa**: Webhook não configurado em Asaas ou firewall bloqueando.

**Solução**:
1. Verificar URL pública do backend em Asaas: https://sandbox.asaas.com/settings/webhooks
2. URL deve ser acessível de fora (não `localhost`)
3. Usar ngrok para testar localmente:
   ```bash
   ngrok http 3000
   # Usar URL ngrok em Asaas
   ```

### ❌ Erro: "Academy not found" no webhook

**Causa**: `externalReference` (academyId) não sendo enviado na criação da subscription.

**Solução**:
```typescript
// Verificar se está sendo enviado
const subscription = await this.asaasService.createSubscription({
    customer: asaasCustomerId,
    // ...
    externalReference: academy.id, // ← Obrigatório para match no webhook
});
```

---

## Referências & Recursos

- **Asaas API Docs**: https://docs.asaas.com
- **Asaas Sandbox**: https://sandbox.asaas.com
- **NestJS Docs**: https://docs.nestjs.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Tipos de Billing Asaas**:
  - `CREDIT_CARD`: Cartão de crédito (cobrança imediata)
  - `BOLETO`: Boleto bancário (até 5 dias úteis)
  - `PIX`: PIX (instantâneo)
  - `UNDEFINED`: Método indefinido
- **Ciclos de Assinatura**:
  - `MONTHLY`: 1 mês
  - `QUARTERLY`: 3 meses
  - `SEMIANNUALLY`: 6 meses
  - `YEARLY`: 1 ano

---

## Checklist de Implementação

- [ ] Variáveis de ambiente configuradas (`.env`)
- [ ] Schema Prisma atualizado com campos Asaas
- [ ] Migração Prisma executada
- [ ] `AsaasService` implementado
- [ ] `AsaasModule` criado
- [ ] `AsaasController` implementado
- [ ] `AsaasWebhookController` implementado
- [ ] `AuthModule` importa `AsaasModule`
- [ ] `AuthService.register()` integrado com Asaas
- [ ] `AppModule` registra `AsaasModule`
- [ ] Front-end consume endpoints (`cancel`, `upgrade`, `pending-payment`)
- [ ] Testes unitários passando
- [ ] Testes E2E passando
- [ ] Webhook testado localmente (ngrok ou exposição pública)
- [ ] Tokens de segurança validados
- [ ] Logs configurados para debug
- [ ] Documentação atualizada

---

## Próximos Passos

1. **Webhooks Avançados**: Processar mais eventos (`PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`)
2. **Refund/Estorno**: Implementar fluxo de reembolso (Asaas DELETE /payments)
3. **Relatórios**: Dashboard de pagamentos e receita (relatório Asaas)
4. **Reconciliação**: Comparar pagamentos Asaas com registros locais
5. **Stripe/PayPal**: Suportar múltiplos gateways de pagamento
6. **Trial Automático**: Bloquear account automaticamente quando trial expira
7. **Invoice Personalizadas**: Customizar nota fiscal com logo/branding

---

**Última atualização**: 2026-04-26
