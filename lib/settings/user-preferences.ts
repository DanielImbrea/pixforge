export type DownloadFormatPreference = 'auto' | 'webp' | 'jpeg' | 'png';
export type ImageQualityPreference = 'balanced' | 'max' | 'fast';

export interface UserPreferences {
  downloadFormat: DownloadFormatPreference;
  language: 'en' | 'ro';
  imageQuality: ImageQualityPreference;
  productUpdates: boolean;
  securityEmails: boolean;
  marketingEmails: boolean;
}

export const PREFERENCES_STORAGE_KEY = 'pixique-user-preferences';

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  downloadFormat: 'auto',
  language: 'ro',
  imageQuality: 'balanced',
  productUpdates: true,
  securityEmails: true,
  marketingEmails: false,
};

export function readUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_USER_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    const { theme: _theme, ...rest } = parsed as Partial<UserPreferences> & { theme?: unknown };
    return { ...DEFAULT_USER_PREFERENCES, ...rest };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function writeUserPreferences(preferences: UserPreferences): void {
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
