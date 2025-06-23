
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
import { Send } from "lucide-react";

export default function FeatureRequestPage() {
  useEffect(() => {
    document.title = `Suggest an Improvement | ${APP_NAME}`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-8">
        <div className="max-w-2xl mx-auto">
          
          <Card className="shadow-xl border">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                Suggest an Improvement for {APP_NAME}
              </CardTitle>
              <CardDescription>
                Your feedback is valuable. All suggestions are reviewed by our team.
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
