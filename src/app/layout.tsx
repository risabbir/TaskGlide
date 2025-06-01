
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { APP_NAME } from '@/lib/constants';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';


export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Comprehensive Task Management Tool.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning={true}>
        <AuthProvider>
          <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
