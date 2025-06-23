
"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, GITHUB_URL } from "@/lib/constants";
import { Send, Info, Github } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function FeatureRequestPage() {
  useEffect(() => {
    document.title = `Suggest a Feature | ${APP_NAME}`;
  }, []);

  return (
    <>
      <Header />
      <main className="flex-grow py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Suggest an Improvement
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Have an idea to make {APP_NAME} better? We'd love to hear it.
            </p>
          </div>

          <Card className="shadow-lg border">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center">
                Your Feature Idea
              </CardTitle>
              <CardDescription>
                This form submits your request directly to our team via Formspree.
              </CardDescription>
            </CardHeader>
            <form action="https://formspree.io/f/mjkraydw" method="POST">
              <CardContent className="space-y-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="featureTitle" className="text-base">Feature Title</Label>
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
                  <Label htmlFor="detailedDescription" className="text-base">Detailed Description</Label>
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
                  <Label htmlFor="category" className="text-base">Category</Label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Select a category</option>
                    <option value="UX Enhancement">UX Enhancement</option>
                    <option value="New Functionality">New Functionality</option>
                    <option value="AI Feature Suggestion">AI Feature Suggestion</option>
                    <option value="Existing Feature Improvement">Existing Feature Improvement</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                
                 <div className="space-y-2">
                  <Label htmlFor="priority" className="text-base">Priority</Label>
                   <select
                    id="priority"
                    name="priority"
                    required
                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>How important is this for you?</option>
                    <option value="Low">Low - A minor improvement</option>
                    <option value="Nice to have">Nice to Have - Would improve my experience</option>
                    <option value="High">High - Important for my workflow</option>
                    <option value="Critical">Critical - A key feature is missing or broken</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Your Email Address (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com (for follow-up questions)"
                    className="text-base h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-6 border-t">
                <Button type="submit" className="w-full sm:w-auto text-base py-2.5 px-6 h-11">
                  <Send className="mr-2 h-5 w-5" />
                  Submit Request
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <Alert variant="default" className="bg-accent/50 border-accent">
            <Info className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold text-primary/90">What happens next?</AlertTitle>
            <AlertDescription className="text-accent-foreground">
                <ul className="list-disc list-outside pl-5 mt-2 space-y-1.5">
                    <li>Your request will be sent directly to our team for review.</li>
                    <li>We prioritize new features based on user needs and overall impact.</li>
                    <li>If you provided your email, we may contact you for more details or to provide an update on your suggestion.</li>
                </ul>
            </AlertDescription>
          </Alert>

          <Alert variant="default" className="bg-accent/50 border-accent">
            <Github className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold text-primary/90">Technical Issues or Contributions?</AlertTitle>
            <AlertDescription className="text-accent-foreground">
              For bug reports, technical issues, or to contribute to the project, please visit our{' '}
              <Link href={GITHUB_URL} legacyBehavior>
                <a target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-primary/90">
                  GitHub repository
                </a>
              </Link>
              . You can open an issue there for a more technical discussion.
            </AlertDescription>
          </Alert>

        </div>
      </main>
      <Footer />
    </>
  );
}
