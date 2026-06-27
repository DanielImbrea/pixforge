import { getPinnedReplicateVersion, normalizeReplicateModelSlug } from '@/lib/ai/replicate-models';

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export function getBlurFacesModelFromEnv(): string {
  const raw = readEnv('REPLICATE_BLUR_FACES_MODEL') ?? readEnv('REPLICATE_BLUR_FACES_MODEL_SLUG');
  if (!raw) {
    if (process.env.AI_PROVIDER !== 'replicate') {
      return 'mock-blur-faces';
    }
    throw new Error(
      'REPLICATE_BLUR_FACES_MODEL is required when AI_PROVIDER=replicate. Set it in environment variables.'
    );
  }
  return normalizeReplicateModelSlug(raw);
}

export function getBlurFacesCustomModelFromEnv(): string | undefined {
  const raw =
    readEnv('REPLICATE_BLUR_FACES_CUSTOM_MODEL') ??
    readEnv('REPLICATE_BLUR_FACES_CUSTOM_MODEL_SLUG');
  return raw ? normalizeReplicateModelSlug(raw) : undefined;
}

export function getBlurFacesVersionFromEnv(): string | undefined {
  return readEnv('REPLICATE_BLUR_FACES_VERSION') ?? readEnv('REPLICATE_BLUR_FACES_MODEL_VERSION');
}

export function getBlurFacesCustomVersionFromEnv(): string | undefined {
  return readEnv('REPLICATE_BLUR_FACES_CUSTOM_VERSION');
}

export function getBlurFacesEnvConfig(): Record<string, string | undefined> {
  return {
    REPLICATE_BLUR_FACES_MODEL: readEnv('REPLICATE_BLUR_FACES_MODEL'),
    REPLICATE_BLUR_FACES_CUSTOM_MODEL: readEnv('REPLICATE_BLUR_FACES_CUSTOM_MODEL'),
    REPLICATE_BLUR_FACES_VERSION: readEnv('REPLICATE_BLUR_FACES_VERSION'),
    REPLICATE_BLUR_FACES_CUSTOM_VERSION: readEnv('REPLICATE_BLUR_FACES_CUSTOM_VERSION'),
  };
}

export function resolveBlurFacesPinnedVersion(slug: string, custom = false): string | undefined {
  const envVersion = custom ? getBlurFacesCustomVersionFromEnv() : getBlurFacesVersionFromEnv();
  if (envVersion) return envVersion;
  return getPinnedReplicateVersion(slug);
}
