import { getContactRequestTypeLabel } from '@/lib/contact/request-type-labels';
import type { ContactFormInput } from '@/lib/validation/contact-schema';
import type { Locale } from '@/i18n';

function getContactRecipient(): string {
  return process.env.CONTACT_EMAIL_TO?.trim() || 'dani_imbrea@yahoo.com';
}

function getContactFromAddress(): string {
  return process.env.CONTACT_FROM_EMAIL?.trim() || 'PixiqueAi Contact <onboarding@resend.dev>';
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

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getContactFromAddress(),
      to: [getContactRecipient()],
      reply_to: data.email,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend error (${res.status}): ${body || res.statusText}`);
  }
}
