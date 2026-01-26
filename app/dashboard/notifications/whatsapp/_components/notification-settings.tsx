'use client';

import { useState, useEffect } from 'react';
import { WhatsAppConfig } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { NotificationCard } from './notification-card';
import { Bell, CalendarCheck, CalendarX, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateWhatsAppSettingsAction } from '@/app/actions/whatsapp';

interface NotificationSettingsProps {
  config: WhatsAppConfig;
  disabled?: boolean;
}

export function NotificationSettings({ config, disabled = false }: NotificationSettingsProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Confirmation on creation
  const [notifyOnCreate, setNotifyOnCreate] = useState(config.notifyOnCreate);
  const [createDelayMinutes, setCreateDelayMinutes] = useState(config.createDelayMinutes);
  const [createMessage, setCreateMessage] = useState(config.createMessage || '');

  // Cancellation notification
  const [notifyOnCancel, setNotifyOnCancel] = useState(config.notifyOnCancel);
  const [cancelDelayMinutes, setCancelDelayMinutes] = useState(config.cancelDelayMinutes);
  const [cancelMessage, setCancelMessage] = useState(config.cancelMessage || '');

  // Confirmation (days before)
  const [notifyConfirmation, setNotifyConfirmation] = useState(config.notifyConfirmation);
  const [confirmationDays, setConfirmationDays] = useState(config.confirmationDays);
  const [confirmationMessage, setConfirmationMessage] = useState(config.confirmationMessage || '');

  // Reminder (hours before)
  const [notifyReminder, setNotifyReminder] = useState(config.notifyReminder);
  const [reminderHours, setReminderHours] = useState(config.reminderHours);
  const [reminderMessage, setReminderMessage] = useState(config.reminderMessage || '');

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed =
      notifyOnCreate !== config.notifyOnCreate ||
      createDelayMinutes !== config.createDelayMinutes ||
      createMessage !== (config.createMessage || '') ||
      notifyOnCancel !== config.notifyOnCancel ||
      cancelDelayMinutes !== config.cancelDelayMinutes ||
      cancelMessage !== (config.cancelMessage || '') ||
      notifyConfirmation !== config.notifyConfirmation ||
      confirmationDays !== config.confirmationDays ||
      confirmationMessage !== (config.confirmationMessage || '') ||
      notifyReminder !== config.notifyReminder ||
      reminderHours !== config.reminderHours ||
      reminderMessage !== (config.reminderMessage || '');

    setHasChanges(changed);
  }, [
    notifyOnCreate,
    createDelayMinutes,
    createMessage,
    notifyOnCancel,
    cancelDelayMinutes,
    cancelMessage,
    notifyConfirmation,
    confirmationDays,
    confirmationMessage,
    notifyReminder,
    reminderHours,
    reminderMessage,
    config,
  ]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateWhatsAppSettingsAction({
        enabled: config.enabled,
        notifyOnCreate,
        createDelayMinutes,
        createMessage,
        notifyOnCancel,
        cancelDelayMinutes,
        cancelMessage,
        notifyConfirmation,
        confirmationDays,
        confirmationMessage,
        notifyReminder,
        reminderHours,
        reminderMessage,
      });

      if (result.success) {
        toast({
          title: 'Configurações salvas',
          description: 'As configurações de notificações foram atualizadas',
        });
        setHasChanges(false);
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao salvar configurações',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Confirmation on Creation */}
      <NotificationCard
        title="Confirmação de Agendamento"
        description="Enviada logo após o cliente agendar"
        icon={<CalendarCheck className="h-5 w-5 text-primary" />}
        enabled={notifyOnCreate}
        onEnabledChange={setNotifyOnCreate}
        message={createMessage}
        onMessageChange={setCreateMessage}
        delayValue={createDelayMinutes}
        onDelayChange={setCreateDelayMinutes}
        delayLabel="Enviar após (em minutos)"
        delayUnit="minutos"
        testType="create"
        disabled={disabled}
      />

      {/* 2. Cancellation Notification */}
      <NotificationCard
        title="Notificação de Cancelamento"
        description="Enviada quando um agendamento é cancelado"
        icon={<CalendarX className="h-5 w-5 text-destructive" />}
        enabled={notifyOnCancel}
        onEnabledChange={setNotifyOnCancel}
        message={cancelMessage}
        onMessageChange={setCancelMessage}
        delayValue={cancelDelayMinutes}
        onDelayChange={setCancelDelayMinutes}
        delayLabel="Enviar após (em minutos)"
        delayUnit="minutos"
        testType="cancel"
        disabled={disabled}
      />

      {/* 3. Presence Confirmation (days before) */}
      <NotificationCard
        title="Confirmação de Presença"
        description="Enviada alguns dias antes do agendamento"
        icon={<Bell className="h-5 w-5 text-blue-600" />}
        enabled={notifyConfirmation}
        onEnabledChange={setNotifyConfirmation}
        message={confirmationMessage}
        onMessageChange={setConfirmationMessage}
        delayValue={confirmationDays}
        onDelayChange={setConfirmationDays}
        delayLabel="Enviar quantos dias antes"
        delayUnit="dias"
        testType="confirmation"
        disabled={disabled}
      />

      {/* 4. Reminder (hours before) */}
      <NotificationCard
        title="Lembrete"
        description="Enviada algumas horas antes do agendamento"
        icon={<Clock className="h-5 w-5 text-amber-600" />}
        enabled={notifyReminder}
        onEnabledChange={setNotifyReminder}
        message={reminderMessage}
        onMessageChange={setReminderMessage}
        delayValue={reminderHours}
        onDelayChange={setReminderHours}
        delayLabel="Enviar quantas horas antes"
        delayUnit="horas"
        testType="reminder"
        disabled={disabled}
      />

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-4 bg-background pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving || disabled}
            className="w-full"
            size="lg"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      )}
    </div>
  );
}
