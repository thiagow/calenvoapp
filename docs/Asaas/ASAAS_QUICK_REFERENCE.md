# 📌 Asaas Integration - Referência Rápida & Checklist

---

## 🎯 Checklist de Implementação (Imprimível)

```
┌─────────────────────────────────────────────────────────┐
│ ASAAS INTEGRATION CHECKLIST                             │
│ Projeto: _____________________  Data: _____/____/______│
├─────────────────────────────────────────────────────────┤
│ SETUP & CONFIG                                          │
│ ☐ Conta Asaas criada (sandbox)                         │
│ ☐ API_KEY obtida                                        │
│ ☐ WEBHOOK_TOKEN obtida                                 │
│ ☐ Variáveis em .env                                    │
│                                                         │
│ BANCO DE DADOS                                         │
│ ☐ Campos asaasCustomerId adicionados (Academy)        │
│ ☐ Campos asaasSubscriptionId adicionados (Academy)    │
│ ☐ Tabela AsaasWebhookLog criada                       │
│ ☐ Migração executada                                   │
│ ☐ npm run prisma:generate executado                   │
│                                                         │
│ BACKEND - MÓDULOS                                      │
│ ☐ asaas.service.ts criado                             │
│ ☐ asaas.controller.ts criado                          │
│ ☐ asaas.webhook.controller.ts criado                  │
│ ☐ asaas.module.ts criado                              │
│ ☐ AsaasModule importado em AuthModule                 │
│ ☐ AsaasModule importado em AppModule                  │
│                                                         │
│ BACKEND - INTEGRAÇÕES                                  │
│ ☐ AsaasService injetado em AuthService               │
│ ☐ AuthService.register() integrado com Asaas          │
│ ☐ createCustomer() chamado no registro                │
│ ☐ createSubscription() chamado se plano pago          │
│ ☐ Retorno inclui pixPayload e pixEncodedImage         │
│                                                         │
│ FRONTEND                                               │
│ ☐ asaas-service.ts criado                             │
│ ☐ cancelSubscription() implementado                    │
│ ☐ upgradeSubscription() implementado                   │
│ ☐ getPendingPayment() implementado                     │
│ ☐ Componentes de UI para QR Code PIX                  │
│ ☐ Componentes de UI para Invoice URL                  │
│                                                         │
│ TESTES                                                 │
│ ☐ Webhook testado com curl                            │
│ ☐ Registro com plano pago funciona                    │
│ ☐ Cancelamento funciona                               │
│ ☐ Upgrade funciona                                     │
│ ☐ Pending payment retorna corretamente                │
│ ☐ Webhook é processado corretamente                   │
│                                                         │
│ SEGURANÇA                                              │
│ ☐ Webhook token validado                              │
│ ☐ Idempotência implementada                           │
│ ☐ Roles MANAGER verificadas                           │
│ ☐ Erros Asaas tratados corretamente                   │
│ ☐ Logs configurados                                    │
│                                                         │
│ DEPLOYMENT                                             │
│ ☐ .env.example atualizado                             │
│ ☐ README.md atualizado com instruções                 │
│ ☐ Migração commitada no git                           │
│ ☐ URL pública do webhook configurada em Asaas         │
│ ☐ Environment variáveis em produção configuradas      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 Endpoints Rápido

```
POST /register
├─ Body: { academyName, email, password, phone, planId, document,
│          paymentMethod, creditCard, creditCardHolderInfo, ... }
└─ Response: { accessToken, refreshToken, user, pixPayload, pixEncodedImage }

POST /asaas/subscription/cancel
├─ Auth: JWT (MANAGER role)
├─ Body: {}
└─ Response: { message: "Assinatura cancelada com sucesso." }

POST /asaas/subscription/upgrade
├─ Auth: JWT (MANAGER role)
├─ Body: { newPlanId, creditCard, creditCardHolderInfo }
└─ Response: { message: "Plano atualizado com sucesso." }

GET /asaas/subscription/pending-payment
├─ Auth: JWT (MANAGER role)
└─ Response: { invoiceUrl, billingType, value, dueDate, status, 
              pixPayload, pixEncodedImage } | null

POST /asaas/webhook
├─ Header: asaas-access-token
├─ Body: { event, payment }
└─ Response: { received: true }
```

---

## 💾 Variáveis de Ambiente

```env
# Obrigatórias
ASAAS_API_KEY=                  # De: https://sandbox.asaas.com/api
ASAAS_API_URL=                  # https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=            # De: https://sandbox.asaas.com/settings/webhooks

# Informacionais
ASAAS_ENVIRONMENT=              # sandbox | production
ASAAS_WEBHOOK_URL=              # https://seu-dominio.com/asaas/webhook
```

---

## 🔄 Eventos de Webhook

```typescript
enum AsaasWebhookEvent {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',           // ✅ isActive = true
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',         // ✅ isActive = true
  PAYMENT_PENDING = 'PAYMENT_PENDING',             // ℹ️ (info)
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',             // ❌ isActive = false
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',           // ❌ isActive = false
  PAYMENT_CHARGEBACK_REQUESTED = 'PAYMENT_CHARGEBACK_REQUESTED', // ❌ isActive = false
  PAYMENT_DELETED = 'PAYMENT_DELETED',             // ℹ️ (info)
  PAYMENT_AWAITING_RISK_ANALYSIS = 'PAYMENT_AWAITING_RISK_ANALYSIS', // ℹ️
}
```

---

## 📊 Tipos de Billing & Ciclos

```typescript
// Billing Types
enum BillingType {
  CREDIT_CARD = 'CREDIT_CARD',  // Cobrança imediata
  BOLETO = 'BOLETO',            // Até 5 dias úteis
  PIX = 'PIX',                  // Instantâneo
  UNDEFINED = 'UNDEFINED',      // Indefinido
}

// Subscription Cycles
enum SubscriptionCycle {
  MONTHLY = 'MONTHLY',              // 1 mês
  QUARTERLY = 'QUARTERLY',          // 3 meses
  SEMIANNUALLY = 'SEMIANNUALLY',   // 6 meses
  YEARLY = 'YEARLY',                // 1 ano
}
```

---

## ✅ Campos Obrigatórios

### createCustomer()
```
✓ name
✓ email
○ phone (recomendado)
○ cpfCnpj (recomendado)
○ externalReference (OBRIGATÓRIO para webhook matching)
○ postalCode (recomendado)
○ address (recomendado)
○ addressNumber (recomendado)
```

### createSubscription()
```
✓ customer
✓ billingType
✓ value
✓ nextDueDate (YYYY-MM-DD)
✓ cycle
○ description (recomendado)
○ externalReference (OBRIGATÓRIO para webhook matching)
○ creditCard (SE billingType = CREDIT_CARD)
  ✓ holderName
  ✓ number
  ✓ expiryMonth
  ✓ expiryYear
  ✓ ccv
○ creditCardHolderInfo (SE creditCard fornecido)
  ✓ name
  ✓ email
  ✓ cpfCnpj (11 ou 14 dígitos sem máscara)
  ✓ postalCode (8 dígitos)
  ✓ addressNumber
  ○ addressComplement
  ✓ phone
  ○ mobilePhone
```

---

## 🛠️ Comandos Rápidos

```bash
# Iniciar backend
npm run start:dev

# Gerar cliente Prisma
npm run prisma:generate

# Executar migração
npm run prisma:migrate -- --name descricao

# Ver status migrations
npm run prisma:migrate status

# Resetar DB (dev only!)
npm run prisma:migrate reset

# Testar webhook local com ngrok
ngrok http 3000
# Copiar URL gerada para Asaas: https://xxx-xxx-xxx.ngrok.io/asaas/webhook

# Testar com curl
curl -X POST http://localhost:3000/asaas/webhook \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: whsec_..." \
  -d '{"event":"PAYMENT_RECEIVED","payment":{}}'
```

---

## 🚨 Erros Comuns & Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| `ASAAS_API_KEY undefined` | .env não carregado | Reiniciar servidor + checar .env |
| `Invalid webhook token` | Token incorreto | Copiar de Asaas → settings/webhooks |
| `Failed to create customer` | CPF/CNPJ inválido | Validar: 11 (CPF) ou 14 (CNPJ) dígitos |
| `Customer already exists` | Email duplicado | Usar email único para novo customer |
| `No academy found` | externalReference não enviado | Adicionar academy.id ao criar subscription |
| `Webhook not arriving` | URL não acessível | Usar ngrok ou expor publicamente |
| `Duplicate webhook processing` | Sem idempotência | Implementar check de processed flag |
| `isActive sempre false` | Webhook não processado | Verificar token webhook + logs |

---

## 📈 Fluxos de Negócio

### Fluxo Mínimo de Registro com PIX

```
1. Frontend: POST /register
   └─ body: { email, password, academyName, paymentMethod: 'PIX', ... }

2. Backend: AuthService.register()
   ├─ Criar academy (isActive: false, até confirmação)
   ├─ Criar user
   ├─ AsaasService.createCustomer() → cus_...
   ├─ AsaasService.createSubscription(billingType: 'PIX') → sub_...
   ├─ AsaasService.getPaymentsBySubscription() → [pay_...]
   ├─ AsaasService.getPixQrCode(pay_...) → { encodedImage, payload }
   └─ academy.update(asaasCustomerId, asaasSubscriptionId)

3. Response: { tokens, pixPayload, pixEncodedImage }

4. Frontend: Exibir QR Code para escanear

5. Usuário: Escaneia + paga no banco

6. Asaas: Processa pagamento + envia webhook

7. Backend: POST /asaas/webhook (PAYMENT_RECEIVED)
   ├─ Validar token
   ├─ Verificar idempotência
   ├─ academy.update(isActive: true)
   └─ Log webhook como processado

8. Sistema: Academy agora ativa!
```

---

## 🔐 Segurança - Checklist

```
☐ API_KEY nunca commitada (apenas em .env git-ignored)
☐ Webhook token validado em TODAS as chamadas
☐ Idempotência implementada (evita duplicatas)
☐ Roles verificadas (@Roles(MANAGER))
☐ JWT validado (@UseGuards(JwtAuthGuard))
☐ Erros Asaas não expõem dados sensíveis
☐ Logs não registram números de cartão
☐ Transações Prisma usadas (atomicidade)
☐ Rate limiting configurado (opcional)
☐ HTTPS obrigatório em produção
```

---

## 📦 Dependências Verificadas

```bash
# Verificar
npm ls @nestjs/common
npm ls @nestjs/config
npm ls @nestjs/axios
npm ls @prisma/client
npm ls prisma

# Se faltando, instalar
npm install @nestjs/axios @nestjs/config
npm install -D @types/node
```

---

## 🧪 Teste Rápido (Copy-Paste)

**1. Testar webhook**
```bash
curl -X POST http://localhost:3000/asaas/webhook \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: whsec_IKhqliIPWuIti6Z4iOud9M1VjjZNyDBFWJ_rSk8mZRI" \
  -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"pay_123","customer":"cus_123","externalReference":"acad-123","value":99.99}}'
```

**2. Testar registro (sem cartão, apenas PIX)**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "academyName":"Test Academy",
    "email":"test@example.com",
    "name":"Test User",
    "password":"password123",
    "phone":"11987654321",
    "planId":"plan-id-here",
    "document":"12345678901234",
    "paymentMethod":"PIX",
    "postalCode":"01234567",
    "address":"Rua Principal",
    "addressNumber":"123"
  }'
```

**3. Testar GET pending payment**
```bash
curl -X GET http://localhost:3000/asaas/subscription/pending-payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📚 Documentação Completa

- **Guia Completo**: `ASAAS_INTEGRATION_GUIDE.md`
- **Diagramas Técnicos**: `ASAAS_TECHNICAL_DIAGRAMS.md`
- **Quick Start**: `ASAAS_QUICK_START.md`
- **Esta Referência**: `ASAAS_QUICK_REFERENCE.md`

---

## 🎓 Referências Externas

- [Asaas API Docs](https://docs.asaas.com)
- [Asaas Sandbox](https://sandbox.asaas.com)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [RFC 3986 (URLs)](https://tools.ietf.org/html/rfc3986)

---

## 🚀 Próximas Etapas

1. **Fase 1**: Implementação básica (você está aqui)
2. **Fase 2**: Refund/Estorno (`DELETE /payments`)
3. **Fase 3**: Dashboard Financeiro (relatórios Asaas)
4. **Fase 4**: Reconciliação automática
5. **Fase 5**: Múltiplos gateways (Stripe, PayPal)
6. **Fase 6**: Teste A/B (diferentes fluxos de pagamento)

---

## 💡 Pro Tips

- Use **ngrok** para testar webhooks localmente em dev
- Sempre validar `externalReference` = `academyId` para match correto
- Implementar **logging estruturado** para debug de webhooks
- Testar com **Asaas Sandbox** antes de produção
- Usar **Postman** para documentar e testar endpoints
- Implementar **retry logic** para falhas de API (com exponential backoff)
- Configurar **alertas** para pagamentos vencidos
- Usar **rate limiting** para proteger endpoints críticos

---

**Última atualização**: 2026-04-26
**Status**: ✅ Pronto para implementação
