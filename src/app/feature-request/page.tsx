
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
import { Lightbulb, Send, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// THIS IS A PLACEHOLDER. Replace with your actual Cloud Function URL after deploying it.
const FEATURE_REQUEST_FUNCTION_URL = "YOUR_CLOUD_FUNCTION_URL_HERE";

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
    if (FEATURE_REQUEST_FUNCTION_URL === "YOUR_CLOUD_FUNCTION_URL_HERE") {
      toast({
        title: "Configuration Needed",
        description: "The feature request submission URL is not configured. Please update it in the code.",
        variant: "destructive",
        duration: 10000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(FEATURE_REQUEST_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Feature Request Submitted!",
          description: result.message || "Thank you for your feedback.",
        });
        form.reset();
      } else {
        toast({
          title: "Submission Failed",
          description: result.message || "Could not submit your feature request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting feature request:", error);
      toast({
        title: "Submission Error",
        description: "An error occurred. Please check your connection or try again later.",
        variant: "destructive",
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
              Have an idea to make {APP_NAME} even better? Fill out the form below and we'll send it directly to our team.
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
                  {FEATURE_REQUEST_FUNCTION_URL === "YOUR_CLOUD_FUNCTION_URL_HERE" && (
                    <Alert variant="destructive" className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <AlertTitle className="text-yellow-700 dark:text-yellow-500 font-semibold">Developer Action Required</AlertTitle>
                        <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                          This form is set up to send data to a backend Cloud Function.
                          The <code>FEATURE_REQUEST_FUNCTION_URL</code> in <code>src/app/feature-request/page.tsx</code> 
                          needs to be replaced with your deployed Cloud Function's HTTP trigger URL.
                          <a 
                            href="https://firebase.google.com/docs/functions/http-events" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block mt-1.5 text-xs font-medium text-yellow-800 dark:text-yellow-300 hover:underline"
                          >
                            Learn about HTTP Triggers <ExternalLink className="inline-block h-3 w-3 ml-0.5" />
                          </a>
                        </AlertDescription>
                    </Alert>
                  )}
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
                  <Button type="submit" className="w-full sm:w-auto text-base py-2.5 px-6 h-11" disabled={isSubmitting || FEATURE_REQUEST_FUNCTION_URL === "YOUR_CLOUD_FUNCTION_URL_HERE"}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-5 w-5" />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Feature Request"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Your suggestion will be sent directly to our team for review.
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
    
