
import type {Metadata, Viewport} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { KanbanProvider } from '@/lib/store';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Comprehensive Task Management Tool.',
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
            {/* Removed max-w-7xl and custom padding from here, apply it in page.tsx or specific layouts if needed */}
            <div className="w-full flex flex-col flex-grow pb-16 md:pb-0">
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
