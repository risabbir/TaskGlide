
"use client";

// This page is no longer needed in guest-only mode.
// Redirecting to sign-in page which handles guest access.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { LayoutDashboard } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    document.title = `Page not available | ${APP_NAME}`;
    router.replace('/auth/signin');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <LayoutDashboard className="h-12 w-12 text-primary animate-pulse mb-4" />
      <p className="text-lg font-semibold text-foreground mb-1">Redirecting...</p>
      <p className="text-muted-foreground">This page is not available in guest mode.</p>
    </div>
  );
}
