import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { locales, defaultLocale, type Locale } from './i18n';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import type { SupabaseCookiesToSet } from '@/lib/supabase/cookie-types';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const PROTECTED_PREFIXES = ['/dashboard', '/images', '/history', '/billing', '/settings', '/admin'];

function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split('/')[1];
  return locales.includes(segment as Locale) ? (segment as Locale) : defaultLocale;
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) =>
    locales.some((locale) => pathname === `/${locale}${prefix}` || pathname.startsWith(`/${locale}${prefix}/`))
  );
}

function isHomePath(pathname: string): boolean {
  return locales.some((locale) => pathname === `/${locale}`);
}

function isGuestOnlyPath(pathname: string): boolean {
  return locales.some(
    (locale) =>
      pathname === `/${locale}/auth/login` ||
      pathname === `/${locale}/auth/signup` ||
      pathname === `/${locale}/auth/forgot-password`
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

function isRedirectResponse(response: NextResponse): boolean {
  return response.status >= 300 && response.status < 400;
}

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  if (intlResponse && isRedirectResponse(intlResponse)) {
    return intlResponse;
  }

  let response = intlResponse ?? NextResponse.next();
  const supabaseEnv = getSupabasePublicEnv();

  if (!supabaseEnv) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: SupabaseCookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    if (!user && isProtectedPath(pathname)) {
      const locale = getLocaleFromPath(pathname);
      const redirectUrl = new URL(`/${locale}/auth/login`, request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      const redirect = NextResponse.redirect(redirectUrl);
      copyCookies(response, redirect);
      return redirect;
    }

    if (user && (isHomePath(pathname) || isGuestOnlyPath(pathname))) {
      const locale = getLocaleFromPath(pathname);
      const redirect = NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
      copyCookies(response, redirect);
      return redirect;
    }
  } catch (error) {
    console.error('[middleware] Supabase auth check failed:', error);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
