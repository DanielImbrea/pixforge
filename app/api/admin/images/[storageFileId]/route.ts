import { NextRequest, NextResponse } from 'next/server';
import { deleteStorageFile } from '@/lib/admin/actions';
import { requireAdminApi } from '@/lib/admin/require-admin-api';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storageFileId: string }> }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { storageFileId } = await params;

  try {
    await deleteStorageFile(auth.user.id, storageFileId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
