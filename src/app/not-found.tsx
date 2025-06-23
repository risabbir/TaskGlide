
"use client";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Frown, Home } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    document.title = `404 - Page Not Found | ${APP_NAME}`;
  }, []);

  return (
    <div className="flex flex-col flex-grow min-h-[calc(100vh_-_var(--header-height,_4rem)_-_var(--bottom-nav-height,_4rem))]">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-8">
        <div className="max-w-md w-full">
            <Frown className="mx-auto h-24 w-24 text-primary/50 mb-6" data-ai-hint="sad face"/>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Page Not Found</h2>
            <p className="text-muted-foreground mb-8">
                Oops! The page you are looking for does not exist. It might have been moved or deleted.
            </p>
            <Button asChild size="lg">
                <Link href="/">
                    <Home className="mr-2 h-5 w-5" />
                    Go Back Home
                </Link>
            </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
