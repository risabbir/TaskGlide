
"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { APP_NAME, GITHUB_URL } from "@/lib/constants";
import { Send, Github, FileText } from "lucide-react";
import Link from "next/link";

// Re-using the Section component from other pages for consistency.
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section>
    <h2 className="text-2xl font-semibold mb-4 text-primary flex items-center">
      <FileText size={20} className="mr-2.5" /> {title}
    </h2>
    <div className="text-muted-foreground leading-relaxed space-y-4 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
      {children}
    </div>
  </section>
);


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
            <Section title="Your Feature Idea">
              <p>This form submits your request directly to our team via Formspree.</p>
              <form action="https://formspree.io/f/mjkraydw" method="POST" className="not-prose space-y-6 mt-4">
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
                  <Label htmlFor="category" className="text-base font-medium">Category</Label>
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
                  <Label htmlFor="priority" className="text-base font-medium">Priority</Label>
                   <select
                    id="priority"
                    name="priority"
                    required
                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>How important is this for you?</option>
                    <option value="Low">Low - A minor improvement, but nice to have.</option>
                    <option value="Medium">Medium - Would improve my experience.</option>
                    <option value="High">High - Very useful, would improve my daily workflow.</option>
                    <option value="Critical">Critical - A key feature is missing for my use case.</option>
                  </select>
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
            </Section>

            <Section title="Bug Reports & Community">
              <div className="flex items-start gap-4 not-prose">
                <Github className="h-6 w-6 text-primary shrink-0 mt-1" />
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
            </Section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
