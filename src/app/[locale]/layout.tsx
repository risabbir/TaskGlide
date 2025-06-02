
import type {Metadata, Viewport} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { KanbanProvider } from '@/lib/store';
import { APP_NAME } from '@/lib/constants'; // For metadata
// Removed: import {NextIntlClientProvider} from 'next-intl';
// Removed: import {getMessages, getTranslations} from 'next-intl/server';
// Removed: import { locales, defaultLocale } from '@/i18n-config';
import { notFound } from 'next/navigation'; // Keep for general use if needed, though locale validation is removed

// Removed: export function generateStaticParams() related to locales

export async function generateMetadata({params}: {params: {locale: string}}): Promise<Metadata> {
  // const { locale: localeFromParams } = params; // localeFromParams no longer used for i18n

  // Basic metadata, not using next-intl
  return {
    title: APP_NAME,
    description: 'Comprehensive Task Management Tool.', // Hardcoded description
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
  params: {locale: string}; // Param is still received due to directory structure
}>) {
  // const { locale: localeFromParams } = params; // localeFromParams no longer used for i18n

  // Removed: locale validation and getMessages call

  return (
    <html lang="en" suppressHydrationWarning={true}> {/* Hardcoded lang to "en" */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning={true}>
        {/* Removed: NextIntlClientProvider wrapper */}
        <AuthProvider>
          <KanbanProvider>
            <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow pb-16 md:pb-0">
              {children}
            </div>
            <Toaster />
            <BottomNavigation />
          </KanbanProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
