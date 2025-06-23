"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { Lightbulb, Send } from "lucide-react";

// This component renders a standard HTML form styled with ShadCN components.
// It submits directly to the Formspree endpoint provided.
export default function FeatureRequestPage() {
  useEffect(() => {
    document.title = `Suggest a Feature | ${APP_NAME}`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <Lightbulb className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Suggest a Feature
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Have an idea to make {APP_NAME} even better? Your feedback is invaluable.
            </p>
          </div>

          <Card className="shadow-xl border">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <Lightbulb className="mr-3 h-6 w-6 text-primary" />
                Your Feature Idea
              </CardTitle>
              <CardDescription>
                This form submits your request directly to our team via Formspree.
              </CardDescription>
            </CardHeader>
            {/* The form tag now handles the submission directly to Formspree */}
            <form action="https://formspree.io/f/mjkraydw" method="POST">
              <CardContent className="space-y-6 pt-2">
                {/* Feature Title */}
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

                {/* Detailed Description */}
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

                {/* Category Dropdown */}
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
                
                {/* Priority Dropdown */}
                 <div className="space-y-2">
                  <Label htmlFor="priority" className="text-base">Priority</Label>
                   <select
                    id="priority"
                    name="priority"
                    required
                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Select priority level</option>
                    <option value="Low">Low</option>
                    <option value="Nice to have">Nice to have</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Email Address */}
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
