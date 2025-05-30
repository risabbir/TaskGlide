
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans'; // Corrected import
import { GeistMono } from 'geist/font/mono'; // Corrected import
import './globals.css';
import { APP_NAME } from '@/lib/constants';


export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Comprehensive Task Management Tool with AI-driven assistance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}

