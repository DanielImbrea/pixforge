import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveJobDownload } from '@/lib/tools/resolve-job-download';

export const runtime = 'nodejs';

function contentDispositionAttachment(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const resolved = await resolveJobDownload(id, authUser.id);
    if (!resolved) {
      return NextResponse.json({ error: 'Job is not ready for download.' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(resolved.buffer), {
      headers: {
        'Content-Type': resolved.mimeType,
        'Content-Disposition': contentDispositionAttachment(resolved.filename),
        'Content-Length': String(resolved.buffer.length),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to download file.' }, { status: 502 });
  }
}
