/**
 * Triggers a browser file save dialog for a same-origin download URL.
 */
export async function triggerBrowserDownload(downloadUrl: string, fallbackFilename: string): Promise<void> {
  const res = await fetch(downloadUrl, { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error('Download failed.');
  }

  await saveResponseAsDownload(res, fallbackFilename);
}

/**
 * POST JSON body and save the response as a file download.
 */
export async function triggerBrowserDownloadPost(
  downloadUrl: string,
  body: unknown,
  fallbackFilename: string
): Promise<void> {
  const res = await fetch(downloadUrl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error('Download failed.');
  }

  await saveResponseAsDownload(res, fallbackFilename);
}

async function saveResponseAsDownload(res: Response, fallbackFilename: string): Promise<void> {
  const blob = await res.blob();
  const filename = parseContentDispositionFilename(res.headers.get('Content-Disposition')) ?? fallbackFilename;
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1];

  const plainMatch = header.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) return plainMatch[1].trim();

  return null;
}

export function buildDownloadFallbackFilename(mimeType: string, jobId: string): string {
  const extByMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  const ext = extByMime[mimeType] ?? mimeType.split('/')[1] ?? 'bin';
  return `pixiqueai-${jobId.slice(0, 8)}.${ext}`;
}
