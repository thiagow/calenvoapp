# n8n Workflows e Integrações

Este diretório contém os fluxos do n8n (workflows) e as consultas SQL utilizadas na integração do Calenvo App com o WhatsApp (via Evolution API).

## Estrutura de Pastas

- `/workflows`: Contém os arquivos JSON exportados do n8n.
- `/sql`: Contém as consultas SQL complexas utilizadas nos nós "Execute a SQL Query".

## Workflows Principais

| Workflow | Descrição | Gatilho |
|---|---|---|
| `whatsapp-reminder.json` | Lembretes de agendamentos (horas antes) | Cron (Agendamento) |
| `whatsapp-confirmation.json` | Confirmação de presença (dias antes) | Cron (Agendamento) |
| `whatsapp-send-message.json` | Envio de mensagens em tempo real (Criar/Cancelar) | Webhook HTTP |
| `whatsapp-instance-manager.json` | Gestão de instâncias (Criar/Excluir/Status) | Webhook HTTP |

## Como Atualizar

1. Faça as alterações no painel do n8n.
2. Exporte o workflow como JSON.
3. Substitua o arquivo correspondente na pasta `/workflows`.
4. Faça o commit das alterações no Git.
