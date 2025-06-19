
"use client";

import { useEffect } from "react";
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
import { Lightbulb, Send, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

// IMPORTANT: Developer - Replace this with your actual support email address!
const SUPPORT_EMAIL = "webcodar37@gmail.com"; // Placeholder

export default function FeatureRequestPage() {
  const { toast } = useToast();

  useEffect(() => {
    document.title = `Feature Request | ${APP_NAME}`;
  }, []);

  const form = useForm<FeatureRequestFormData>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
    },
  });

  function onSubmit(data: FeatureRequestFormData) {
    const subject = `Feature Request: ${data.title} [${data.category}]`;
    const body = `
Feature Title: ${data.title}
Category: ${categories.find(c => c.value === data.category)?.label || data.category}

Description:
${data.description}

---
Submitted from ${APP_NAME} Feature Request Form
    `;

    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    if (typeof window !== "undefined") {
      // Attempt to open email client
      window.location.href = mailtoLink;
      
      // Provide feedback
      toast({
        title: "Preparing Your Email",
        description: "Your email client should open shortly with a pre-filled message. Please review and send it.",
        duration: 7000,
      });
      
      // Reset the form after attempting to open the mail client
      form.reset();

    } else {
       // Fallback for environments where window.location.href might not work as expected (e.g., some server-side contexts if misconfigured)
       // Though this is a client component, it's a safety net.
       console.warn("Feature Request (Mailto Fallback - window.location.href issue?):", {
        to: SUPPORT_EMAIL,
        subject,
        body,
      });
      toast({
        title: "Request Prepared (Manual Send Needed)",
        description: "Could not automatically open your email client. Please copy the details and send your request manually.",
        variant: "default",
        duration: 10000,
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mt-4">
              Suggest a Feature
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have an idea to make ${APP_NAME} even better? We&apos;d love to hear it!
            </p>
             <p className="mt-1 text-sm text-muted-foreground">
              Submitting this form will attempt to open your default email client.
            </p>
          </div>

          <Card className="shadow-xl border">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <Lightbulb className="mr-3 h-6 w-6 text-primary" />
                Your Feature Idea
              </CardTitle>
              <CardDescription>
                Fill out the form below. This will prepare an email for you to send using your default email application.
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6 pt-2">
                  <Alert variant="destructive" className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <AlertTitle className="text-yellow-700 dark:text-yellow-500 font-semibold">Developer Configuration Required</AlertTitle>
                      <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                        For this form to deliver feature requests, the developer must update the 
                        <code> SUPPORT_EMAIL </code> constant in the file <code>src/app/feature-request/page.tsx</code> 
                        to a valid support email address. The current placeholder is: <strong>{SUPPORT_EMAIL}</strong>. 
                        Without this change, the "Prepare Email" button will attempt to use this placeholder.
                      </AlertDescription>
                  </Alert>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Feature Title</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Add calendar view for tasks" {...field} className="text-base h-11" />
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                <CardFooter className="bg-muted/30 p-6 border-t">
                  <Button type="submit" className="w-full sm:w-auto text-base py-2.5 px-6 h-11" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <Send className="mr-2 h-5 w-5 animate-pulse" />
                    ) : (
                      <Send className="mr-2 h-5 w-5" />
                    )}
                    Prepare Email for Request
                  </Button>
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

    