/** Known bad slugs → correct Replicate model (e.g. old env typos). */
const MODEL_SLUG_ALIASES: Record<string, string> = {
  '851-labs/background-removal': '851-labs/background-remover',
};

export interface ParsedModelSlug {
  owner: string;
  name: string;
  /** Full version hash when slug includes `:version` */
  version?: string;
  /** Normalized `owner/name` without version */
  slug: string;
}

export function normalizeReplicateModelSlug(raw: string): string {
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  const withoutVersion = trimmed.split(':')[0];
  return MODEL_SLUG_ALIASES[withoutVersion] ?? withoutVersion;
}

export function parseModelSlug(raw: string): ParsedModelSlug {
  const normalized = normalizeReplicateModelSlug(raw);
  const versionSep = normalized.indexOf(':');
  const base = versionSep >= 0 ? normalized.slice(0, versionSep) : normalized;
  const version = versionSep >= 0 ? normalized.slice(versionSep + 1) : undefined;
  const [owner, name] = base.split('/');
  if (!owner || !name) {
    throw new Error(
      `Invalid Replicate model slug "${raw}". Expected owner/name (e.g. 851-labs/background-remover).`
    );
  }
  return { owner, name, version, slug: `${owner}/${name}` };
}

export function getResolvedBgRemovalModels(): Record<string, string> {
  const fallback =
    normalizeReplicateModelSlug(
      process.env.REPLICATE_BG_REMOVAL_MODEL?.trim() || '851-labs/background-remover'
    );

  return {
    default: fallback,
    product: normalizeReplicateModelSlug(
      process.env.REPLICATE_BG_PRODUCT_MODEL?.trim() || fallback
    ),
    portrait: normalizeReplicateModelSlug(
      process.env.REPLICATE_BG_PORTRAIT_MODEL?.trim() || fallback
    ),
    object: normalizeReplicateModelSlug(
      process.env.REPLICATE_BG_OBJECT_MODEL?.trim() || fallback
    ),
    studio: normalizeReplicateModelSlug(
      process.env.REPLICATE_BG_STUDIO_MODEL?.trim() || fallback
    ),
  };
}

export function getResolvedUpscaleModels(): Record<string, string> {
  const fallback =
    process.env.REPLICATE_UPSCALE_MODEL?.trim() || 'nightmareai/real-esrgan';

  return {
    default: fallback,
    photo: process.env.REPLICATE_UPSCALE_PHOTO_MODEL?.trim() || fallback,
    ui: process.env.REPLICATE_UPSCALE_UI_MODEL?.trim() || fallback,
    art: process.env.REPLICATE_UPSCALE_ART_MODEL?.trim() || fallback,
  };
}
