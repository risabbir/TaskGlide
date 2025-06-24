import type {Metadata, Viewport} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { KanbanProvider } from '@/lib/store';
import { APP_NAME } from '@/lib/constants';
import { BackToTopButton } from '@/components/layout/back-to-top-button';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Comprehensive Task Management Tool.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning={true}>
        <AuthProvider>
          <KanbanProvider>
            {/* Apply consistent container and padding here */}
            <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-16 md:pb-0">
              {children}
            </div>
            <Toaster />
            <BottomNavigation />
            <BackToTopButton />
          </KanbanProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
