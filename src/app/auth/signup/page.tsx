
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Sign Up | ${APP_NAME}`,
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <SignUpForm />
    </div>
  );
}
