
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
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect } from "react";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required.").max(50, "Display name is too long."),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateUserProfile, loading } = useAuth();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
      });
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormData) {
    if (!user) return;
    const success = await updateUserProfile({ displayName: data.displayName });
    if (success) {
      form.reset({ displayName: data.displayName }); // Reset form with new values to clear dirty state
    }
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    }
    if (email) {
      const parts = email.split("@")[0];
      if (parts) {
          return parts.substring(0, 2).toUpperCase();
      }
      return email.substring(0,1).toUpperCase();
    }
    return "??";
  };

  if (!user) { // Should be handled by page redirect or layout if profile is protected route
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please sign in to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="items-center text-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
          <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-xl">Account Information</CardTitle>
        <CardDescription>Manage your display name and email.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={user.email || ""} disabled className="bg-muted/50"/>
              <FormMessage />
            </FormItem>
            
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !form.formState.isDirty}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Display Name
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
