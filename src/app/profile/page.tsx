
"use client"; 

import React, { useEffect, Suspense } from "react";
import dynamic from 'next/dynamic';
import { Header } from "@/components/layout/header";
import { LayoutDashboard, UserCog, UserCircle, Settings, LogIn, UserPlus, Info } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const ProfileForm = dynamic(() => import('@/components/profile/profile-form').then(mod => mod.ProfileForm), {
  loading: () => <ProfileFormSkeleton />,
  ssr: false
});
const ChangePasswordForm = dynamic(() => import('@/components/profile/change-password-form').then(mod => mod.ChangePasswordForm), {
  loading: () => <FormSkeleton title="Change Password" fields={3} description="Update your account password for enhanced security." />,
  ssr: false
});
const ChangeEmailForm = dynamic(() => import('@/components/profile/change-email-form').then(mod => mod.ChangeEmailForm), {
  loading: () => <FormSkeleton title="Change Email Address" fields={3} description="Update your login email. A verification link will be sent."/>,
  ssr: false
});

function ProfileFormSkeleton() {
  return (
    <div className="w-full shadow-xl overflow-hidden border rounded-lg">
      <div className="p-6 border-b">
        <div className="flex items-center">
          <UserCircle className="mr-3 h-6 w-6 text-primary" />
          <Skeleton className="h-7 w-1/2" />
        </div>
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
      <div className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="h-28 w-28 sm:h-32 sm:w-32 rounded-full" />
          <div className="flex-grow space-y-3 text-center sm:text-left">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
            {i === 4 && <Skeleton className="h-12 w-full mt-1" />} 
          </div>
        ))}
      </div>
      <div className="bg-muted/30 p-6 sm:p-8 border-t">
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}


function FormSkeleton({ title, fields, description }: { title: string; fields: number; description: string }) {
  return (
    <div className="w-full shadow-xl overflow-hidden border rounded-lg">
      <div className="p-6 border-b">
        <Skeleton className="h-7 w-1/2 mb-2" /> 
        <Skeleton className="h-4 w-3/4" />
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
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const { user, loading, guestId, isGuest, otherProfileDataLoading } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const title = user ? `Profile & Settings | ${APP_NAME}` : isGuest ? `Guest Info | ${APP_NAME}` : `Access Denied | ${APP_NAME}`;
      document.title = title;
    }
  }, [user, isGuest]);

  useEffect(() => {
    if (!loading && !user && !isGuest) { 
      router.push('/auth/signin'); 
    }
  }, [user, loading, isGuest, router]);

  if (loading || (user && otherProfileDataLoading && !isGuest) ) { 
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

  if (isGuest && guestId) {
    return (
      <>
        <Header />
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center bg-gradient-to-br from-background via-secondary/5 to-background dark:from-background dark:via-card/10 dark:to-background py-8 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl space-y-8">
            <div className="flex flex-col items-center text-center mb-8">
              <UserCircle className="mr-3 h-10 w-10 text-primary/80 mb-3" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Guest User Information
              </h1>
              <p className="mt-2 text-md text-muted-foreground sm:text-lg max-w-xl">You are currently browsing as a guest.</p>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Your Guest Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-muted-foreground">Guest ID:</span>
                  <span className="text-foreground font-mono bg-muted px-2 py-1 rounded-md text-sm">{guestId}</span>
                </div>
                 <Alert variant="default" className="bg-accent/50 border-accent">
                    <Info className="h-5 w-5 text-primary" />
                    <AlertTitle className="font-semibold text-primary/90">Local Data Storage</AlertTitle>
                    <AlertDescription className="text-accent-foreground">
                      Your task data is currently saved locally in this browser. To save your progress to the cloud and access it from any device, please sign up or log in.
                    </AlertDescription>
                  </Alert>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t bg-muted/20">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/auth/signup">
                    <UserPlus className="mr-2 h-4 w-4" /> Sign Up to Save Data
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/auth/signin">
                    <LogIn className="mr-2 h-4 w-4" /> Log In to Existing Account
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </>
    );
  }


  if (!user) { // Should be caught by useEffect pushing to signin, but as a fallback
     return (
      <>
        <Header /> 
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 bg-background">
          <LayoutDashboard className="h-12 w-12 text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
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
             <TabsList className="flex w-full mb-6 border-b py-[33px] px-[10px]
                               sm:inline-flex sm:mb-10 sm:w-auto sm:items-center sm:justify-center sm:rounded-lg sm:bg-muted sm:py-[33px] sm:px-[10px] sm:space-x-1.5 sm:border-0">
              <TabsTrigger 
                value="profile" 
                className="flex-1 py-3 px-1 text-center text-sm font-medium flex items-center justify-center gap-2
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
                className="flex-1 py-3 px-1 text-center text-sm font-medium flex items-center justify-center gap-2
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
              <Suspense fallback={<FormSkeleton title="Change Email Address" fields={3} description="Update your login email. A verification link will be sent." />}>
                <ChangeEmailForm />
              </Suspense>
              <Separator className="my-6"/>
              <Suspense fallback={<FormSkeleton title="Change Password" fields={3} description="Update your account password for enhanced security." />}>
                <ChangePasswordForm /> 
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
