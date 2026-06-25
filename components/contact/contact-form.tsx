'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { contactRequestTypes, type ContactRequestType } from '@/lib/validation/contact-schema';

const selectClassName =
  'h-10 w-full rounded-md border border-border-default bg-background-primary px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent';

interface ContactFormProps {
  locale: Locale;
}

export function ContactForm({ locale }: ContactFormProps) {
  const t = useTranslations('contact');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestType, setRequestType] = useState<ContactRequestType>('general');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorKey(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          requestType,
          message,
          feedback,
          consent,
          locale,
          website,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setErrorKey(data.error || 'sendFailed');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorKey('sendFailed');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 px-6 py-8 text-center">
        <p className="text-lg font-medium text-text-primary mb-2">{t('successTitle')}</p>
        <p className="text-sm text-text-secondary">{t('successDescription')}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6"
          onClick={() => {
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            setRequestType('general');
            setMessage('');
            setFeedback('');
            setConsent(false);
            setStatus('idle');
          }}
        >
          {t('sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-firstName" className="mb-1.5 block text-sm font-medium text-text-primary">
            {t('firstNameLabel')} <span className="text-danger">*</span>
          </label>
          <Input
            id="contact-firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="contact-lastName" className="mb-1.5 block text-sm font-medium text-text-primary">
            {t('lastNameLabel')} <span className="text-danger">*</span>
          </label>
          <Input
            id="contact-lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            autoComplete="family-name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t('emailAddressLabel')} <span className="text-danger">*</span>
        </label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t('phoneLabel')}
        </label>
        <Input
          id="contact-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder={t('phonePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="contact-requestType" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t('requestTypeLabel')} <span className="text-danger">*</span>
        </label>
        <select
          id="contact-requestType"
          className={selectClassName}
          value={requestType}
          onChange={(e) => setRequestType(e.target.value as ContactRequestType)}
          required
        >
          {contactRequestTypes.map((type) => (
            <option key={type} value={type}>
              {t(`requestType_${type}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t('messageLabel')} <span className="text-danger">*</span>
        </label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder={t('messagePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="contact-feedback" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t('feedbackLabel')}
        </label>
        <p className="mb-2 text-xs text-text-tertiary">{t('feedbackHint')}</p>
        <Textarea
          id="contact-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder={t('feedbackPlaceholder')}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border-default bg-background-secondary px-4 py-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border-default"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span className="text-sm text-text-secondary">{t('consentLabel')}</span>
      </label>

      {/* Honeypot — hidden from users */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden
      />

      {status === 'error' && errorKey && (
        <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {t(`error_${errorKey}` as 'error_sendFailed')}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            {t('sending')}
          </span>
        ) : (
          t('submitButton')
        )}
      </Button>
    </form>
  );
}
