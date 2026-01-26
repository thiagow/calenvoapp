# WhatsApp - Integração com Evolution API

## 📋 Descrição

Integração completa com WhatsApp via Evolution API para envio de notificações automatizadas aos clientes.

## 📍 Localização no Código

### APIs
- `POST /api/whatsapp/connect` - Conectar instância
- `GET /api/whatsapp/qrcode` - Gerar QR Code
- `POST /api/whatsapp/send` - Enviar mensagem
- `GET /api/whatsapp/status` - Status da conexão
- `POST /api/whatsapp/disconnect` - Desconectar
- `POST /api/whatsapp/webhook` - Receber webhooks

## 🗄️ Modelo de Dados

```prisma
model WhatsAppConfig {
  id                String   @id @default(cuid())
  instanceName      String   @unique   // Nome da instância na Evolution API
  apiKey            String?             // API Key da Evolution
  apiUrl            String              // URL da Evolution API
  phoneNumber       String?             // Número do WhatsApp conectado
  isConnected       Boolean  @default(false)
  qrCode            String?  @db.Text   // QR Code para conexão
  
  // Configurações de notificações
  enabled           Boolean  @default(false)
  notifyOnCreate    Boolean  @default(true)
  notifyOnConfirm   Boolean  @default(true)
  notifyOnCancel    Boolean  @default(true)
  notifyReminder    Boolean  @default(true)
  reminderHours     Int      @default(24) // Horas antes do agendamento
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
}
```

## 🎯 Funcionalidades

### 1. Conexão

#### Gerar QR Code
```typescript
async function generateQRCode(userId: string) {
  const config = await prisma.whatsAppConfig.findUnique({
    where: { userId },
  })
  
  // Criar ou recuperar instância na Evolution API
  const response = await fetch(`${config.apiUrl}/instance/create`, {
    method: 'POST',
    headers: {
      'apikey': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instanceName: config.instanceName,
      qrcode: true,
    }),
  })
  
  const data = await response.json()
  
  // Salvar QR Code
  await prisma.whatsAppConfig.update({
    where: { userId },
    data: { qrCode: data.qrcode.base64 },
  })
  
  return data.qrcode.base64
}
```

#### Verificar Conexão
```typescript
async function checkConnection(userId: string) {
  const config = await prisma.whatsAppConfig.findUnique({
    where: { userId },
  })
  
  const response = await fetch(
    `${config.apiUrl}/instance/connectionState/${config.instanceName}`,
    {
      headers: { 'apikey': config.apiKey },
    }
  )
  
  const data = await response.json()
  
  const isConnected = data.state === 'open'
  
  await prisma.whatsAppConfig.update({
    where: { userId },
    data: {
      isConnected,
      phoneNumber: isConnected ? data.instance.phoneNumber : null,
    },
  })
  
  return isConnected
}
```

### 2. Envio de Mensagens

#### Função Base
```typescript
async function sendWhatsAppMessage(
  userId: string,
  to: string,
  message: string
) {
  const config = await prisma.whatsAppConfig.findUnique({
    where: { userId },
  })
  
  if (!config?.isConnected || !config?.enabled) {
    throw new Error('WhatsApp não configurado ou desconectado')
  }
  
  // Formatar número (remover caracteres especiais)
  const number = to.replace(/\D/g, '')
  
  // Enviar mensagem
  const response = await fetch(`${config.apiUrl}/message/sendText`, {
    method: 'POST',
    headers: {
      'apikey': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instance: config.instanceName,
      number: `${number}@s.whatsapp.net`,
      text: message,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Falha ao enviar mensagem WhatsApp')
  }
  
  return response.json()
}
```

### 3. Templates de Mensagens

```typescript
const WHATSAPP_TEMPLATES = {
  APPOINTMENT_CREATED: (data: AppointmentData) => `
🎉 *Agendamento Confirmado!*

Olá *${data.clientName}*!

Seu agendamento foi confirmado com sucesso:

📅 *Data:* ${format(data.date, "dd/MM/yyyy")}
🕐 *Horário:* ${format(data.date, "HH:mm")}
💼 *Serviço:* ${data.serviceName}
👤 *Profissional:* ${data.professionalName || 'A definir'}

📍 *Local:* ${data.businessName}
${data.address ? `📌 ${data.address}` : ''}

${data.phone ? `📞 *Telefone:* ${data.phone}` : ''}

Caso precise cancelar ou reagendar, entre em contato.

_Mensagem automática - Não responder_
  `.trim(),

  APPOINTMENT_REMINDER: (data: AppointmentData) => `
⏰ *Lembrete de Agendamento*

Olá *${data.clientName}*!

Lembrando que você tem um agendamento *amanhã*:

🕐 *Horário:* ${format(data.date, "HH:mm")}
💼 *Serviço:* ${data.serviceName}
👤 *Com:* ${data.professionalName}

📍 ${data.businessName}

Confirme sua presença respondendo *SIM*.
Para cancelar, responda *CANCELAR*.

_Mensagem automática - Não responder_
  `.trim(),

  APPOINTMENT_CANCELLED: (data: AppointmentData) => `
❌ *Agendamento Cancelado*

Olá *${data.clientName}*,

Seu agendamento foi cancelado:

📅 ${format(data.date, "dd/MM/yyyy")} às ${format(data.date, "HH:mm")}
💼 ${data.serviceName}

${data.cancelReason ? `Motivo: ${data.cancelReason}` : ''}

Para reagendar, acesse: ${data.bookingUrl}

_Mensagem automática - Não responder_
  `.trim(),

  APPOINTMENT_CONFIRMED: (data: AppointmentData) => `
✅ *Confirmação Recebida!*

Olá *${data.clientName}*,

Sua presença foi confirmada para:

📅 ${format(data.date, "dd/MM/yyyy")}
🕐 ${format(data.date, "HH:mm")}

Nos vemos lá! 🙌

_Mensagem automática - Não responder_
  `.trim(),
}
```

### 4. Automações

#### Lembrete Automático
```typescript
// Cron job que roda a cada hora
export async function sendAppointmentReminders() {
  const now = new Date()
  
  // Buscar configs com lembretes habilitados
  const configs = await prisma.whatsAppConfig.findMany({
    where: {
      enabled: true,
      notifyReminder: true,
      isConnected: true,
    },
    include: { user: true },
  })
  
  for (const config of configs) {
    const reminderTime = addHours(now, config.reminderHours)
    
    // Buscar agendamentos no período de lembrete
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: config.userId,
        date: {
          gte: reminderTime,
          lte: addHours(reminderTime, 1),
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: {
        client: true,
        service: true,
        professionalUser: true,
      },
    })
    
    // Enviar lembrete para cada agendamento
    for (const apt of appointments) {
      const message = WHATSAPP_TEMPLATES.APPOINTMENT_REMINDER({
        clientName: apt.client.name,
        date: apt.date,
        serviceName: apt.service?.name || 'Atendimento',
        professionalName: apt.professionalUser?.name || 'Equipe',
        businessName: config.user.businessName || 'Nossa empresa',
      })
      
      try {
        await sendWhatsAppMessage(
          config.userId,
          apt.client.phone,
          message
        )
        
        // Criar notificação interna
        await prisma.notification.create({
          data: {
            userId: config.userId,
            type: 'APPOINTMENT_REMINDER',
            title: 'Lembrete enviado',
            message: `Lembrete enviado para ${apt.client.name}`,
            appointmentId: apt.id,
          },
        })
      } catch (error) {
        console.error('Erro ao enviar lembrete:', error)
      }
    }
  }
}
```

## 🎨 Interface de Configuração

```tsx
<WhatsAppSettings>
  <Header>
    <h2>Integração WhatsApp</h2>
    <StatusBadge 
      status={config.isConnected ? 'connected' : 'disconnected'} 
    />
  </Header>
  
  {!config.isConnected ? (
    <ConnectionSection>
      <p>Conecte seu WhatsApp para enviar notificações aos clientes</p>
      
      <Form onSubmit={handleConnect}>
        <Input 
          name="apiUrl" 
          label="URL da Evolution API"
          placeholder="https://api.evolution.com"
        />
        <Input 
          name="apiKey" 
          label="API Key"
          type="password"
        />
        
        <Button type="submit">Gerar QR Code</Button>
      </Form>
      
      {qrCode && (
        <QRCodeSection>
          <QRCode value={qrCode} size={256} />
          <p>Escaneie com o WhatsApp</p>
          <Button onClick={checkConnection}>
            Verificar Conexão
          </Button>
        </QRCodeSection>
      )}
    </ConnectionSection>
  ) : (
    <ConfigSection>
      <ConnectedInfo>
        <CheckCircle />
        <span>Conectado: {config.phoneNumber}</span>
        <Button variant="ghost" onClick={handleDisconnect}>
          Desconectar
        </Button>
      </ConnectedInfo>
      
      <Switch 
        name="enabled" 
        label="Enviar notificações via WhatsApp"
        checked={config.enabled}
        onChange={handleToggle}
      />
      
      {config.enabled && (
        <>
          <CheckboxGroup label="Enviar em:">
            <Checkbox 
              name="notifyOnCreate" 
              label="Criação de agendamento"
              checked={config.notifyOnCreate}
            />
            <Checkbox 
              name="notifyOnConfirm" 
              label="Confirmação"
              checked={config.notifyOnConfirm}
            />
            <Checkbox 
              name="notifyOnCancel" 
              label="Cancelamento"
              checked={config.notifyOnCancel}
            />
            <Checkbox 
              name="notifyReminder" 
              label="Lembretes"
              checked={config.notifyReminder}
            />
          </CheckboxGroup>
          
          <NumberInput 
            name="reminderHours" 
            label="Enviar lembrete (horas antes)"
            value={config.reminderHours}
            min={1}
            max={72}
          />
          
          <Button onClick={handleTestMessage}>
            Enviar Mensagem de Teste
          </Button>
        </>
      )}
    </ConfigSection>
  )}
</WhatsAppSettings>
```

## 🔐 Segurança

### Proteção de Dados
```typescript
// API Key nunca exposta ao cliente
// Armazenada de forma segura no banco

// Validação de número
function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

// Rate limiting
// Máximo 100 mensagens por hora por conta
```

## 🎯 Casos de Uso

### 1. Configurar WhatsApp pela Primeira Vez
**Fluxo**:
1. Master acessa Configurações → Notificações
2. Insere URL e API Key da Evolution
3. Clica em "Gerar QR Code"
4. Escaneia QR Code com WhatsApp
5. Conexão estabelecida
6. Ativa envio de notificações
7. Configura tipos de mensagem
8. Define lembrete para 24h antes

### 2. Cliente Recebe Confirmação
**Fluxo**:
1. Master cria agendamento
2. Sistema verifica WhatsApp habilitado
3. Formata mensagem com template
4. Envia via Evolution API
5. Cliente recebe WhatsApp
6. Mensagem salva no histórico

## 🚀 Melhorias Futuras

- [ ] Mensagens com mídia (imagens, PDFs)
- [ ] Respostas automáticas (chatbot)
- [ ] Confirmação via WhatsApp (botões interativos)
- [ ] Templates personalizáveis
- [ ] Histórico de mensagens
- [ ] Métricas de entrega
- [ ] Grupos de WhatsApp
- [ ] Broadcast para múltiplos clientes
