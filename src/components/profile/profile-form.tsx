
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useAuth, type OtherProfileData } from "@/contexts/auth-context";
import { Loader2, Info, UserCircle as UserIcon, ImageOff, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
// import { ProfilePictureUploader } from "./profile-picture-uploader";


const OCCUPATIONS = [
  { value: "designer", label: "Designer" },
  { value: "software_engineer", label: "Software Engineer" },
  { value: "student", label: "Student" },
  { value: "marketing_professional", label: "Marketing Professional" },
  { value: "project_manager", label: "Project Manager" },
  { value: "healthcare_provider", label: "Healthcare Provider" },
  { value: "educator", label: "Educator" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "writer", label: "Writer" },
  { value: "artist", label: "Artist" },
  { value: "scientist", label: "Scientist" },
  { value: "researcher", label: "Researcher" },
  { value: "other", label: "Other" },
  { value: "unspecified", label: "Prefer not to say / Unspecified" },
];

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required.").max(50, "Display name cannot exceed 50 characters."),
  role: z.string().optional(),
  otherRole: z.string().max(100, "Role details cannot exceed 100 characters.").optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional(),
  website: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)." }).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.role === 'other' && !data.otherRole?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify your role or select 'Unspecified'.",
      path: ["otherRole"],
    });
  }
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { 
    user, 
    updateUserProfile, 
    otherProfileData, 
    otherProfileDataLoading, 
    saveOtherProfileData,
  } = useAuth();
  const { toast } = useToast();
  
  const [isSavingProfileInfo, setIsSavingProfileInfo] = useState(false);

  const canonicalProfileData = useMemo(() => {
    return {
      displayName: user?.displayName || "",
      role: otherProfileData?.role || "unspecified", // Default to unspecified if not set
      otherRole: otherProfileData?.otherRole || "",
      bio: otherProfileData?.bio || "",
      website: otherProfileData?.website || "",
    };
  }, [user?.displayName, otherProfileData]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: canonicalProfileData, 
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    (Object.keys(canonicalProfileData) as Array<keyof ProfileFormData>).forEach(key => {
      const currentFieldValueInForm = form.getValues(key);
      const canonicalValueForField = canonicalProfileData[key] === undefined || canonicalProfileData[key] === null 
                                     ? "" 
                                     : String(canonicalProfileData[key]);

      if (!form.formState.dirtyFields[key] && currentFieldValueInForm !== canonicalValueForField) {
        form.setValue(key, canonicalValueForField, {
          shouldDirty: false, 
          shouldValidate: true, 
        });
      }
    });
  }, [canonicalProfileData, form]);


  async function onProfileSubmit(data: ProfileFormData) {
    if (!user) return;
    setIsSavingProfileInfo(true);

    let displayNameUpdated = false;
    let otherDataUpdated = false;
    let success = true;

    try {
        const currentAuthDisplayName = user.displayName || "";
        if (data.displayName !== currentAuthDisplayName) {
            const authUpdateSuccess = await updateUserProfile({ displayName: data.displayName });
            if (!authUpdateSuccess) {
                 toast({ title: "Save Error", description: "Failed to update display name in Firebase Auth.", variant: "destructive" });
                 success = false;
            } else {
              displayNameUpdated = true;
            }
        }
        
        if (success) { 
          const otherDataToSave: Omit<OtherProfileData, 'firestoreUpdatedAt'> = {
              role: data.role === "unspecified" ? "" : data.role, // Store empty string if 'unspecified'
              otherRole: data.role === "other" ? data.otherRole : "", // Only store otherRole if role is 'other'
              bio: data.bio,
              website: data.website,
          };
          
          const currentOtherProfileDataForCompare = {
            role: (otherProfileData?.role || "unspecified") === "unspecified" ? "" : otherProfileData?.role,
            otherRole: otherProfileData?.role === "other" ? otherProfileData?.otherRole : "",
            bio: otherProfileData?.bio || "",
            website: otherProfileData?.website || "",
          };
          
          // Deep comparison might be too complex, simplified check for any difference
          if (JSON.stringify(otherDataToSave) !== JSON.stringify(currentOtherProfileDataForCompare)) {
              const otherProfileSaveSuccess = await saveOtherProfileData(otherDataToSave);
              if (!otherProfileSaveSuccess) {
                  toast({ title: "Save Error", description: "Failed to save additional profile details to Firestore.", variant: "destructive" });
                  success = false;
              } else {
                otherDataUpdated = true;
              }
          }
        }

        if (success && (displayNameUpdated || otherDataUpdated)) {
            toast({ title: "Profile Saved", description: "Your profile information has been successfully updated." });
            form.reset(data);
        } else if (success) { 
            toast({ title: "No Changes Detected", description: "Your profile information remains the same.", variant: "default" });
        }

    } catch (error) {
        console.error("Error submitting profile details:", error);
        toast({ title: "Unexpected Error", description: "An unexpected error occurred while saving your profile.", variant: "destructive" });
    } finally {
      setIsSavingProfileInfo(false);
    }
  }
  
  const isFormBusy = isSavingProfileInfo || otherProfileDataLoading;
  const isFormDirty = form.formState.isDirty;

  if (otherProfileDataLoading && !isFormDirty) { 
    return (
      <Card className="w-full shadow-xl overflow-hidden border rounded-lg">
        <CardHeader className="p-6 border-b">
          <CardTitle className="text-2xl font-semibold flex items-center">
              <UserIcon className="mr-3 h-6 w-6 text-primary animate-pulse" />
              Personal Information
          </CardTitle>
          <CardDescription className="text-base">Loading your details...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="h-28 w-28 sm:h-32 sm:w-32 rounded-full" />
            <div className="flex-grow space-y-3 text-center sm:text-left">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4 mb-1.5" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 sm:p-8 border-t">
          <Skeleton className="h-10 w-28" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl overflow-hidden border rounded-lg">
      <CardHeader className="p-6 border-b">
         <CardTitle className="text-2xl font-semibold flex items-center">
            <UserIcon className="mr-3 h-6 w-6 text-primary" />
            Personal Information
        </CardTitle>
        <CardDescription className="text-base">Update your display name, photo, and other personal details.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onProfileSubmit)}>
            <CardContent className="space-y-6 p-6 sm:p-8">
                <Alert variant="default" className="bg-accent/50 border-accent text-accent-foreground">
                  <ImageOff className="h-5 w-5 !text-accent-foreground/80" />
                  <AlertTitle className="font-semibold text-accent-foreground">Profile Pictures Disabled</AlertTitle>
                  <AlertDescription className="text-accent-foreground/90">
                    Profile picture uploads require Firebase Storage. This feature is currently disabled as it may need a project billing plan upgrade.
                  </AlertDescription>
                </Alert>

                <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-base font-medium">Display Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Your Name" {...field} className="text-base h-11" disabled={isSavingProfileInfo}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Your Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "unspecified"} disabled={isSavingProfileInfo}>
                        <FormControl>
                          <SelectTrigger className="text-base h-11">
                            <SelectValue placeholder="Select your role..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OCCUPATIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-base">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedRole === 'other' && (
                  <FormField
                    control={form.control}
                    name="otherRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Please specify your role</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., UX Researcher, Freelancer" {...field} className="text-base h-11" disabled={isSavingProfileInfo} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Bio / About Me</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us a little about yourself..." {...field} className="text-base min-h-[120px]" disabled={isSavingProfileInfo}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Website URL (Optional)</FormLabel>
                       <div className="relative flex items-center">
                        <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <FormControl>
                            <Input type="url" placeholder="https://your-website.com" {...field} className="text-base h-11 pl-10" disabled={isSavingProfileInfo}/>
                        </FormControl>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                    <FormLabel className="text-base font-medium">Current Email Address</FormLabel>
                    <Input type="email" value={user?.email || ""} disabled className="bg-muted/50 cursor-not-allowed border-input/50 text-base h-11"/>
                    <Alert variant="default" className="mt-2 text-xs text-muted-foreground p-3">
                        <Info className="h-4 w-4 !top-3.5 !left-3.5" />
                        <AlertDescription className="!pl-6 text-muted-foreground/90">
                            To change your email address, please use the "Account Settings" tab.
                        </AlertDescription>
                    </Alert>
                </FormItem>
            </CardContent>
            <CardFooter className="bg-muted/30 p-6 sm:p-8 border-t">
            <Button
                type="submit"
                className="w-full sm:w-auto text-base py-2.5 px-6 h-11"
                disabled={isFormBusy || !isFormDirty}
            >
                {isSavingProfileInfo && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Save Changes
            </Button>
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
    
