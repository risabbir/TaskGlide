// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import { locales, defaultLocale } from './i18n-config'; // Import from new file

console.log('[i18n.ts] Module loading...');

export default getRequestConfig(async ({locale}: {locale: string}) => {
  console.log(`[i18n.ts] getRequestConfig called with locale: ${locale}`);

  // Determine the effective locale to use for loading messages.
  // The primary validation of `params.locale` from the URL happens in `src/app/[locale]/layout.tsx`.
  // This check here is a safeguard for how `getRequestConfig` itself might be called by next-intl internals
  // or if the locale from context is unexpectedly different.
  const effectiveLocale = locales.includes(locale) ? locale : defaultLocale;
  if (!locales.includes(locale)) {
    console.warn(`[i18n.ts] Invalid locale "${locale}" received by getRequestConfig. Using default: "${defaultLocale}" for message loading.`);
  }

  let messages;
  try {
    console.log(`[i18n.ts] Attempting to import messages for effectiveLocale: ${effectiveLocale}`);
    messages = (await import(`./messages/${effectiveLocale}.json`)).default;
    console.log(`[i18n.ts] Successfully imported messages for effectiveLocale: ${effectiveLocale}`);
  } catch (error) {
    console.error(`[i18n.ts] FAILED to load messages for effectiveLocale "${effectiveLocale}". Error:`, error);
    // Fallback to default locale messages if the effectiveLocale (which might already be defaultLocale) fails
    if (effectiveLocale !== defaultLocale) {
      console.warn(`[i18n.ts] Attempting to import messages for FALLBACK default locale: ${defaultLocale}`);
      try {
        messages = (await import(`./messages/${defaultLocale}.json`)).default;
        console.log(`[i18n.ts] Successfully imported messages for FALLBACK default locale: ${defaultLocale}`);
      } catch (fallbackError) {
        console.error(`[i18n.ts] FAILED to load messages for FALLBACK default locale "${defaultLocale}". Error:`, fallbackError);
        messages = {}; // Ultimate fallback: empty messages
      }
    } else {
      messages = {}; // If loading default locale itself failed
    }
  }

  if (Object.keys(messages).length === 0) {
    console.warn(`[i18n.ts] Returning EMPTY messages for locale: ${locale} (effective: ${effectiveLocale})`);
  } else {
    // console.log(`[i18n.ts] Returning messages for locale: ${locale} (effective: ${effectiveLocale}) with keys:`, Object.keys(messages));
  }

  return {
    messages
  };
});

console.log('[i18n.ts] Module successfully loaded and getRequestConfig exported.');
