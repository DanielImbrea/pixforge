export interface EmailProvider {
  name: string;
  url: string;
}

const PROVIDERS: Record<string, EmailProvider> = {
  'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  'ymail.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  'gmail.com': { name: 'Gmail', url: 'https://mail.google.com' },
  'googlemail.com': { name: 'Gmail', url: 'https://mail.google.com' },
  'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com' },
  'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com' },
  'live.com': { name: 'Outlook', url: 'https://outlook.live.com' },
  'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  'me.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  'proton.me': { name: 'Proton Mail', url: 'https://mail.proton.me' },
  'protonmail.com': { name: 'Proton Mail', url: 'https://mail.proton.me' },
};

export function getEmailProvider(email: string): EmailProvider | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  return PROVIDERS[domain] ?? null;
}
