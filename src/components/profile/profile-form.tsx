
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
import { Loader2, Info, UserCircle as UserIcon, ImageOff } from "lucide-react";
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
];

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required.").max(50, "Display name is too long."),
  role: z.string().optional(),
  otherRole: z.string().max(100, "Role details are too long.").optional(),
  bio: z.string().max(500, "Bio should not exceed 500 characters.").optional(),
  website: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)." }).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.role === 'other' && !data.otherRole?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify your role",
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
      role: otherProfileData?.role || "",
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
    // This effect synchronizes the form with canonicalProfileData from auth/Firestore
    // It respects "dirty" fields, meaning if a user is editing a field, it won't be overwritten.
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
                 toast({ title: "Save Error", description: "Failed to update display name.", variant: "destructive" });
                 success = false;
            } else {
              displayNameUpdated = true;
            }
        }
        
        if (success) { 
          const otherDataToSave: Omit<OtherProfileData, 'firestoreUpdatedAt'> = {
              role: data.role,
              otherRole: data.otherRole,
              bio: data.bio,
              website: data.website,
          };
          
          const currentOtherProfileDataForCompare = {
            role: otherProfileData?.role || "",
            otherRole: otherProfileData?.otherRole || "",
            bio: otherProfileData?.bio || "",
            website: otherProfileData?.website || "",
          };

          if (JSON.stringify(otherDataToSave) !== JSON.stringify(currentOtherProfileDataForCompare)) {
              const otherProfileSaveSuccess = await saveOtherProfileData(otherDataToSave);
              if (!otherProfileSaveSuccess) {
                  toast({ title: "Save Error", description: "Failed to save additional profile details.", variant: "destructive" });
                  success = false;
              } else {
                otherDataUpdated = true;
              }
          }
        }

        if (success && (displayNameUpdated || otherDataUpdated)) {
            toast({ title: "Profile Saved", description: "Your profile information has been updated." });
            form.reset(data); // Reset form with submitted data to make it new "clean" state
        } else if (success) { 
            toast({ title: "No Changes", description: "No information was changed to save.", variant: "default" });
        }

    } catch (error) {
        console.error("Error submitting profile details:", error);
        toast({ title: "Error", description: "An unexpected error occurred while saving.", variant: "destructive" });
    } finally {
      setIsSavingProfileInfo(false);
    }
  }
  
  const isFormBusy = isSavingProfileInfo || otherProfileDataLoading;
  const isFormDirty = form.formState.isDirty;


  if (otherProfileDataLoading && !form.formState.isDirty) { 
    return (
      <Card className="w-full shadow-xl overflow-hidden">
        <CardHeader className="p-6 border-b">
          <CardTitle className="text-2xl font-semibold flex items-center">
              <UserIcon className="mr-3 h-6 w-6 text-primary" />
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
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-24 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 sm:p-8 border-t">
          <Skeleton className="h-10 w-28" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl overflow-hidden">
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
                {/* <ProfilePictureUploader /> */}
                <Alert variant="default" className="bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 dark:bg-blue-500/15 dark:border-blue-500/50">
                  <ImageOff className="h-5 w-5 !text-blue-600 dark:!text-blue-400" />
                  <AlertTitle className="font-semibold !text-blue-700 dark:!text-blue-400">Profile Pictures Disabled</AlertTitle>
                  <AlertDescription>
                    Profile picture uploads require Firebase Storage, which may need a project billing plan upgrade. This feature is currently disabled.
                  </AlertDescription>
                </Alert>


                <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-base">Display Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Your Name" {...field} className="text-base" disabled={isSavingProfileInfo}/>
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
                      <FormLabel className="text-base">Your Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSavingProfileInfo}>
                        <FormControl>
                          <SelectTrigger className="text-base">
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
                        <FormLabel className="text-base">Please specify your role</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., UX Researcher" {...field} className="text-base" disabled={isSavingProfileInfo} />
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
                      <FormLabel className="text-base">Bio / About Me</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us a little about yourself..." {...field} className="text-base min-h-[100px]" disabled={isSavingProfileInfo}/>
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
                      <FormLabel className="text-base">Website URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://your-website.com" {...field} className="text-base" disabled={isSavingProfileInfo}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                    <FormLabel className="text-base">Current Email Address</FormLabel>
                    <Input type="email" value={user?.email || ""} disabled className="bg-muted/50 cursor-not-allowed border-input/50 text-base"/>
                    <Alert variant="default" className="mt-2 text-xs text-muted-foreground p-2.5">
                        <Info className="h-3.5 w-3.5 !top-3 !left-3" />
                        <AlertDescription className="!pl-5">
                            To change your email address, please use the "Account Settings" tab.
                        </AlertDescription>
                    </Alert>
                </FormItem>
            </CardContent>
            <CardFooter className="bg-muted/30 p-6 sm:p-8 border-t">
            <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isFormBusy || !isFormDirty}
            >
                {isSavingProfileInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
    

    