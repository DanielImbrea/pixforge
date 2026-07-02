import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { resolveJobDownload } from '@/lib/tools/resolve-job-download';
import { exportAssetRequestSchema } from '@/lib/validation/export-schemas';
import {
  clampScaleMultiplierForPlan,
  getExportPlanEntitlements,
  isFormatAllowed,
} from '@/lib/tools/download-export/plan-entitlements';
import { computeExportDimensions, getExportSizeMode, buildExportFilename } from '@/lib/tools/download-export/settings';
import { processExportImage } from '@/lib/tools/download-export/process';
import type { UserRow, ImageJobRow } from '@/types';
import { getToolById } from '@/lib/tools/registry';

export const runtime = 'nodejs';

function contentDispositionAttachment(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;
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
    return NextResponse.json({ error: 'Invalid export request.' }, { status: 400 });
  }

  const parsed = exportAssetRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid export settings.' }, { status: 400 });
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
  if (!profile) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  const user = profile as UserRow;
  const entitlements = getExportPlanEntitlements(user.plan);

  if (!isFormatAllowed(user.plan, parsed.data.format)) {
    return NextResponse.json({ error: 'This format is not available on your plan.' }, { status: 403 });
  }

  const scaleMultiplier = clampScaleMultiplierForPlan(user.plan, parsed.data.scaleMultiplier);
  const compress = parsed.data.compress && entitlements.compressFile;
  const limitFileSize = parsed.data.limitFileSize && entitlements.limitFileSize;
  const transparentBackground =
    parsed.data.format !== 'jpeg' &&
    parsed.data.transparentBackground &&
    entitlements.transparentBackground;

  try {
    const resolved = await resolveJobDownload(jobId, authUser.id);
    if (!resolved) {
      return NextResponse.json({ error: 'Job is not ready for download.' }, { status: 404 });
    }

    const { data: job } = await supabase
      .from('image_jobs')
      .select('tool_id')
      .eq('id', jobId)
      .single();
    const jobRow = job as Pick<ImageJobRow, 'tool_id'> | null;
    const tool = jobRow ? getToolById(jobRow.tool_id) : null;
    const sizeMode = tool ? getExportSizeMode(tool.category) : 'scalable';

    const meta = await sharp(resolved.buffer).metadata();
    const processedWidth = meta.width ?? 1;
    const processedHeight = meta.height ?? 1;

    const { width: exportW, height: exportH } = computeExportDimensions(
      processedWidth,
      processedHeight,
      scaleMultiplier,
      sizeMode
    );

    const { buffer, mimeType } = await processExportImage(resolved.buffer, {
      format: parsed.data.format,
      width: exportW,
      height: exportH,
      transparentBackground,
      compress,
      compressLevel: parsed.data.compressLevel,
      limitFileSize,
      maxFileSizeKb: parsed.data.maxFileSizeKb,
      stripMetadata: parsed.data.stripMetadata,
    });

    const filename = buildExportFilename(parsed.data.fileName, parsed.data.format, exportW, exportH);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': contentDispositionAttachment(filename),
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Export failed.' }, { status: 502 });
  }
}
