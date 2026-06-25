import { createAdminClient } from '@/lib/supabase/admin';
import { getCreditsLimit, getCreditsUsed } from '@/lib/billing/entitlements';
import { getPeriodStartForPlan } from '@/lib/billing/plans';
import type { PlanTier, UserRow } from '@/types';

export interface AdminDashboardStats {
  totalUsers: number;
  totalGenerations: number;
  storageBytes: number;
  recentLogs: AdminAuditLogRow[];
}

export interface AdminAuditLogRow {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin_email?: string;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  plan: PlanTier;
  role: string;
  created_at: string;
  deleted_at: string | null;
  creditsUsed: number;
  creditsLimit: number;
}

export interface AdminImageListItem {
  storageFileId: string;
  assetId: string;
  assetType: string;
  userId: string;
  userEmail: string;
  bucket: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  previewUrl: string | null;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const admin = createAdminClient();

  const [{ count: totalUsers }, { count: totalGenerations }, { data: storageRows }, { data: logs }] =
    await Promise.all([
      admin.from('users').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      admin.from('image_jobs').select('*', { count: 'exact', head: true }).eq('status', 'done'),
      admin.from('storage_files').select('size_bytes'),
      admin.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

  const adminIds = [...new Set((logs ?? []).map((l) => l.admin_id).filter(Boolean))] as string[];
  const adminEmails = new Map<string, string>();
  if (adminIds.length > 0) {
    const { data: admins } = await admin.from('users').select('id, email').in('id', adminIds);
    for (const a of admins ?? []) {
      adminEmails.set(a.id, a.email);
    }
  }

  const storageBytes = (storageRows ?? []).reduce((sum, row) => sum + (row.size_bytes ?? 0), 0);

  const recentLogs: AdminAuditLogRow[] = (logs ?? []).map((row) => ({
    id: row.id,
    admin_id: row.admin_id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at,
    admin_email: row.admin_id ? adminEmails.get(row.admin_id) : undefined,
  }));

  return {
    totalUsers: totalUsers ?? 0,
    totalGenerations: totalGenerations ?? 0,
    storageBytes,
    recentLogs,
  };
}

export async function listAdminUsers(search?: string): Promise<AdminUserListItem[]> {
  const admin = createAdminClient();
  let query = admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (search?.trim()) {
    query = query.ilike('email', `%${search.trim()}%`);
  }

  const { data: users } = await query;
  if (!users?.length) return [];

  const { data: usageRows } = await admin
    .from('tool_usage')
    .select('*')
    .in(
      'user_id',
      users.map((u) => u.id)
    );

  return users.map((user) => {
    const periodStart = getPeriodStartForPlan(user.plan as PlanTier);
    const usage = usageRows?.find((u) => u.user_id === user.id && u.period_start === periodStart) ?? null;
    return {
      id: user.id,
      email: user.email,
      plan: user.plan as PlanTier,
      role: user.role ?? 'user',
      created_at: user.created_at,
      deleted_at: user.deleted_at ?? null,
      creditsUsed: getCreditsUsed(usage),
      creditsLimit: getCreditsLimit(user.plan as PlanTier),
    };
  });
}

export async function getAdminUserDetail(userId: string) {
  const admin = createAdminClient();
  const { data: user } = await admin.from('users').select('*').eq('id', userId).maybeSingle();
  if (!user) return null;

  const periodStart = getPeriodStartForPlan(user.plan as PlanTier);
  const [{ data: usage }, { data: jobs }, { data: assets }] = await Promise.all([
    admin.from('tool_usage').select('*').eq('user_id', userId).eq('period_start', periodStart).maybeSingle(),
    admin
      .from('image_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('image_assets')
      .select('*, storage_files(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(48),
  ]);

  return {
    user: user as UserRow & { role: string; deleted_at: string | null },
    creditsUsed: getCreditsUsed(usage),
    creditsLimit: getCreditsLimit(user.plan as PlanTier),
    jobs: jobs ?? [],
    assets: assets ?? [],
  };
}

export async function listAdminImages(options: { userEmail?: string; limit?: number }): Promise<AdminImageListItem[]> {
  const admin = createAdminClient();
  const limit = options.limit ?? 48;

  let userIds: string[] | null = null;
  if (options.userEmail?.trim()) {
    const { data: matchedUsers } = await admin
      .from('users')
      .select('id')
      .ilike('email', `%${options.userEmail.trim()}%`)
      .limit(20);
    userIds = matchedUsers?.map((u) => u.id) ?? [];
    if (userIds.length === 0) return [];
  }

  let assetsQuery = admin
    .from('image_assets')
    .select('*, storage_files(*)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userIds) {
    assetsQuery = assetsQuery.in('user_id', userIds);
  }

  const { data: assets } = await assetsQuery;
  if (!assets?.length) return [];

  const userEmailMap = new Map<string, string>();
  const uniqueUserIds = [...new Set(assets.map((a) => a.user_id))];
  const { data: userRows } = await admin.from('users').select('id, email').in('id', uniqueUserIds);
  for (const u of userRows ?? []) {
    userEmailMap.set(u.id, u.email);
  }

  const { createSignedUrl } = await import('@/lib/supabase/storage');

  const items: AdminImageListItem[] = [];
  for (const asset of assets) {
    const sf = asset.storage_files as
      | { id: string; bucket: string; storage_path: string; mime_type: string; size_bytes: number }
      | { id: string; bucket: string; storage_path: string; mime_type: string; size_bytes: number }[]
      | null;
    const storageFile = Array.isArray(sf) ? sf[0] : sf;
    if (!storageFile) continue;

    const userEmail = userEmailMap.get(asset.user_id) ?? '—';

    let previewUrl: string | null = null;
    try {
      previewUrl = await createSignedUrl(storageFile.bucket as 'uploads' | 'outputs' | 'previews', storageFile.storage_path, 300);
    } catch {
      previewUrl = null;
    }

    items.push({
      storageFileId: storageFile.id,
      assetId: asset.id,
      assetType: asset.asset_type,
      userId: asset.user_id,
      userEmail: userEmail ?? '—',
      bucket: storageFile.bucket,
      storagePath: storageFile.storage_path,
      mimeType: storageFile.mime_type,
      sizeBytes: storageFile.size_bytes,
      createdAt: asset.created_at,
      previewUrl,
    });
  }

  return items;
}

export async function listAdminAuditLogs(limit = 100): Promise<AdminAuditLogRow[]> {
  const admin = createAdminClient();
  const { data: logs } = await admin
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  const adminIds = [...new Set((logs ?? []).map((l) => l.admin_id).filter(Boolean))] as string[];
  const adminEmails = new Map<string, string>();
  if (adminIds.length > 0) {
    const { data: admins } = await admin.from('users').select('id, email').in('id', adminIds);
    for (const a of admins ?? []) {
      adminEmails.set(a.id, a.email);
    }
  }

  return (logs ?? []).map((row) => ({
    id: row.id,
    admin_id: row.admin_id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at,
    admin_email: row.admin_id ? adminEmails.get(row.admin_id) : undefined,
  }));
}
