
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Define and export constants first
export const locales = ['en', 'es'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}: {locale: string}) => {
  let effectiveLocale = locale;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    console.warn(`[next-intl - getRequestConfig] Received invalid locale "${locale}". Attempting to fall back to default locale "${defaultLocale}". This situation should ideally be caught by layout or middleware validation before this point.`);
    effectiveLocale = defaultLocale;
    // Do NOT call notFound() here. The primary responsibility for a 404 due to an invalid
    // URL locale segment lies with the consuming layout/page or middleware.
    // This function's role is to provide messages; if it can't for the requested locale,
    // it should attempt a graceful fallback or indicate failure clearly for message loading.
  }

  try {
    // Attempt to load messages for the effectiveLocale (either original valid locale or fallback defaultLocale)
    const messages = (await import(`./messages/${effectiveLocale}.json`)).default;
    return { messages };
  } catch (error) {
    console.error(`[next-intl - getRequestConfig] CRITICAL: Failed to load message file for locale "${effectiveLocale}" (original requested: "${locale}"). Path: ./messages/${effectiveLocale}.json. Error:`, error);
    // If message file for effectiveLocale (even if it's the default) cannot be loaded,
    // this indicates a more severe issue (e.g., missing message files).
    // Returning empty messages to prevent NextIntlClientProvider from crashing,
    // but the page will likely lack translations.
    // In a production scenario, you might want to throw a more specific error or
    // ensure default message files always exist.
    // For now, this prevents the "config file not found" if the issue was just message loading.
    // However, if the root cause is `next-intl` truly not finding `i18n.ts`, this won't help that specific error.
    return { messages: {} };
  }
});

