
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
import { Lightbulb, Send, Info, AlertTriangle, MailQuestion } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema defining the form fields and their validation rules
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

// THIS IS THE EMAIL ADDRESS WHERE THE FEATURE REQUESTS WILL BE SENT.
// Ensure this is a valid email address you monitor.
const SUPPORT_EMAIL = "webcodar37@gmail.com"; 

export default function FeatureRequestPage() {
  const { toast } = useToast();

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

  function onSubmit(data: FeatureRequestFormData) {
    // Step 1: Construct the email subject using form data.
    const subject = `Feature Request for ${APP_NAME}: ${data.title} (Category: ${data.category})`;

    // Step 2: Construct the email body using form data.
    const body = `
Dear ${APP_NAME} Team,

I would like to request the following feature:

--------------------------------------------------
Feature Title:
${data.title}

Category:
${categories.find(c => c.value === data.category)?.label || data.category}

Detailed Description:
${data.description}
--------------------------------------------------

Thank you for considering this feature.

(This email was prepared by the ${APP_NAME} Feature Request Form. The user will send this from their email client.)
    `;

    // Step 3: Create the mailto link. This is a special URL that tells the browser
    // to try and open the user's default email application.
    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // FOR DEBUGGING: Log the generated mailto link to the browser console.
    // If the email client doesn't open, you can copy this link and paste it
    // into your browser's address bar to test it manually.
    console.log("--- DEBUG: Generated mailto link ---");
    console.log(mailtoLink);
    console.log("--- Details for manual email (if mailto fails) ---");
    console.log("To:", SUPPORT_EMAIL);
    console.log("Subject:", subject);
    console.log("Body:", body);
    console.log("------------------------------------");
    
    if (typeof window !== "undefined") {
      try {
        // Step 4: Attempt to open the user's default email client.
        // This will open a new email draft in their email app (Outlook, Mail, etc.)
        window.location.href = mailtoLink;
        
        // Step 5: Inform the user about the next step.
        toast({
          title: "Email Draft Prepared!",
          description: "Your email application should open with a pre-filled message. Please review the details and click 'Send' in your email application to submit your request.",
          duration: 15000, // Longer duration for user to read and act
        });
      } catch (error) {
        console.error("Error trying to open mailto link:", error);
        toast({
          title: "Could Not Open Email Client Automatically",
          description: `We tried to open your email app, but it didn't work. This can happen if no default email client is set up on your computer. \n\nPlease manually send an email with your feature request. Details have been logged to your browser's console (Press F12, go to Console tab). \n\nEmail to: ${SUPPORT_EMAIL}`,
          variant: "destructive",
          duration: 20000, // Even longer for manual action
        });
      }
      // Step 6: Reset the form fields after attempting to open the email client.
      form.reset();
    } else {
       // Fallback if window is not defined (should not happen in normal client-side execution)
       console.warn("Feature Request (Mailto Fallback - window is undefined):", {
        to: SUPPORT_EMAIL,
        subject,
        body,
      });
      toast({
        title: "Request Details Prepared (Manual Send Required)",
        description: `Could not automatically open your email client. Please copy the details (title: ${data.title}, description: ${data.description}, category: ${data.category}) and send your request manually to ${SUPPORT_EMAIL}. Details also in browser console.`,
        variant: "default",
        duration: 20000,
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <MailQuestion className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Suggest a Feature
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Have an idea to make {APP_NAME} even better? Fill out the form below.
            </p>
             <p className="mt-2 text-md text-primary/90 font-medium">
              Important: Submitting this form will prepare an email in <strong className="text-primary">your computer's default email application</strong>. You will need to press "Send" there.
            </p>
          </div>

          <Card className="shadow-xl border">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <Lightbulb className="mr-3 h-6 w-6 text-primary" />
                Your Feature Idea
              </CardTitle>
              <CardDescription>
                Tell us about your suggestion. After you submit, an email draft will open for you to send.
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6 pt-2">
                  {SUPPORT_EMAIL === "webcodar37@gmail.com" ? (
                     <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                        <Info className="h-5 w-5" />
                        <AlertTitle className="font-semibold">Form is Ready!</AlertTitle>
                        <AlertDescription>
                            This form is configured to prepare emails for: <strong>{SUPPORT_EMAIL}</strong>.
                        </AlertDescription>
                    </Alert>
                  ) : SUPPORT_EMAIL.includes("example.com") || SUPPORT_EMAIL === "" ? (
                    <Alert variant="destructive" className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <AlertTitle className="text-yellow-700 dark:text-yellow-500 font-semibold">Developer Configuration Needed</AlertTitle>
                        <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                          The <code>SUPPORT_EMAIL</code> in <code>src/app/feature-request/page.tsx</code> 
                          is currently set to a placeholder (<strong>{SUPPORT_EMAIL || "empty"}</strong>). 
                          Please update it to your actual support email address.
                        </AlertDescription>
                    </Alert>
                  ) : null}
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
                <CardFooter className="bg-muted/30 p-6 border-t flex-col items-start gap-3">
                  <Button type="submit" className="w-full sm:w-auto text-base py-2.5 px-6 h-11" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <Send className="mr-2 h-5 w-5 animate-pulse" />
                    ) : (
                      <Send className="mr-2 h-5 w-5" />
                    )}
                    Prepare Email for Request
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    After clicking, your default email application should open with a pre-filled draft. 
                    <strong className="text-foreground"> Please review the email and press "Send" in your email app to submit your request.</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    If your email app doesn't open, check your browser console (F12) for details to send manually.
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
    
