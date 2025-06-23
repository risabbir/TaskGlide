
"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { APP_NAME } from "@/lib/constants";
import { Send, Lightbulb } from "lucide-react";
import { CommunitySupportSection } from "@/components/layout/community-support-section";

export default function FeatureRequestPage() {
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");

  useEffect(() => {
    document.title = `Suggest a Feature | ${APP_NAME}`;
  }, []);

  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Suggest an Improvement
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have an idea to make {APP_NAME} better? We'd love to hear it.
            </p>
          </div>

          <div className="space-y-8">
            {/* Form Card */}
            <div className="bg-card text-card-foreground p-6 sm:p-10 rounded-xl shadow-md border">
                <div className="flex items-start gap-4">
                  <Lightbulb className="h-8 w-8 text-primary shrink-0 mt-1" />
                  <div>
                      <h2 className="text-2xl font-semibold mb-1">Your Feature Idea</h2>
                      <p className="text-muted-foreground mb-6">This form submits your request directly to our team via Formspree.</p>
                  </div>
                </div>
                <form action="https://formspree.io/f/mjkraydw" method="POST" className="space-y-6">
                    {/* Feature Title */}
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

                    {/* Detailed Description */}
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
                    
                    {/* Category Dropdown */}
                    <div className="space-y-2">
                        <Label htmlFor="category" className="text-base font-medium">Category</Label>
                        <Select value={category} onValueChange={setCategory} required>
                            <SelectTrigger id="category" className="text-base h-11">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UX Enhancement">UX Enhancement (e.g., visual improvements, navigation)</SelectItem>
                                <SelectItem value="New Functionality">New Functionality (e.g., a completely new tool/feature)</SelectItem>
                                <SelectItem value="AI Feature Suggestion">AI Feature Suggestion (e.g., smart recommendations, automation)</SelectItem>
                                <SelectItem value="Existing Feature Improvement">Existing Feature Improvement (e.g., making an existing feature better)</SelectItem>
                                <SelectItem value="Others">Others (Please specify in description)</SelectItem>
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="category" value={category} />
                    </div>

                    {/* Email */}
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

                    {/* Priority Dropdown */}
                    <div className="space-y-2">
                        <Label htmlFor="priority" className="text-base font-medium">Priority</Label>
                        <Select value={priority} onValueChange={setPriority} required>
                            <SelectTrigger id="priority" className="text-base h-11">
                                <SelectValue placeholder="Select priority level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low (Not urgent, but good to have)</SelectItem>
                                <SelectItem value="Nice to have">Nice to have (Could improve experience)</SelectItem>
                                <SelectItem value="High">High (Crucial for functionality or user experience)</SelectItem>
                                <SelectItem value="Critical">Critical (Addresses a major issue or missing core feature)</SelectItem>
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="priority" value={priority} />
                    </div>
                    
                    {/* Submit Button */}
                    <div className="pt-2">
                        <Button type="submit" className="w-full sm:w-auto text-base py-2.5 px-6 h-11" disabled={!category || !priority}>
                            <Send className="mr-2 h-5 w-5" />
                            Submit Request
                        </Button>
                    </div>
                </form>
            </div>

            {/* What's Next Alert */}
            <Alert variant="default" className="bg-accent/50 border-accent text-accent-foreground">
              <AlertTitle className="font-semibold text-foreground">What Happens Next?</AlertTitle>
              <AlertDescription className="text-accent-foreground/90">
                <ul className="list-disc list-outside space-y-1.5 pl-5 mt-2">
                  <li>After submitting, you'll see a confirmation that your request was sent via Formspree.</li>
                  <li>Our team reviews every suggestion and prioritizes them based on user value and our goals for {APP_NAME}.</li>
                  <li>If you provide an email, we may contact you for more details about your idea.</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <CommunitySupportSection />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
