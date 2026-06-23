/**
 * Cloudflare Turnstile verification. If TURNSTILE_SECRET_KEY is not
 * configured, verification is skipped (returns true) so the app remains
 * fully functional in local development without requiring Cloudflare keys.
 * Configure the env var in production to enforce it for real.
 */
export async function verifyTurnstileToken(token: string | null, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.append('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();
    return Boolean(data.success);
  } catch {
    // Fail closed in production if Cloudflare is unreachable would block
    // legitimate users during an outage; fail open is the safer default
    // here since rate limiting and quota checks provide a second layer.
    return true;
  }
}
