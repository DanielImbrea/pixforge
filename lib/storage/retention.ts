/** All storage buckets use the same retention window. */
export const FILE_RETENTION_HOURS = 4;

export const FILE_RETENTION_MS = FILE_RETENTION_HOURS * 60 * 60 * 1000;

export function getFileExpiresAt(from = Date.now()): string {
  return new Date(from + FILE_RETENTION_MS).toISOString();
}
