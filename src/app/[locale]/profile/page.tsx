
"use client"; 

import { Header } from "@/components/layout/header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form"; 
import { ChangeEmailForm } from "@/components/profile/change-email-form";
import { LayoutDashboard, UserCog, UserCircle, Settings, MailCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME } from "@/lib/constants";

export default function ProfilePage() {
  const { user, loading } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    document.title = `Your Profile | ${APP_NAME}`;
  }, []);

  useEffect(() => {
    if (!loading && !user) { 
      router.push('/auth/signin'); 
    }
  }, [user, loading, router]);

  if (loading || !user) { 
    return (
      <>
        <Header /> 
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 bg-background">
          <LayoutDashboard className="h-12 w-12 text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center bg-gradient-to-br from-background via-secondary/5 to-background dark:from-background dark:via-card/10 dark:to-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-10"> 
          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center">
              <UserCog className="mr-3 h-8 w-8 text-primary/80" /> Account Settings
            </h1>
            <p className="mt-2 text-md text-muted-foreground sm:text-lg max-w-xl">Manage your personal information and account settings.</p>
          </div>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="inline-flex h-auto items-center justify-center rounded-lg bg-muted p-1.5 space-x-1.5 mb-10 w-full sm:w-auto">
              <TabsTrigger 
                value="profile" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-background/70 data-[state=inactive]:hover:text-foreground gap-2"
              >
                <UserCircle className="h-5 w-5" /> Personal Info
              </TabsTrigger>
              <TabsTrigger 
                value="account" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-background/70 data-[state=inactive]:hover:text-foreground gap-2"
              >
                <Settings className="h-5 w-5" /> Account Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <ProfileForm />
            </TabsContent>

            <TabsContent value="account" className="space-y-10 mt-6">
              <ChangeEmailForm />
              <Separator className="my-6"/>
              <ChangePasswordForm /> 
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
