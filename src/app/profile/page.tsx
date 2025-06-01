
"use client"; 

import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form"; 
import { APP_NAME } from "@/lib/constants";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";


export default function ProfilePage() {
  const { user, loading } = useAuth(); // 'loading' here is initialLoading from AuthContext
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = `Profile Settings | ${APP_NAME}`;
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) { // if initial loading is done and still no user
      router.push('/auth/signin'); 
    }
  }, [user, loading, router]);

  if (loading || !user) { // Show loading screen if initial auth check is pending or user is null after check
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <LayoutDashboard className="h-12 w-12 text-primary animate-pulse" />
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-background via-secondary/10 to-background dark:from-background dark:via-card/20 dark:to-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl space-y-12"> 
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="flex items-center space-x-2 group mb-4">
            <LayoutDashboard className="h-8 w-8 sm:h-9 sm:w-9 text-primary transition-transform group-hover:scale-110" />
            <span className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
              {APP_NAME}
            </span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Profile Settings</h1>
          <p className="mt-2 text-md text-muted-foreground sm:text-lg">Manage your account details, preferences, and security.</p>
        </div>
        
        <ProfileForm />
        <Separator className="my-8" />
        <ChangePasswordForm /> 
      </div>
    </div>
  );
}
