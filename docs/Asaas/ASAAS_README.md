# 🏦 Integração Asaas - Documentação Completa

**Versão:** 1.0  
**Última atualização:** 2026-04-26  
**Status:** ✅ Pronto para implementação

---

## 📚 Documentação Disponível

Este pacote contém 4 documentos complementares para integração completa com Asaas:

### 1. 📖 [ASAAS_INTEGRATION_GUIDE.md](ASAAS_INTEGRATION_GUIDE.md)
**Quando usar:** Você quer entender completo a integração

**Conteúdo:**
- Visão geral arquitetural completa
- Conceitos & padrões de design
- Estrutura de pastas recomendada
- **Implementação passo-a-passo com código completo** (10 etapas)
- Fluxos de negócio detalhados
- Segurança & idempotência
- Testing & validação
- Troubleshooting
- Referências & recursos

**Tempo de leitura:** 30-40 min
**Use para:** Entender o projeto como um todo, arquitetura, padrões

---

### 2. 🎨 [ASAAS_TECHNICAL_DIAGRAMS.md](ASAAS_TECHNICAL_DIAGRAMS.md)
**Quando usar:** Você quer ver diagramas e sequências

**Conteúdo:**
- Arquitetura geral em ASCII art
- Sequência: Registro com PIX (visual)
- Sequência: Cancelamento (visual)
- Sequência: Webhook com idempotência (visual)
- Data models & DTOs completos
- Tabela de eventos de webhook
- Campos obrigatórios por operação
- Validações críticas (CPF, CEP, cartão)
- Performance & best practices
- Logging strategy
- Endpoints Asaas (referência)
- Exemplos de cURL

**Tempo de leitura:** 20-30 min
**Use para:** Entender fluxos visuais, estrutura de dados, exemplos de requests

---

### 3. ⚡ [ASAAS_QUICK_START.md](ASAAS_QUICK_START.md)
**Quando usar:** Você quer começar AGORA (copy-paste)

**Conteúdo:**
- ✅ 11 etapas de implementação prontas para copiar
- Cada etapa com código completo
- Arquivo + linha de comando exatos
- Comandos de setup
- Testes rápidos
- Troubleshooting
- Estrutura final de pastas

**Tempo de implementação:** 60-90 minutos
**Use para:** Copiar código, implementar rapidamente, desenvolvimento

---

### 4. 📌 [ASAAS_QUICK_REFERENCE.md](ASAAS_QUICK_REFERENCE.md)
**Quando usar:** Você precisa de referência rápida enquanto codifica

**Conteúdo:**
- ✅ Checklist imprimível (PDF-friendly)
- Endpoints rápido
- Variáveis de ambiente
- Eventos de webhook (tabela)
- Tipos de billing & ciclos
- Campos obrigatórios
- Comandos úteis
- Erros comuns & soluções (tabela)
- Fluxos de negócio resumidos
- Segurança checklist
- Testes copy-paste prontos

**Tempo de consulta:** < 5 min por item
**Use para:** Referência durante desenvolvimento, consultas rápidas

---

## 🎯 Como Usar Esta Documentação

### Cenário 1: "Quero integrar Asaas do zero"
1. Leia [ASAAS_INTEGRATION_GUIDE.md](ASAAS_INTEGRATION_GUIDE.md) - seção "Visão Geral" (5 min)
2. Consulte [ASAAS_TECHNICAL_DIAGRAMS.md](ASAAS_TECHNICAL_DIAGRAMS.md) - diagramas (10 min)
3. Implemente usando [ASAAS_QUICK_START.md](ASAAS_QUICK_START.md) - copy-paste (60 min)
4. Use [ASAAS_QUICK_REFERENCE.md](ASAAS_QUICK_REFERENCE.md) - consulte enquanto codifica

**Tempo total:** ~90 min

---

### Cenário 2: "Preciso entender a arquitetura"
1. Leia [ASAAS_INTEGRATION_GUIDE.md](ASAAS_INTEGRATION_GUIDE.md) - tudo (40 min)
2. Estude [ASAAS_TECHNICAL_DIAGRAMS.md](ASAAS_TECHNICAL_DIAGRAMS.md) - diagramas (30 min)
3. Consulte [ASAAS_QUICK_REFERENCE.md](ASAAS_QUICK_REFERENCE.md) - para dúvidas

**Tempo total:** ~70 min

---

### Cenário 3: "Tenho problema com webhook"
1. Abra [ASAAS_QUICK_REFERENCE.md](ASAAS_QUICK_REFERENCE.md) - seção "Erros Comuns" (2 min)
2. Se não resolver, consulte [ASAAS_INTEGRATION_GUIDE.md](ASAAS_INTEGRATION_GUIDE.md) - "Troubleshooting"
3. Veja diagrama em [ASAAS_TECHNICAL_DIAGRAMS.md](ASAAS_TECHNICAL_DIAGRAMS.md) - sequências

**Tempo total:** ~15 min

---

### Cenário 4: "Preciso replicar em outro projeto"
1. Use [ASAAS_QUICK_START.md](ASAAS_QUICK_START.md) - copy-paste completo
2. Consulte [ASAAS_QUICK_REFERENCE.md](ASAAS_QUICK_REFERENCE.md) - para validações
3. Use [ASAAS_INTEGRATION_GUIDE.md](ASAAS_INTEGRATION_GUIDE.md) - se tiver dúvidas

**Tempo total:** ~60 min

---

## 📊 Estrutura de Documentação

```
docs/
├── ASAAS_INTEGRATION_GUIDE.md
│   └─ Guia completo com tudo: arquitetura, padrões, implementação
│
├── ASAAS_TECHNICAL_DIAGRAMS.md
│   └─ Diagramas visuais, sequências, DTOs, validações
│
├── ASAAS_QUICK_START.md
│   └─ Copy-paste pronto: 11 etapas de implementação
│
├── ASAAS_QUICK_REFERENCE.md
│   └─ Referência rápida: checklists, endpoints, erros
│
└── README.md (este arquivo)
    └─ Índice e navegação
```

---

## 🚀 Início Rápido (5 min)

### Para quem tem pressa:

**1. Setup inicial:**
```bash
# .env
ASAAS_API_KEY=seu_key
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=seu_token
```

**2. Copiar código:**
→ Abra [ASAAS_QUICK_START.md](ASAAS_QUICK_START.md) e siga as 11 etapas

**3. Testar:**
```bash
npm run start:dev
curl -X POST http://localhost:3000/asaas/webhook \
  -H "asaas-access-token: seu_token" \
  -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"pay_123","customer":"cus_123","externalReference":"acad-123"}}'
```

**Pronto! ✅**

---

## 🎓 Principais Conceitos

### Service Pattern
```
AsaasService
├─ createCustomer()
├─ createSubscription()
├─ cancelSubscription()
├─ getPaymentsBySubscription()
├─ getPixQrCode()
└─ getSubscription()
```

### Controllers
```
AsaasController
├─ POST /subscription/cancel
├─ POST /subscription/upgrade
└─ GET /subscription/pending-payment

AsaasWebhookController
└─ POST /webhook
```

### Fluxo Completo
```
Register → CreateCustomer → CreateSubscription → PIX/Cartão
   ↓                                               ↓
Academy Created                              Webhook Received
   ↓                                               ↓
isActive = false                            isActive = true
   ↓
Usuário vê QR Code / Invoice
```

---

## 🔒 Segurança

| Aspecto | Implementado |
|---------|------------|
| API Key em .env | ✅ |
| Webhook token validado | ✅ |
| Idempotência | ✅ |
| RBAC (Roles) | ✅ |
| JWT auth | ✅ |
| Transações atômicas | ✅ |
| Error handling | ✅ |

Veja detalhes em: [ASAAS_INTEGRATION_GUIDE.md → Segurança & Idempotência](ASAAS_INTEGRATION_GUIDE.md#segurança--idempotência)

---

## 📞 Endpoints de API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/auth/register` | Pública | Registrar com Asaas |
| `POST` | `/asaas/subscription/cancel` | JWT+MANAGER | Cancelar assinatura |
| `POST` | `/asaas/subscription/upgrade` | JWT+MANAGER | Upgrade de plano |
| `GET` | `/asaas/subscription/pending-payment` | JWT+MANAGER | Pagamento pendente |
| `POST` | `/asaas/webhook` | Token | Receber eventos Asaas |

Referência completa: [ASAAS_QUICK_REFERENCE.md → Endpoints Rápido](ASAAS_QUICK_REFERENCE.md#-endpoints-rápido)

---

## 🧪 Testes

### Webhook Local
```bash
ngrok http 3000
# Copiar URL para Asaas settings/webhooks

curl -X POST http://localhost:3000/asaas/webhook \
  -H "asaas-access-token: whsec_..." \
  -d '{"event":"PAYMENT_RECEIVED","payment":{...}}'
```

### Registro com PIX
```bash
curl -X POST http://localhost:3000/auth/register \
  -d '{
    "academyName":"Test",
    "email":"test@example.com",
    "password":"password123",
    "planId":"plan-id",
    "paymentMethod":"PIX",
    "document":"12345678901234",
    ...
  }'
```

Mais testes: [ASAAS_QUICK_START.md → Testar](ASAAS_QUICK_START.md#-teste-manual-rápido)

---

## 🛠️ Stack Recomendado

```
Backend:
✓ NestJS 9+
✓ Prisma ORM
✓ PostgreSQL
✓ @nestjs/axios
✓ @nestjs/config

Frontend:
✓ React 18+
✓ Axios
✓ React Query (opcional)
✓ TypeScript

Deployment:
✓ Docker
✓ PostgreSQL hospedado
✓ Node 18+
✓ HTTPS obrigatório
```

---

## 📋 Checklist de Produção

```
☐ Variáveis de ambiente em produção
☐ ASAAS_API_URL = https://asaas.com/api/v3 (produção)
☐ ASAAS_API_KEY = token de produção
☐ ASAAS_WEBHOOK_TOKEN = token de produção
☐ URL de webhook pública e https
☐ Logs estruturados (observabilidade)
☐ Alertas para pagamentos vencidos
☐ Backup de BD com webhook logs
☐ Rate limiting ativado
☐ TLS/SSL configurado
☐ Rate limiting Asaas
☐ Testes E2E completos
☐ Documentação atualizada
☐ Runbook de incidentes preparado
```

---

## 🆘 Suporte & Troubleshooting

### Problemas Comuns

| Problema | Solução Rápida |
|----------|---|
| `ASAAS_API_KEY undefined` | Reiniciar `npm run start:dev` |
| `Invalid webhook token` | Validar token em `.env` |
| `Failed to create customer` | Validar CPF/CNPJ (11/14 dígitos) |
| `No academy found` | Enviar `externalReference` = `academyId` |
| `Webhook not arriving` | Usar ngrok + testar com curl |

Guia completo: [ASAAS_QUICK_REFERENCE.md → Erros Comuns](ASAAS_QUICK_REFERENCE.md#-erros-comuns--soluções)

---

## 📚 Referências Externas

- [Asaas API Docs](https://docs.asaas.com) - Documentação oficial
- [Asaas Sandbox](https://sandbox.asaas.com) - Ambiente de testes
- [NestJS Docs](https://docs.nestjs.com) - Framework backend
- [Prisma Docs](https://www.prisma.io/docs) - ORM
- [Jest Testing](https://jestjs.io) - Testes unitários
- [Playwright E2E](https://playwright.dev) - Testes end-to-end

---

## 🎓 Roadmap de Implementação

### Fase 1: MVP (Você está aqui)
- ✅ Registrar com plano pago
- ✅ Cancelar assinatura
- ✅ Webhook de pagamento
- ✅ Upgrade de plano

**Tempo:** 2-3 horas

---

### Fase 2: Refinement (Próximo)
- 📋 Refund/Estorno
- 📋 Dashboard de pagamentos
- 📋 Relatórios financeiros
- 📋 Automação de cobranças

**Tempo:** 1-2 dias

---

### Fase 3: Scale (Futuro)
- 📋 Múltiplos gateways (Stripe, PayPal)
- 📋 Testes A/B de checkout
- 📋 Análise de churn
- 📋 Trial automático

**Tempo:** 1 semana

---

## 💡 Dicas Profissionais

1. **Comece com Sandbox** → Não use produção até testar tudo
2. **Use ngrok** → Teste webhooks localmente
3. **Log tudo** → Webhooks são assincronos, logs ajudam
4. **Teste idempotência** → Simule reenvio de webhook
5. **Valide dados** → CPF, CEP, cartão devem ser válidos
6. **Use transações** → Garanta consistência BD + Asaas
7. **Implemente retry** → APIs falham às vezes
8. **Documente tudo** → Futuros devs vão agradecer

---

## 🤝 Contribuindo

Se encontrar erros, gaps ou melhorias:

1. Abra issue no repositório
2. Descreva o problema + solução
3. Compartilhe feedback

---

## 📝 Histórico de Versão

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2026-04-26 | Versão inicial completa |

---

## 📄 Licença

Este documento é open-source. Sinta-se livre para usar, modificar e compartilhar.

---

## 🎉 Pronto para Começar?

1. **Leia rápido**: [ASAAS_INTEGRATION_GUIDE.md](ASAAS_INTEGRATION_GUIDE.md) (5 min)
2. **Implemente agora**: [ASAAS_QUICK_START.md](ASAAS_QUICK_START.md) (60 min)
3. **Consulte sempre**: [ASAAS_QUICK_REFERENCE.md](ASAAS_QUICK_REFERENCE.md)

**Tempo total de implementação: ~90 minutos**

Boa sorte! 🚀

---

**Última atualização**: 2026-04-26  
**Mantido por**: Equipe de Backend
