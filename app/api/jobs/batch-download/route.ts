import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { resolveJobDownload, uniqueZipEntryName } from '@/lib/tools/resolve-job-download';
import { BATCH_MAX_FILES } from '@/lib/billing/plan-features';

export const runtime = 'nodejs';

const batchDownloadSchema = z.object({
  items: z
    .array(
      z.object({
        jobId: z.string().uuid(),
        fileName: z.string().min(1).max(255),
      })
    )
    .min(1)
    .max(BATCH_MAX_FILES),
});

function contentDispositionAttachment(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = batchDownloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid batch download request.' }, { status: 400 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();
  let addedFiles = 0;

  for (const item of parsed.data.items) {
    try {
      const resolved = await resolveJobDownload(item.jobId, authUser.id);
      if (!resolved) continue;

      const entryName = uniqueZipEntryName(item.fileName, usedNames);
      zip.file(entryName, resolved.buffer);
      addedFiles += 1;
    } catch {
      // Skip files that fail to load.
    }
  }

  if (addedFiles === 0) {
    return NextResponse.json({ error: 'No files available for download.' }, { status: 404 });
  }

  try {
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const archiveName = `pixiqueai-batch-${new Date().toISOString().slice(0, 10)}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': contentDispositionAttachment(archiveName),
        'Content-Length': String(zipBuffer.length),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create archive.' }, { status: 500 });
  }
}
