-- SQL para o nó "Execute a SQL query" do n8n
-- Objetivo: Buscar agendamentos que necessitam de lembrete de WhatsApp
-- Frequência recomendada: RODAR A CADA 1 HORA (ou 30 min)

SELECT 
  -- Dados do agendamento
  a.id                    AS appointment_id,
  a.date                  AS appointment_date,
  a.duration              AS appointment_duration,
  a.status                AS appointment_status,
  a.notes                 AS appointment_notes,

  -- Dados do cliente (destinatário)
  c.id                    AS client_id,
  c.name                  AS client_name,
  c.phone                 AS client_phone,

  -- Dados do serviço
  s.name                  AS service_name,

  -- Dados do profissional responsável
  p.name                  AS professional_name,

  -- Dados do dono da conta (empresa)
  u.id                    AS user_id,
  u.name                  AS user_name,
  u."businessName"        AS business_name,

  -- Configuração WhatsApp (para envio da mensagem)
  wc."instanceName"       AS instance_name,
  wc."reminderHours"      AS reminder_hours,
  wc."reminderMessage"    AS reminder_message

FROM "Appointment" a
  INNER JOIN "Client" c             ON c.id = a."clientId"
  INNER JOIN "User" u               ON u.id = a."userId"
  INNER JOIN "WhatsAppConfig" wc    ON wc."userId" = u.id
  LEFT  JOIN "Service" s            ON s.id = a."serviceId"
  LEFT  JOIN "User" p               ON p.id = a."professionalId"

WHERE 
  -- 1. WhatsApp globalmente ativado e conectado
  wc.enabled = true
  AND wc."isConnected" = true

  -- 2. Lembrete (Reminder) ativado
  AND wc."notifyReminder" = true

  -- 3. Apenas agendamentos válidos (não cancelados/concluídos)
  AND a.status IN ('SCHEDULED', 'CONFIRMED')

  -- 4. Cliente possui telefone para receber WhatsApp
  AND c.phone IS NOT NULL
  AND c.phone <> ''

  -- 5. Janela de lembrete: agendamentos que ocorrem nas próximas X horas
  --    Usa reminderHours de cada usuário para calcular a janela
  --    Janela de 30min antes/depois para tolerância do CRON
  AND a.date BETWEEN 
    (NOW() + (wc."reminderHours" * INTERVAL '1 hour') - INTERVAL '30 minutes')
    AND
    (NOW() + (wc."reminderHours" * INTERVAL '1 hour') + INTERVAL '30 minutes')

  -- 6. Anti-duplicata: não envia se já existe notificação de lembrete registrada no banco
  AND NOT EXISTS (
    SELECT 1 
    FROM "Notification" n 
    WHERE n."appointmentId" = a.id 
      AND n.type = 'APPOINTMENT_REMINDER'
  )

ORDER BY a.date ASC;
