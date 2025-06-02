
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
// It's better to let src/app/[locale]/layout.tsx handle specific app name based on locale for metadata.
// For this root layout, a generic title is fine, or it can be very minimal.

export const metadata: Metadata = {
  title: "KanvasAI", // Generic title, will be overridden by [locale] layout for actual pages
  description: 'Comprehensive Task Management Tool.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}> {/* Default lang, [locale]/layout.tsx overrides */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning={true}>
        {/*
          AuthProvider, KanbanProvider, Toaster, and BottomNavigation are removed from here.
          They are correctly placed in src/app/[locale]/layout.tsx, where they are
          wrapped by NextIntlClientProvider and have access to the locale.
          This root layout should be minimal.
        */}
        {children}
      </body>
    </html>
  );
}
