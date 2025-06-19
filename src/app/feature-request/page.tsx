
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import { Lightbulb, Send, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Configuration ---
// This is the email address where feature requests will be directed.
const SUPPORT_EMAIL = "webcodar37@gmail.com";
// --- End Configuration ---

const featureRequestSchema = z.object({
  title: z.string().min(5, "Please provide a concise title (min 5 characters).").max(100, "Title is too long (max 100 characters)."),
  description: z.string().min(10, "Please describe your feature in detail (min 10 characters).").max(2000, "Description is too long (max 2000 characters)."),
  category: z.enum(["ui_ux", "new_functionality", "ai_feature", "improvement", "other"], {
    errorMap: () => ({ message: "Please select a category." }),
  }),
});

type FeatureRequestFormData = z.infer<typeof featureRequestSchema>;

const categories = [
  { value: "ui_ux", label: "UI/UX Enhancement" },
  { value: "new_functionality", label: "New Functionality" },
  { value: "ai_feature", label: "AI Feature Suggestion" },
  { value: "improvement", label: "Existing Feature Improvement" },
  { value: "other", label: "Other" },
];

export default function FeatureRequestPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false); // Still useful for UI feedback during mailto generation

  useEffect(() => {
    document.title = `Suggest a Feature | ${APP_NAME}`;
  }, []);

  const form = useForm<FeatureRequestFormData>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
    },
  });

  async function onSubmit(data: FeatureRequestFormData) {
    setIsSubmitting(true);

    const subject = `Feature Request: ${data.title} (${data.category})`;
    const body = `
Feature Title: ${data.title}
Category: ${categories.find(c => c.value === data.category)?.label || data.category}

Description:
${data.description}

---
Submitted from ${APP_NAME}
    `;

    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    console.log("Generated mailto link (for debugging):", mailtoLink);

    try {
      // Attempt to open the mail client
      window.location.href = mailtoLink;
      
      toast({
        title: "Email Draft Prepared!",
        description: "Your email client should open shortly with a pre-filled message. Please review and send it from your email application.",
        duration: 10000, // Longer duration for user to read
      });
      form.reset();
    } catch (error) {
      console.error("Error trying to open mailto link:", error);
      toast({
        title: "Could Not Open Email Client",
        description: "We tried to open your email client but failed. You can manually copy the details or try again.",
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-8">
        <div className="max-w-2xl mx-auto"> {/* Centering the content block */}
          <div className="text-center mb-10">
            <Lightbulb className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Suggest a Feature
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Have an idea to make {APP_NAME} even better? Fill out the form below.
            </p>
          </div>

          <Card className="shadow-xl border">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <Lightbulb className="mr-3 h-6 w-6 text-primary" />
                Your Feature Idea
              </CardTitle>
              <CardDescription>
                Your feedback helps us improve {APP_NAME}!
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6 pt-2">
                    <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">How Submission Works</AlertTitle>
                        <AlertDescription className="text-blue-700 dark:text-blue-400">
                            This form will prepare an email in your <strong>default email application</strong> (like Outlook, Apple Mail, etc.).
                            You will need to <strong>click "Send" in your email app</strong> to submit the request.
                            This form is configured to send to: <strong>{SUPPORT_EMAIL}</strong>.
                        </AlertDescription>
                    </Alert>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Feature Title</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Add calendar view for tasks" {...field} className="text-base h-11" disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your feature, why it's useful, and how it might work..."
                            {...field}
                            className="text-base min-h-[150px]"
                            rows={6}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger className="text-base h-11">
                              <SelectValue placeholder="Select a category..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value} className="text-base">
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="bg-muted/30 p-6 border-t flex-col items-start gap-3">
                  <Button type="submit" className="w-full sm:w-auto text-base py-2.5 px-6 h-11" disabled={isSubmitting}>
                    <Send className="mr-2 h-5 w-5" />
                    {isSubmitting ? "Preparing Email..." : "Prepare Email for Request"}
                  </Button>
                   <p className="text-xs text-muted-foreground">
                    Clicking above will open your email client with the details pre-filled.
                  </p>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
    
