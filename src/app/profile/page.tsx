
"use client"; 

import React, { useEffect, Suspense } from "react";
import dynamic from 'next/dynamic';
import { Header } from "@/components/layout/header";
import { LayoutDashboard, UserCog, UserCircle, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

const ProfileForm = dynamic(() => import('@/components/profile/profile-form').then(mod => mod.ProfileForm), {
  loading: () => <ProfileFormSkeleton />,
  ssr: false
});
const ChangePasswordForm = dynamic(() => import('@/components/profile/change-password-form').then(mod => mod.ChangePasswordForm), {
  loading: () => <FormSkeleton title="Change Password" fields={3} />,
  ssr: false
});
const ChangeEmailForm = dynamic(() => import('@/components/profile/change-email-form').then(mod => mod.ChangeEmailForm), {
  loading: () => <FormSkeleton title="Change Email Address" fields={3} />,
  ssr: false
});

function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="h-28 w-28 sm:h-32 sm:w-32 rounded-full" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function FormSkeleton({ title, fields }: { title: string; fields: number }) {
  return (
    <div className="w-full">
      <div className="p-6 border-b">
        <Skeleton className="h-6 w-3/4 mb-2" /> 
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-6 p-6 sm:p-8">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="bg-muted/30 p-6 sm:p-8 border-t">
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}


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
              <UserCog className="mr-3 h-8 w-8 text-primary/80" /> Profile & Settings
            </h1>
            <p className="mt-2 text-md text-muted-foreground sm:text-lg max-w-xl">Manage your personal information, preferences, and account security settings.</p>
          </div>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="flex w-full mb-6 border-b pb-2
                               sm:inline-flex sm:mb-10 sm:w-auto sm:h-auto sm:items-center sm:justify-center sm:rounded-lg sm:bg-muted sm:p-1.5 sm:space-x-1.5 sm:border-0 sm:pb-0">
              <TabsTrigger 
                value="profile" 
                className="flex-1 py-3 px-2 text-center text-sm font-medium flex items-center justify-center gap-2 
                           data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary
                           data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent hover:text-foreground
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background
                           disabled:pointer-events-none disabled:opacity-50
                           sm:flex-none sm:w-auto sm:px-4 sm:py-2.5 sm:rounded-md sm:border-0
                           sm:data-[state=active]:bg-background sm:data-[state=active]:text-primary sm:data-[state=active]:shadow-lg 
                           sm:data-[state=inactive]:text-muted-foreground sm:data-[state=inactive]:hover:bg-background/70 sm:data-[state=inactive]:hover:text-foreground"
              >
                <UserCircle className="h-5 w-5" /> Personal Info
              </TabsTrigger>
              <TabsTrigger 
                value="account" 
                className="flex-1 py-3 px-2 text-center text-sm font-medium flex items-center justify-center gap-2
                           data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary
                           data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent hover:text-foreground
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background
                           disabled:pointer-events-none disabled:opacity-50
                           sm:flex-none sm:w-auto sm:px-4 sm:py-2.5 sm:rounded-md sm:border-0
                           sm:data-[state=active]:bg-background sm:data-[state=active]:text-primary sm:data-[state=active]:shadow-lg
                           sm:data-[state=inactive]:text-muted-foreground sm:data-[state=inactive]:hover:bg-background/70 sm:data-[state=inactive]:hover:text-foreground"
              >
                <Settings className="h-5 w-5" /> Account Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-2 sm:mt-6">
              <Suspense fallback={<ProfileFormSkeleton />}>
                <ProfileForm />
              </Suspense>
            </TabsContent>

            <TabsContent value="account" className="space-y-10 mt-2 sm:mt-6">
              <Suspense fallback={<FormSkeleton title="Change Email Address" fields={3} />}>
                <ChangeEmailForm />
              </Suspense>
              <Separator className="my-6"/>
              <Suspense fallback={<FormSkeleton title="Change Password" fields={3} />}>
                <ChangePasswordForm /> 
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
