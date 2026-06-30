import { supabaseAdmin } from '@/lib/supabase-admin';
import type { NotificationType, RecipientType } from '@/types/database';

interface CreateNotificationParams {
  recipientId: string;
  recipientType: RecipientType;
  clinicId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('notifications').insert({
      recipient_id: params.recipientId,
      recipient_type: params.recipientType,
      clinic_id: params.clinicId ?? null,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl ?? null,
      metadata: params.metadata ?? {},
    });

    if (error) {
      console.error('[notifications] Failed to create notification:', error.message);
    }
  } catch (err) {
    console.error('[notifications] Unexpected error creating notification:', err);
  }
}

export async function createNotifications(items: CreateNotificationParams[]): Promise<void> {
  if (items.length === 0) return;

  try {
    const rows = items.map((params) => ({
      recipient_id: params.recipientId,
      recipient_type: params.recipientType,
      clinic_id: params.clinicId ?? null,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl ?? null,
      metadata: params.metadata ?? {},
    }));

    const { error } = await supabaseAdmin.from('notifications').insert(rows);

    if (error) {
      console.error('[notifications] Failed to create batch notifications:', error.message);
    }
  } catch (err) {
    console.error('[notifications] Unexpected error creating batch notifications:', err);
  }
}
