# PixiqueAi

AI-powered image tools SaaS — upscale, background removal, resize, compress, and format conversion.

## Stack

- Next.js 15, TypeScript, Tailwind
- Supabase (auth, database, storage)
- Stripe (subscriptions)
- Sharp (resize, compress, convert, post-processing)
- Replicate (AI upscale & background removal in production)

## Local development

```bash
cp .env.example .env.local
# Fill in Supabase keys; keep AI_PROVIDER=mock for free local AI simulation
npm install
npm run dev
```

## Production — Replicate AI

Upscale and background removal use [Replicate](https://replicate.com) when `AI_PROVIDER=replicate`.

### 1. Replicate account

1. Create account at [replicate.com](https://replicate.com)
2. Add billing at [replicate.com/account/billing](https://replicate.com/account/billing) (pay-as-you-go)
3. Create API token at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)

### 2. Vercel environment variables (Production)

In **Vercel → Project → Settings → Environment Variables**, set for **Production**:

| Variable | Value |
|----------|--------|
| `APP_URL` | `https://www.pixiqueai.com` |
| `NEXT_PUBLIC_APP_URL` | `https://www.pixiqueai.com` |
| `AI_PROVIDER` | `replicate` |
| `REPLICATE_API_TOKEN` | your `r8_...` token |
| `ADMIN_EMAIL` | your login email (optional, for config check) |

Redeploy after saving (Deployments → … → Redeploy).

### 3. Verify

While logged in as `ADMIN_EMAIL`, open:

`https://www.pixiqueai.com/api/admin/ai-status`

Expected response:

```json
{
  "provider": "replicate",
  "appUrl": "https://www.pixiqueai.com",
  "webhookBaseUrl": "https://www.pixiqueai.com/api/webhooks/replicate",
  "replicateTokenConfigured": true,
  "ready": true,
  "issues": []
}
```

Then test **AI Upscaler** on site — processing should take ~10–30s (not instant like mock mode).

### Local development

Keep `AI_PROVIDER=mock` in `.env.local` to avoid Replicate charges while developing.

## License

Private — Daniel Imbrea
