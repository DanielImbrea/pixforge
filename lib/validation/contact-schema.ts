import { z } from 'zod';

export const contactRequestTypes = [
  'general',
  'bug',
  'feature',
  'collaboration',
  'other',
] as const;

export type ContactRequestType = (typeof contactRequestTypes)[number];

export const contactFormSchema = z.object({
  firstName: z.string().trim().min(1, 'required').max(80),
  lastName: z.string().trim().min(1, 'required').max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  requestType: z.enum(contactRequestTypes),
  message: z.string().trim().min(10, 'messageTooShort').max(5000),
  feedback: z.string().trim().max(5000).optional().or(z.literal('')),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'consentRequired' }),
  }),
  locale: z.enum(['en', 'ro']).optional().default('ro'),
  /** Honeypot — must stay empty */
  website: z.string().optional().default(''),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
