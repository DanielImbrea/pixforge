import { getContactRequestTypeLabel } from '@/lib/contact/request-type-labels';
import type { ContactFormInput } from '@/lib/validation/contact-schema';
import type { Locale } from '@/i18n';

function stripEnvQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, '').trim();
}

/** Resend requires `email@domain.com` or `Name <email@domain.com>`. */
function normalizeFromAddress(value: string): string {
  const trimmed = stripEnvQuotes(value);
  if (/<[^>\s]+@[^>\s]+>/.test(trimmed)) {
    return trimmed;
  }
  if (/^[^\s<>]+@[^\s<>]+$/.test(trimmed)) {
    return trimmed;
  }
  const nameAndEmail = trimmed.match(/^(.+?)\s+([^\s<>]+@[^\s<>]+)$/);
  if (nameAndEmail) {
    return `${nameAndEmail[1]} <${nameAndEmail[2]}>`;
  }
  return trimmed;
}

function getContactRecipient(): string {
  const raw = process.env.CONTACT_EMAIL_TO?.trim() || 'dani_imbrea@yahoo.com';
  return stripEnvQuotes(raw);
}

function getContactFromAddress(): string {
  const raw =
    process.env.CONTACT_FROM_EMAIL?.trim() || 'PixiqueAi Contact <onboarding@resend.dev>';
  return normalizeFromAddress(raw);
}

function formatResendError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string; name?: string };
    if (parsed.message) {
      return `Resend ${status}: ${parsed.message}`;
    }
  } catch {
    // Resend sometimes returns plain text.
  }
  return `Resend ${status}: ${body || 'Unknown error'}`;
}

function buildEmailBody(data: ContactFormInput, locale: Locale): string {
  const requestLabel = getContactRequestTypeLabel(data.requestType, locale);
  const phone = data.phone?.trim() || '—';
  const feedback = data.feedback?.trim() || '—';

  return [
    `Tip solicitare: ${requestLabel}`,
    '',
    `Nume: ${data.firstName} ${data.lastName}`,
    `Email: ${data.email}`,
    `Telefon: ${phone}`,
    '',
    'Mesaj:',
    data.message,
    '',
    'Feedback aplicație:',
    feedback,
    '',
    `— Trimis de pe pixiqueai.com (${locale})`,
  ].join('\n');
}

export async function sendContactEmail(data: ContactFormInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const locale = (data.locale ?? 'ro') as Locale;
  const subject = `[Contact] ${data.firstName} ${data.lastName}`;
  const text = buildEmailBody(data, locale);
  const from = getContactFromAddress();
  const to = getContactRecipient();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${formatResendError(res.status, body)} (from=${from}, to=${to})`);
  }
}
