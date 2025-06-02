// src/app/page.tsx
// This page component renders the content for the site's root path (e.g., '/').
// With `localePrefix: 'as-needed'` in the middleware, navigating to '/'
// will use the default locale (e.g., 'en'). The actual internationalization context,
// including messages and the NextIntlClientProvider, is handled by
// src/app/[locale]/layout.tsx, which will be invoked with the default locale.
// This page component simply needs to render the main page content.

import HomePage from './[locale]/page';

export default function RootPage() {
  return <HomePage />;
}
