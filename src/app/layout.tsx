
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { APP_NAME } from '@/lib/constants';


export const metadata: Metadata = {
  title: APP_NAME, // Will now use "ProTasker"
  description: 'Comprehensive Task Management Tool.', // Simplified description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning={true}>
        <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow">
          {children}
        </div>
      </body>
    </html>
  );
}

