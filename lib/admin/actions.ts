import { createAdminClient } from '@/lib/supabase/admin';
import { deleteFromStorage, type Bucket } from '@/lib/supabase/storage';
import { logAdminAction } from '@/lib/admin/audit-log';

export async function softDeleteUser(adminId: string, userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: target } = await admin.from('users').select('email, deleted_at').eq('id', userId).maybeSingle();
  if (!target) {
    throw new Error('User not found.');
  }
  if (target.deleted_at) {
    throw new Error('User already deleted.');
  }

  const { error } = await admin
    .from('users')
    .update({ deleted_at: new Date().toISOString(), role: 'user' })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAction(adminId, 'delete_user', {
    targetType: 'user',
    targetId: userId,
    metadata: { email: target.email },
  });
}

export async function deleteStorageFile(adminId: string, storageFileId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: file } = await admin.from('storage_files').select('*').eq('id', storageFileId).maybeSingle();
  if (!file) {
    throw new Error('Storage file not found.');
  }

  try {
    await deleteFromStorage(file.bucket as Bucket, file.storage_path);
  } catch (err) {
    console.warn('[admin] storage delete failed', err);
  }

  await admin.from('storage_files').delete().eq('id', storageFileId);

  await logAdminAction(adminId, 'delete_image', {
    targetType: 'storage_file',
    targetId: storageFileId,
    metadata: { bucket: file.bucket, path: file.storage_path, user_id: file.user_id },
  });
}
