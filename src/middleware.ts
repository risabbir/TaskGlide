
import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // 'as-needed' will not add prefix for defaultLocale
});

export const config = {
  // Match only internationalized pathnames
  // Skip middleware for api, _next, static files, and files with extensions (e.g. favicon.ico)
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Match all root pathnames (e.g. `/`, `/en`, `/es`)
    '/',
  ]
};
