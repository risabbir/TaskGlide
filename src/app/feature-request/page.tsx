
"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { APP_NAME, GITHUB_URL } from "@/lib/constants";
import { Send, Github } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function FeatureRequestPage() {
  useEffect(() => {
    document.title = `Suggest a Feature | ${APP_NAME}`;
  }, []);

  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Suggest an Improvement
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have an idea to make {APP_NAME} better? We'd love to hear it.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 sm:p-10 rounded-xl shadow-md border space-y-8">
            <div>
                <h2 className="text-2xl font-semibold mb-2">Your Feature Idea</h2>
                <p className="text-muted-foreground mb-6">This form submits your request directly to our team via Formspree.</p>
                <form action="https://formspree.io/f/mjkraydw" method="POST" className="space-y-6">
                    <div className="space-y-2">
                    <Label htmlFor="featureTitle" className="text-base font-medium">Feature Title</Label>
                    <Input
                        id="featureTitle"
                        name="featureTitle"
                        type="text"
                        placeholder="E.g., Add calendar view for tasks"
                        required
                        className="text-base h-11"
                    />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="detailedDescription" className="text-base font-medium">Detailed Description</Label>
                    <Textarea
                        id="detailedDescription"
                        name="detailedDescription"
                        rows={5}
                        placeholder="Describe your feature, why it's useful, and how it might work..."
                        required
                        className="text-base min-h-[150px]"
                    />
                    </div>
                    
                    <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">Your Email Address (Optional)</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com (for follow-up questions)"
                        className="text-base h-11"
                    />
                    </div>
                    
                    <div className="pt-2">
                        <Button type="submit" className="w-full sm:w-auto text-base py-2.5 px-6 h-11">
                        <Send className="mr-2 h-5 w-5" />
                        Submit Request
                        </Button>
                    </div>
                </form>
            </div>

            <Separator />

            <div>
                <h2 className="text-2xl font-semibold mb-4">Bug Reports & Community</h2>
                <div className="flex items-start gap-4">
                  <Github className="h-8 w-8 text-primary shrink-0" />
                  <div>
                      <h3 className="font-semibold text-foreground mb-1">Found a Bug or Love the App?</h3>
                      <p className="text-muted-foreground">
                        For technical issues or bug reports, please head over to our{' '}
                        <Link href={GITHUB_URL} legacyBehavior>
                          <a target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline">
                            GitHub repository
                          </a>
                        </Link>
                        . If you enjoy using {APP_NAME}, consider giving it a star—it helps a lot! ⭐
                      </p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
