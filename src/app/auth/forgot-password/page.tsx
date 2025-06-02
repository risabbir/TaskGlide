
"use client";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useEffect } from "react";

export default function ForgotPasswordPage() {
  useEffect(() => {
    document.title = `Forgot Password | ${APP_NAME}`;
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center text-center mb-8">
        <Link href="/" className="flex items-center space-x-2 group mb-2">
          <LayoutDashboard className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
          <span className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
            {APP_NAME}
          </span>
        </Link>
         <p className="text-muted-foreground">
          Reset your password to regain access to your account.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
