
import { ProfileForm } from "@/components/profile/profile-form";
import { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { LayoutDashboard, UserCircle } from "lucide-react"; // UserCircle as a generic profile icon
import Link from "next/link";

export const metadata: Metadata = {
  title: `Profile | ${APP_NAME}`,
};

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
       <div className="flex flex-col items-center text-center mb-8">
        <Link href="/" className="flex items-center space-x-2 group mb-2">
          <LayoutDashboard className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
           <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
            {APP_NAME}
          </span>
        </Link>
      </div>
      <ProfileForm />
    </div>
  );
}
