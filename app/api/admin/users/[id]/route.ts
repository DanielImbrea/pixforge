import { NextRequest, NextResponse } from 'next/server';
import { softDeleteUser } from '@/lib/admin/actions';
import { requireAdminApi } from '@/lib/admin/require-admin-api';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (id === auth.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 });
  }

  try {
    await softDeleteUser(auth.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
