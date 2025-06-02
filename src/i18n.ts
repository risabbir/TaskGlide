
// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';

// These constants are used by middleware.ts and [locale]/layout.tsx for validation.
export const locales = ['en', 'es'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  // This function is called by next-intl with the locale detected
  // from the request (via middleware). We assume it's one of the `locales`
  // because the middleware should handle redirection for unsupported locales,
  // and the layout.tsx validates params.locale from the URL.
  // If next-intl internally passes a locale for which a message file doesn't exist,
  // the import() will fail, leading to a different error (module not found for that specific json).
  // The current error "Couldn't find next-intl config file" is more fundamental.
  try {
    return {
      messages: (await import(`./messages/${locale}.json`)).default
    };
  } catch (error) {
    console.error(`[i18n.ts] Failed to load messages for locale "${locale}". Falling back to empty messages. Error:`, error);
    // Fallback to empty messages to prevent a complete crash if a specific message file is missing,
    // though the primary error "config file not found" suggests a deeper issue.
    return {
      messages: {}
    };
  }
});
