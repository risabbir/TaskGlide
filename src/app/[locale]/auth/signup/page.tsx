
"use client";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function SignUpPage() {
  const t = useTranslations("AuthPages");
  const tApp = useTranslations("App");

  useEffect(() => {
    document.title = `Sign Up | ${tApp("name")}`;
  }, [tApp]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center text-center mb-8">
        <Link href="/" className="flex items-center space-x-2 group mb-2">
          <LayoutDashboard className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
          <span className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
            {tApp("name")}
          </span>
        </Link>
        <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("signUpTagline", { appName: tApp("name") }) }} />
      </div>
      <SignUpForm />
    </div>
  );
}
