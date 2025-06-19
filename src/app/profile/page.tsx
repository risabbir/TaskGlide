
"use client"; 

import React, { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { LayoutDashboard, User as GuestIcon, AlertCircle, XCircle, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function ProfilePage() {
  const { guestId, isGuest, loading: authLoading, startNewGuestSession } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    document.title = `Guest Information | ${APP_NAME}`;
  }, []);

  useEffect(() => {
    if (!authLoading && !isGuest) { 
      router.push('/auth/signin'); 
    }
  }, [isGuest, authLoading, router]);

  const handleClearAndNewSession = () => {
    startNewGuestSession(true); 
    router.push('/'); 
  };

  if (authLoading) { 
    return (
      <>
        <Header /> 
        <div className="flex flex-grow flex-col items-center justify-center p-4 bg-background">
          <LayoutDashboard className="h-12 w-12 text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading guest information...</p>
        </div>
      </>
    );
  }

  if (!isGuest || !guestId) {
     return (
      <>
        <Header /> 
        <div className="flex flex-grow flex-col items-center justify-center p-4 bg-background text-center">
          <GuestIcon className="h-12 w-12 text-primary mb-4" />
          <p className="text-xl font-semibold text-foreground mb-2">No Active Guest Session</p>
          <p className="text-muted-foreground mb-6">Please start a guest session to manage your tasks.</p>
          <Button asChild>
            <Link href="/auth/signin">Start Guest Session</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      {/* Removed outer padding and centering classes, relying on RootLayout's container */}
      <div className="flex flex-grow flex-col items-center bg-gradient-to-br from-background via-secondary/5 to-background dark:from-background dark:via-card/10 dark:to-background py-8">
        <div className="w-full max-w-2xl space-y-8"> 
          <div className="flex flex-col items-center text-center mb-8">
            <GuestIcon className="mr-3 h-10 w-10 text-primary/80 mb-3" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Guest User Information
            </h1>
            <p className="mt-2 text-md text-muted-foreground sm:text-lg max-w-xl">You are currently browsing and managing tasks as a guest.</p>
          </div>
          
          <Card className="shadow-lg border">
            <CardHeader>
              <CardTitle className="text-xl">Your Guest Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                <span className="font-medium text-muted-foreground">Current Guest ID:</span>
                <span className="text-foreground font-mono text-sm break-all">{guestId}</span>
              </div>
               <Alert variant="default" className="bg-accent/50 border-accent">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <AlertTitle className="font-semibold text-primary/90">Local Data Storage</AlertTitle>
                  <AlertDescription className="text-accent-foreground">
                    Your task data is saved locally in this browser. Clearing your browser's cache or site data for {APP_NAME} will remove this information.
                    Your data is not synced to the cloud in guest mode.
                  </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="pt-6 border-t bg-muted/20 flex-col sm:flex-row justify-between items-center gap-4">
              <Button variant="destructive" onClick={handleClearAndNewSession} className="w-full sm:w-auto">
                <XCircle className="mr-2 h-4 w-4" /> Clear All Data & Start New Guest Session
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" disabled className="w-full sm:w-auto cursor-not-allowed opacity-70">
                      <UserPlus className="mr-2 h-4 w-4" /> Sign Up for Account
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Registered accounts coming soon!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
