
import type {Metadata, Viewport} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { KanbanProvider } from '@/lib/store';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import { locales, defaultLocale } from '@/i18n-config'; // Import from new config file
import { notFound } from 'next/navigation'; // Ensure this is from next/navigation

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: {params: {locale: string}}): Promise<Metadata> {
  const { locale: localeFromParams } = params; // Destructure locale immediately

  if (typeof localeFromParams !== 'string' || !locales.includes(localeFromParams)) {
    console.error(`[generateMetadata] Invalid or missing locale in params: "${localeFromParams}". Triggering notFound for metadata.`);
    notFound();
  }

  // At this point, localeFromParams is a string and a valid locale.
  const t = await getTranslations({locale: localeFromParams, namespace: 'App'});
  return {
    title: t('name'),
    description: t('description'),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string}; // Type from Next.js
}>) {
  const { locale: localeFromParams } = params; // Destructure locale immediately

  // Stricter validation
  if (typeof localeFromParams !== 'string' || !locales.includes(localeFromParams)) {
    console.error(`[RootLayout] Invalid or missing locale in params: "${localeFromParams}". Triggering notFound.`);
    notFound();
  }

  // At this point, localeFromParams is a string and a valid locale.
  const messages = await getMessages({locale: localeFromParams});

  return (
    <html lang={localeFromParams} suppressHydrationWarning={true}>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning={true}>
        <NextIntlClientProvider locale={localeFromParams} messages={messages}>
          <AuthProvider>
            <KanbanProvider>
              <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow pb-16 md:pb-0">
                {children}
              </div>
              <Toaster />
              <BottomNavigation />
            </KanbanProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
