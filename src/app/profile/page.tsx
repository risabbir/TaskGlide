
"use client"; 

import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form"; 
import { ChangeEmailForm } from "@/components/profile/change-email-form";
import { APP_NAME } from "@/lib/constants";
import { LayoutDashboard, UserCog, UserCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const { user, loading } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = `Profile & Settings | ${APP_NAME}`;
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) { 
      router.push('/auth/signin'); 
    }
  }, [user, loading, router]);

  if (loading || !user) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <LayoutDashboard className="h-12 w-12 text-primary animate-pulse" />
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-background via-secondary/10 to-background dark:from-background dark:via-card/20 dark:to-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-10"> 
        <div className="flex flex-col items-center text-center mb-10">
          <Link href="/" className="flex items-center space-x-2 group mb-4">
            <LayoutDashboard className="h-8 w-8 sm:h-9 sm:w-9 text-primary transition-transform group-hover:scale-110" />
            <span className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
              {APP_NAME}
            </span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center">
            <UserCog className="mr-3 h-8 w-8 text-primary/80" /> Profile & Settings
          </h1>
          <p className="mt-2 text-md text-muted-foreground sm:text-lg">Manage your profile details, preferences, and account security.</p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-8 h-auto sm:h-10 p-1">
            <TabsTrigger value="profile" className="py-2 sm:py-1.5 text-sm sm:text-base">
              <UserCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Profile Details
            </TabsTrigger>
            <TabsTrigger value="account" className="py-2 sm:py-1.5 text-sm sm:text-base">
              <Settings className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Account Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileForm />
          </TabsContent>

          <TabsContent value="account" className="space-y-8">
            <ChangeEmailForm />
            <Separator />
            <ChangePasswordForm /> 
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
