
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
import { Lightbulb, Send, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Configuration ---
// IMPORTANT: Replace this placeholder with your actual Firebase Cloud Function URL
// after you deploy the function (see backend setup instructions).
const FEATURE_REQUEST_FUNCTION_URL = "YOUR_CLOUD_FUNCTION_URL_HERE";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (FEATURE_REQUEST_FUNCTION_URL === "YOUR_CLOUD_FUNCTION_URL_HERE") {
        toast({
            title: "Configuration Needed",
            description: "The feature request submission URL is not configured. Please contact the site administrator or check the developer console.",
            variant: "destructive",
            duration: 10000,
        });
        console.error("ERROR: FEATURE_REQUEST_FUNCTION_URL is not set in src/app/feature-request/page.tsx. Please deploy your Firebase Cloud Function and update this URL.");
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch(FEATURE_REQUEST_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Feature Request Submitted!",
          description: "Thank you for your feedback. Your suggestion has been sent.",
          duration: 7000,
        });
        form.reset();
      } else {
        console.error("Submission Error from backend:", result);
        toast({
          title: "Submission Failed",
          description: result.error || "Could not submit your feature request. Please try again later.",
          variant: "destructive",
          duration: 10000,
        });
      }
    } catch (error) {
      console.error("Error submitting feature request:", error);
      toast({
        title: "Network Error",
        description: "Could not reach the submission service. Please check your internet connection or try again later.",
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
        <div className="max-w-2xl mx-auto">
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
                        <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">Developer Note: Backend Required</AlertTitle>
                        <AlertDescription className="text-blue-700 dark:text-blue-400">
                            This form is configured to send data to a backend Firebase Cloud Function.
                            Ensure the function is deployed and the `FEATURE_REQUEST_FUNCTION_URL` constant in this file (`src/app/feature-request/page.tsx`) is updated with the correct URL.
                            If the URL is still set to the placeholder `YOUR_CLOUD_FUNCTION_URL_HERE`, submissions will fail.
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
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                    {isSubmitting ? "Submitting..." : "Submit Feature Request"}
                  </Button>
                   <p className="text-xs text-muted-foreground">
                    This will send your request directly to the team.
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
    