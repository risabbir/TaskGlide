
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define and export constants first
export const locales = ['en', 'es'];
export const defaultLocale = 'en';

// getRequestConfig can now directly access the `locales` constant defined above.
export default getRequestConfig(async (configParams: {locale: string}) => {
  const locale = configParams.locale; // Use the locale passed by next-intl

  // Validate that the incoming `locale` parameter is valid
  // using the `locales` array defined in this file's scope.
  // This check is crucial for next-intl's core functionality.
  if (!locales.includes(locale)) {
    notFound();
  }

  return {
    // Using path alias for potentially more stable resolution.
    messages: (await import(`@/messages/${locale}.json`)).default
  };
});
