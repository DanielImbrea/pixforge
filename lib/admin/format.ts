export function formatAdminBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatAdminDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === 'ro' ? 'ro-RO' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
