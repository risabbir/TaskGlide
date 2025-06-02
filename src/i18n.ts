
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define and export constants first
export const locales = ['en', 'es'];
export const defaultLocale = 'en';

// getRequestConfig can now directly access the `locales` constant defined above.
export default getRequestConfig(async ({locale}: {locale: string}) => {
  // Validate that the incoming `locale` parameter is valid
  // using the `locales` array defined in this file's scope.
  // This check is crucial for next-intl's core functionality.
  if (typeof locale !== 'string' || !locales.includes(locale)) {
    notFound();
  }

  return {
    // Using a direct relative path from src/i18n.ts to src/messages/
    messages: (await import(`./messages/${locale}.json`)).default
  };
});

