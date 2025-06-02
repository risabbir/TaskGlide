
"use client"; 

import { Header } from "@/components/layout/header"; // Added Header import
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form"; 
import { ChangeEmailForm } from "@/components/profile/change-email-form";
import { APP_NAME } from "@/lib/constants";
import { LayoutDashboard, UserCog, UserCircle, Settings, MailCheck, ShieldCheck } from "lucide-react";
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
      <>
        <Header /> 
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 bg-background"> {/* Adjusted min-h for header */}
          <LayoutDashboard className="h-12 w-12 text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center bg-gradient-to-br from-background via-secondary/5 to-background dark:from-background dark:via-card/10 dark:to-background py-8 px-4 sm:px-6 lg:px-8"> {/* Adjusted min-h for header */}
        <div className="w-full max-w-4xl space-y-10"> 
          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center">
              <UserCog className="mr-3 h-8 w-8 text-primary/80" /> Profile & Settings
            </h1>
            <p className="mt-2 text-md text-muted-foreground sm:text-lg max-w-xl">Manage your personal information, preferences, and account security settings.</p>
          </div>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-8 h-auto sm:h-12 p-1.5 bg-muted/70 rounded-lg shadow-inner">
              <TabsTrigger value="profile" className="py-2.5 text-base rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md flex items-center justify-center gap-2">
                <UserCircle className="h-5 w-5" /> Personal Info
              </TabsTrigger>
              <TabsTrigger value="account" className="py-2.5 text-base rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md flex items-center justify-center gap-2">
                <Settings className="h-5 w-5" /> Account Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <ProfileForm />
            </TabsContent>

            <TabsContent value="account" className="space-y-10 mt-6"> {/* Increased spacing */}
              <ChangeEmailForm />
              <Separator className="my-6"/> {/* Added margin to separator */}
              <ChangePasswordForm /> 
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
    
