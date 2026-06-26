import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const locale = request.nextUrl.pathname.split('/')[1] || 'en';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (next === 'reset-password') {
    return NextResponse.redirect(`${origin}/${locale}/auth/reset-password`);
  }

  return NextResponse.redirect(`${origin}/${locale}/tools`);
}
