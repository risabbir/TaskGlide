
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { LayoutDashboard } from "lucide-react";

// This page will redirect to the sign-in page, which now handles guest access.
export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/signin');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <LayoutDashboard className="h-12 w-12 text-primary animate-pulse mb-4" />
      <p className="text-lg font-semibold text-foreground mb-1">Redirecting...</p>
      <p className="text-muted-foreground">Taking you to the guest access page.</p>
    </div>
  );
}
