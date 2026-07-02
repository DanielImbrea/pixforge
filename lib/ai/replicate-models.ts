/** Known bad slugs → correct Replicate model (e.g. old env typos). */
const MODEL_SLUG_ALIASES: Record<string, string> = {
  '851-labs/background-removal': '851-labs/background-remover',
};

/**
 * Pinned version hashes for community models.
 * Community models must use POST /v1/predictions with a version id — not the official-model endpoint.
 */
export const PINNED_REPLICATE_VERSIONS: Record<string, string> = {
  '851-labs/background-remover':
    'a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc',
  'nightmareai/real-esrgan':
    'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
  'cjwbw/rembg': 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
  'kharioki/blur-faces': 'bdcc18be6a02a8f2efce1a3f7489f74a1d6729caea9b53061358fe75c93799d2',
  'sczhou/codeformer':
    'cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2',
};

export interface ParsedModelSlug {
  owner: string;
  name: string;
  /** Full version hash when slug includes `:version` */
  version?: string;
  /** Normalized `owner/name` without version */
  slug: string;
}

export interface BgRemovalEnvConfig {
  models: Record<string, string>;
  versionOverride?: string;
  envSources: Record<string, string | undefined>;
}

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

/** Primary bg model slug — supports legacy REPLICATE_BG_MODEL alias. */
export function getBgRemovalModelFromEnv(): string {
  const raw =
    readEnv('REPLICATE_BG_REMOVAL_MODEL') ??
    readEnv('REPLICATE_BG_MODEL') ??
    '851-labs/background-remover';
  return normalizeReplicateModelSlug(raw);
}

/** Optional pinned version hash for bg removal (REPLICATE_BG_VERSION). */
export function getBgRemovalVersionFromEnv(): string | undefined {
  return readEnv('REPLICATE_BG_VERSION') ?? readEnv('REPLICATE_BG_REMOVAL_VERSION');
}

export function getBgRemovalEnvConfig(): BgRemovalEnvConfig {
  const fallback = getBgRemovalModelFromEnv();

  return {
    models: getResolvedBgRemovalModels(),
    versionOverride: getBgRemovalVersionFromEnv(),
    envSources: {
      REPLICATE_BG_REMOVAL_MODEL: readEnv('REPLICATE_BG_REMOVAL_MODEL'),
      REPLICATE_BG_MODEL: readEnv('REPLICATE_BG_MODEL'),
      REPLICATE_BG_PRODUCT_MODEL: readEnv('REPLICATE_BG_PRODUCT_MODEL'),
      REPLICATE_BG_PORTRAIT_MODEL: readEnv('REPLICATE_BG_PORTRAIT_MODEL'),
      REPLICATE_BG_OBJECT_MODEL: readEnv('REPLICATE_BG_OBJECT_MODEL'),
      REPLICATE_BG_STUDIO_MODEL: readEnv('REPLICATE_BG_STUDIO_MODEL'),
      REPLICATE_BG_VERSION: readEnv('REPLICATE_BG_VERSION'),
      REPLICATE_BG_REMOVAL_VERSION: readEnv('REPLICATE_BG_REMOVAL_VERSION'),
    },
  };
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

export function formatReplicateVersion(slug: string, versionId: string): string {
  return `${slug}:${versionId}`;
}

export function getPinnedReplicateVersion(slug: string): string | undefined {
  return PINNED_REPLICATE_VERSIONS[slug];
}

export function getResolvedBgRemovalModels(): Record<string, string> {
  const fallback = getBgRemovalModelFromEnv();

  return {
    default: fallback,
    product: normalizeReplicateModelSlug(
      readEnv('REPLICATE_BG_PRODUCT_MODEL') ?? fallback
    ),
    portrait: normalizeReplicateModelSlug(
      readEnv('REPLICATE_BG_PORTRAIT_MODEL') ?? fallback
    ),
    object: normalizeReplicateModelSlug(
      readEnv('REPLICATE_BG_OBJECT_MODEL') ?? fallback
    ),
    studio: normalizeReplicateModelSlug(
      readEnv('REPLICATE_BG_STUDIO_MODEL') ?? fallback
    ),
  };
}

export function getResolvedUpscaleModels(): Record<string, string> {
  const fallback =
    readEnv('REPLICATE_UPSCALE_MODEL') ?? 'nightmareai/real-esrgan';

  return {
    default: fallback,
    photo: readEnv('REPLICATE_UPSCALE_PHOTO_MODEL') ?? fallback,
    ui: readEnv('REPLICATE_UPSCALE_UI_MODEL') ?? fallback,
    art: readEnv('REPLICATE_UPSCALE_ART_MODEL') ?? fallback,
  };
}

export function getResolvedBlurFacesModels(): Record<string, string> {
  const automatic =
    readEnv('REPLICATE_BLUR_FACES_MODEL') ??
    readEnv('REPLICATE_BLUR_FACES_MODEL_SLUG') ??
    'mock-blur-faces';

  return {
    automatic: normalizeReplicateModelSlug(automatic),
  };
}
