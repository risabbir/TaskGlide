
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'es'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid.
  // This check is crucial. If `locale` is undefined or invalid (e.g. due to URL manipulation),
  // `notFound()` will be called.
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    // Using path alias for potentially more stable resolution.
    messages: (await import(`@/messages/${locale}.json`)).default
  };
});
