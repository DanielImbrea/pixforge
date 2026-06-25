import { createAdminClient } from '@/lib/supabase/admin';

export type AdminAuditAction =
  | 'view_dashboard'
  | 'view_users'
  | 'view_user'
  | 'view_images'
  | 'view_logs'
  | 'delete_user'
  | 'delete_image';

export async function logAdminAction(
  adminId: string,
  action: AdminAuditAction,
  options?: {
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const admin = createAdminClient();
  await admin.from('admin_audit_logs').insert({
    admin_id: adminId,
    action,
    target_type: options?.targetType ?? null,
    target_id: options?.targetId ?? null,
    metadata: options?.metadata ?? {},
  });
}
