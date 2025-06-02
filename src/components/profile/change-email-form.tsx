
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, Eye, EyeOff, MailCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const changeEmailSchema = z.object({
  newEmail: z.string().email("Invalid new email address.").min(1, "New email is required."),
  confirmNewEmail: z.string().min(1, "Please confirm your new email."),
  currentPassword: z.string().min(1, "Current password is required."),
}).refine(data => data.newEmail === data.confirmNewEmail, {
  message: "New emails do not match.",
  path: ["confirmNewEmail"],
});

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

export function ChangeEmailForm() {
  const { updateUserEmailWithVerification, authOpLoading, user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const form = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: "",
      confirmNewEmail: "",
      currentPassword: "",
    },
  });

  async function onSubmit(data: ChangeEmailFormData) {
    if (data.newEmail === user?.email) {
        form.setError("newEmail", { type: "manual", message: "New email cannot be the same as your current email." });
        return;
    }
    const success = await updateUserEmailWithVerification(data.currentPassword, data.newEmail);
    if (success) {
      form.reset();
      setShowCurrentPassword(false);
    }
  }

  return (
    <Card className="w-full shadow-xl overflow-hidden">
      <CardHeader className="p-6 border-b">
        <CardTitle className="text-2xl font-semibold flex items-center">
            <MailCheck className="mr-3 h-6 w-6 text-primary" />
            Change Email Address
        </CardTitle>
        <CardDescription className="text-base">
            Update your login email. A verification link will be sent to your new email address.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">New Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="new.email@example.com" {...field} className="text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Confirm New Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Confirm new.email@example.com" {...field} className="text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Current Password (for verification)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showCurrentPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                        className="text-base pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 sm:p-8 border-t">
            <Button type="submit" className="w-full sm:w-auto" disabled={authOpLoading || !form.formState.isDirty}>
              {authOpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Verification Email
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
