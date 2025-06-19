
"use client";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { LayoutDashboard, User, UserPlus } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SignInPage() {
  const { startNewGuestSession, loading, guestId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = `Access ${APP_NAME}`;
  }, []);
  
  useEffect(() => {
    if (!loading && guestId) {
      router.push('/');
    }
  }, [loading, guestId, router]);


  const handleGuestLogin = () => {
    startNewGuestSession(false); 
    router.push("/"); 
  };

  if (loading) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <LayoutDashboard className="h-12 w-12 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center text-center mb-8">
        <Link href="/" className="flex items-center space-x-2 group mb-2">
          <LayoutDashboard className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
          <span className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
            {APP_NAME}
          </span>
        </Link>
        <p className="text-muted-foreground max-w-sm">
          Organize your tasks and boost productivity. Continue as a guest to get started right away!
        </p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to {APP_NAME}</CardTitle>
          <CardDescription>Access your tasks by continuing as a guest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button onClick={handleGuestLogin} className="w-full" size="lg">
            <User className="mr-2 h-5 w-5" />
            Continue as Guest
          </Button>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Wrap disabled button in a span for tooltip to work */}
                <span tabIndex={0} className="inline-block w-full">
                  <Button variant="outline" size="lg" disabled className="w-full cursor-not-allowed opacity-70">
                    <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming Soon!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
        <CardFooter>
        </CardFooter>
      </Card>
    </div>
  );
}
