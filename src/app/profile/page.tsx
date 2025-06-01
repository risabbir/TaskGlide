
"use client"; // Required because we use hooks like useAuth

import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form"; 
import { APP_NAME } from "@/lib/constants";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// export const metadata: Metadata = { // Cannot use generateMetadata with "use client"
//   title: `Profile | ${APP_NAME}`,
// };

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = `Profile | ${APP_NAME}`;
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin'); // Redirect to sign-in if not authenticated
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // You can render a loading spinner here
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <LayoutDashboard className="h-12 w-12 text-primary animate-pulse" />
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-background to-secondary/30 dark:from-background dark:to-card/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-10">
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center space-x-2 group mb-4">
            <LayoutDashboard className="h-9 w-9 text-primary transition-transform group-hover:scale-110" />
            <span className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
              {APP_NAME}
            </span>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Your Profile</h1>
          <p className="mt-3 text-lg text-muted-foreground">Manage your account settings, preferences, and security.</p>
        </div>
        
        <ProfileForm />
        <ChangePasswordForm /> 
      </div>
    </div>
  );
}
