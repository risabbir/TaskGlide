
import { SignInForm } from "@/components/auth/sign-in-form";
import { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Sign In | ${APP_NAME}`,
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <SignInForm />
    </div>
  );
}
