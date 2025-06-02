
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { APP_NAME } from '@/lib/constants';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { KanbanProvider } from '@/lib/store'; // Import KanbanProvider

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
          {/* Wrap with KanbanProvider here if BottomNavigation needs its context and is outside page-specific providers */}
          {/* However, it's better if pages that use Kanban (like HomePage) provide it.
              If BottomNavigation truly needs KanbanContext globally, it needs to be here.
              Let's assume BottomNavigation will primarily use useKanban for dispatching actions,
              which should work if HomePage (or any page using Kanban) has its provider.
              For actions like OPEN_TASK_MODAL, it should be fine as long as the context is available
              somewhere up the tree when the action is dispatched.
              If direct state reading is needed in BottomNavigation from KanbanContext, then provider must wrap it.
              Given current BottomNav actions (dispatch OPEN_TASK_MODAL, TOGGLE_FILTER_SIDEBAR),
              KanbanProvider needs to be available. If BottomNavigation is truly global,
              then KanbanProvider should wrap the content that might dispatch these.
              The most straightforward way if BottomNav is always shown is to wrap children and BottomNav.
           */}
          <KanbanProvider>
            <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow pb-16 md:pb-0"> {/* Added padding-bottom for mobile */}
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
