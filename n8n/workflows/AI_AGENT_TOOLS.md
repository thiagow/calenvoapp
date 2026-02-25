# 🤖 AI Agent Tools - Calenvo (SQL Native)

Este documento define as 4 ferramentas (tools) que o Agente de IA utiliza para interagir com o banco de dados PostgreSQL.
Todas as tools devem ser configuradas no n8n usando o nó **Postgres**, operação **Execute Query**.

---

## 🛠️ Tool 1: Consultar Serviços

**Nome:** `consultar_servicos`
**Descrição:** Lista os serviços oferecidos pela empresa, incluindo preço e duração. Use para ajudar o cliente a escolher.

**Parâmetros (Input):**
- `userId` (string): ID do tenant/empresa.

**Query SQL:**
```sql
SELECT 
    id, 
    name, 
    description, 
    duration as "duracao_minutos", 
    price as "preco", 
    category
FROM "Service"
WHERE "userId" = $1
  AND "isActive" = true
ORDER BY name ASC;
```
*Mapeamento de parâmetros no n8n:* `$fromAI("userId")` ou `{{ $json.userId }}`

---

## 🛠️ Tool 2: Consultar Disponibilidade (Agendas)

**Nome:** `consultar_disponibilidade`
**Descrição:** Verifica horários disponíveis. Retorna slots livres para a data solicitada. Se não houver, busca automaticamente nos próximos 3 dias.

**Parâmetros (Input):**
- `userId` (string): ID do tenant.
- `serviceId` (string): ID do serviço desejado (para pegar a duração).
- `scheduleId` (string): ID do profissional/agenda (opcional, se não informado, a query pode ser adaptada ou o agente deve perguntar).
- `date` (string): Data desejada (formato YYYY-MM-DD).

**Query SQL:**
> **Nota:** Esta query gera slots dinamicamente e remove os ocupados. Ela analisa a data pedida e os 2 dias seguintes.

```sql
WITH RECURSIVE 
-- 1. Parâmetros da Busca
params AS (
    SELECT 
        $1::uuid as user_id,
        $2::uuid as service_id,
        $3::uuid as schedule_id, -- Pode ser null se quiser buscar qqr agenda
        $4::date as target_date,
        3 as days_to_check -- Quantos dias olhar p/ frente se o atual esgotar
),
-- 2. Informações do Serviço e Agenda
config AS (
    SELECT 
        s.id as schedule_id,
        s."workingDays",
        s."startTime",
        s."endTime",
        s."slotDuration", -- Intervalo padrão da agenda
        svc.duration as service_duration
    FROM "Schedule" s
    JOIN "Service" svc ON svc.id = (select service_id from params)
    WHERE s.id = (select schedule_id from params)
      AND s."isActive" = true
),
-- 3. Gerador de Datas (Data Alvo + Próximos Dias)
dates_series AS (
    SELECT (select target_date from params) as dt, 0 as offset_day
    UNION ALL
    SELECT dt + 1, offset_day + 1
    FROM dates_series
    WHERE offset_day < (select days_to_check from params)
),
-- 4. Gerador de Slots Brutos
raw_slots AS (
    SELECT 
        d.dt,
        d.dt + (t * interval '1 minute') as slot_start,
        d.dt + ((t + c.service_duration) * interval '1 minute') as slot_end
    FROM dates_series d
    CROSS JOIN config c
    CROSS JOIN generate_series(
        EXTRACT(EPOCH FROM c."startTime"::time)/60, 
        EXTRACT(EPOCH FROM c."endTime"::time)/60 - c.service_duration, 
        c."slotDuration" -- Passo do loop
    ) t
    WHERE 
        -- Filtra dias da semana que a agenda funciona (Postgres DOW: 0=Dom, 6=Sab)
        EXTRACT(DOW FROM d.dt) = ANY(c."workingDays")
),
-- 5. Agendamentos Existentes (Bloqueios)
occupied AS (
    SELECT date as start_time, date + (duration * interval '1 minute') as end_time
    FROM "Appointment"
    WHERE "scheduleId" = (select schedule_id from params)
      AND status IN ('SCHEDULED', 'CONFIRMED')
      AND date >= (select target_date from params)
)
-- 6. Seleção Final (Slots Brutos - Ocupados)
SELECT 
    to_char(r.slot_start, 'YYYY-MM-DD') as data,
    to_char(r.slot_start, 'HH24:MI') as horario,
    to_char(r.slot_end, 'HH24:MI') as fim
FROM raw_slots r
WHERE NOT EXISTS (
    SELECT 1 FROM occupied o
    WHERE 
        (r.slot_start >= o.start_time AND r.slot_start < o.end_time) -- Começa dentro
        OR 
        (r.slot_end > o.start_time AND r.slot_end <= o.end_time) -- Termina dentro
        OR
        (r.slot_start <= o.start_time AND r.slot_end >= o.end_time) -- Engloba
)
ORDER BY r.slot_start ASC
LIMIT 15; -- Retorna 15 opções para não poluir o chat
```
*Mapeamento de parâmetros no n8n:* 
`$1 = $json.userId`, `$2 = $json.serviceId`, `$3 = $json.scheduleId`, `$4 = $json.date`

---

## 🛠️ Tool 3: Informações Empresa

**Nome:** `info_empresa`
**Descrição:** Busca dados de contato, endereço e regras de negócio da empresa.

**Parâmetros (Input):**
- `userId` (string): ID do tenant.

**Query SQL:**
```sql
SELECT 
    u."businessName" as nome_empresa,
    u.phone as telefone,
    u.whatsapp,
    u."segmentType" as segmento,
    bc."workingDays" as dias_funcionamento,
    to_char(bc."startTime", 'HH24:MI') as abertura,
    to_char(bc."endTime", 'HH24:MI') as fechamento,
    bc.address as endereco
FROM "User" u
LEFT JOIN "BusinessConfig" bc ON bc."userId" = u.id
WHERE u.id = $1;
```

---

## 🛠️ Tool 4: Criar Agendamento

**Nome:** `criar_agendamento`
**Descrição:** Finaliza o agendamento. Cria o cliente se for novo e insere o horário na agenda.

**Parâmetros (Input):**
- `userId` (string): ID do tenant.
- `clientName` (string): Nome do cliente.
- `clientPhone` (string): Telefone do cliente (apenas números).
- `scheduleId` (string): ID da agenda/profissional.
- `serviceId` (string): ID do serviço.
- `date` (string): Data e hora completa do início (ISO 8601 ex: 2024-02-20T14:00:00).

**Query SQL:**
> Esta query usa TÉCNICA CTE para fazer "Upsert" do cliente e Insert do agendamento em uma única execução.

```sql
WITH 
-- 1. Garante que o cliente existe
client_data AS (
    INSERT INTO "Client" (id, name, phone, "userId", "updatedAt", "createdAt")
    VALUES (
        gen_random_uuid()::text, 
        $2, -- clientName
        $3, -- clientPhone
        $1, -- userId
        NOW(),
        NOW()
    )
    ON CONFLICT (phone, "userId") 
    DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
    RETURNING id, name
),
-- 2. Busca duração do serviço
service_info AS (
    SELECT duration FROM "Service" WHERE id = $5
),
-- 3. Insere o agendamento
new_appointment AS (
    INSERT INTO "Appointment" (
        id, 
        "userId", 
        "clientId", 
        "scheduleId", 
        "serviceId", 
        date, 
        duration, 
        status, 
        modality, 
        "createdAt", 
        "updatedAt"
    )
    SELECT 
        gen_random_uuid()::text,
        $1, -- userId
        (SELECT id FROM client_data), -- clientId recuperado
        $4, -- scheduleId
        $5, -- serviceId
        $6::timestamp, -- date
        (SELECT duration FROM service_info),
        'SCHEDULED',
        'PRESENCIAL',
        NOW(),
        NOW()
    RETURNING id, date, status
)
-- 4. Retorno final
SELECT 
    a.id as agendamento_id,
    to_char(a.date, 'DD/MM/YYYY HH:MI') as data_formatada,
    a.status,
    c.name as cliente_nome
FROM new_appointment a, client_data c;
```

*Mapeamento de parâmetros no n8n:* 
`$1=$json.userId`, `$2=$json.clientName`, `$3=$json.clientPhone`, `$4=$json.scheduleId`, `$5=$json.serviceId`, `$6=$json.date`
