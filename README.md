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

See `.env.example` for the full production checklist.

## License

Private — Daniel Imbrea
