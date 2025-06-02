
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
import { locales } from '@/i18n'; // Import locales for validation
import { notFound } from 'next/navigation'; // Import notFound for explicit call

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: {params: {locale: string}}): Promise<Metadata> {
  const { locale } = params;
  // It's generally expected that Next.js provides a valid locale from generateStaticParams here.
  // If not, getTranslations would likely fail or use a fallback.
  // Adding a hard check here might be too defensive if generateStaticParams is trusted.
  if (!locales.includes(locale)) {
    // This path should ideally not be hit if routing & generateStaticParams are correct.
    // For now, let getTranslations attempt to handle it or potentially error.
    // If an error occurs here, next-intl will handle it based on its config.
  }
  const t = await getTranslations({locale, namespace: 'App'});
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
  params // Access params directly first
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  const { locale } = params; // Destructure here

  // Validate the locale from params before using it with next-intl
  if (!locales.includes(locale)) {
    notFound(); // Trigger Next.js's standard 404 mechanism if locale is invalid
  }

  // At this point, 'locale' is confirmed to be one of the valid locales.
  const messages = await getMessages({locale});

  return (
    <html lang={locale} suppressHydrationWarning={true}>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning={true}>
        <NextIntlClientProvider locale={locale} messages={messages}>
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
