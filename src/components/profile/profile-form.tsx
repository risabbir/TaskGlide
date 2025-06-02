
"use client";

import { useForm, Controller } from "react-hook-form";
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
import { useAuth } from "@/contexts/auth-context";
import { Loader2, UploadCloud, Edit3, Info, UserCircle as UserIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateUserProfile, updateUserPhotoURL } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      role: "",
      otherRole: "",
      bio: "",
      website: "",
    },
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    if (user) {
      const currentFormValues = form.getValues();
      form.reset({
        displayName: user.displayName || currentFormValues.displayName || "",
        role: currentFormValues.role || "", 
        otherRole: currentFormValues.otherRole || "", 
        bio: currentFormValues.bio || "", 
        website: currentFormValues.website || "", 
      }, { keepDirty: form.formState.isDirty, keepValues: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form.reset]);


  // Effect 1: For local preview when a file is selected
  useEffect(() => {
    if (selectedFile) {
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewURL(objectUrl);
        setAvatarKey(Date.now()); 
        return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  // Effect 2: To update preview from user.photoURL (when no local file selected) AND to update avatarKey on context changes
  useEffect(() => {
    if (!selectedFile) { 
        setPreviewURL(user?.photoURL || null);
    }
    setAvatarKey(Date.now());
  }, [user?.photoURL, selectedFile]);


  async function onProfileSubmit(data: ProfileFormData) {
    if (!user) return;
    setIsSavingDetails(true);

    try {
        const profileAuthUpdates: { displayName?: string } = {};
        if (data.displayName !== (user.displayName || "")) {
        profileAuthUpdates.displayName = data.displayName;
        }

        let authUpdateSuccess = true;
        if (Object.keys(profileAuthUpdates).length > 0) {
        authUpdateSuccess = await updateUserProfile(profileAuthUpdates);
        }

        if (authUpdateSuccess) {
        const finalRole = data.role === 'other' ? data.otherRole : data.role;
        console.log("Simulating save of additional profile details (role, bio, website):", {
            userId: user.uid, role: finalRole, bio: data.bio, website: data.website,
        });
        toast({ title: "Profile Details Saved", description: "Your profile information has been submitted." });
        form.reset(data, { keepDirty: false }); // Reset form with new data, clear dirty state
        } else if (Object.keys(profileAuthUpdates).length > 0) {
        // Error toast is handled by updateUserProfile in context
        }
    } catch (error) {
        console.error("Error submitting profile details:", error);
        toast({ title: "Error", description: "An unexpected error occurred while saving details.", variant: "destructive" });
    } finally {
        setIsSavingDetails(false);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({title: "Invalid File Type", description: "Please select an image (JPEG, PNG, GIF, WebP).", variant: "destructive"});
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({title: "File Too Large", description: "Maximum photo size is 5MB.", variant: "destructive"});
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null); 
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile || !user) return;
    setIsUploadingPhoto(true);
    try {
      const uploadedPhotoURL = await updateUserPhotoURL(selectedFile); 
      if (uploadedPhotoURL) { 
        toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
        // user context update will trigger useEffect to update avatarKey and previewURL
      }
      // Error toasts are handled within updateUserPhotoURL
    } catch (error) {
        // This catch block is for unexpected errors thrown directly by updateUserPhotoURL
        // if its internal try/catch failed, which is unlikely.
        console.error("Error during photo upload process in ProfileForm:", error);
        toast({ title: "Upload Error", description: "An unexpected error occurred during photo upload.", variant: "destructive"});
    } finally {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploadingPhoto(false);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    if (email) {
      const parts = email.split("@")[0];
      return parts ? parts.substring(0, 2).toUpperCase() : email.substring(0,1).toUpperCase();
    }
    return "??";
  };

  const isFormBusy = isSavingDetails || isUploadingPhoto;

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
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group">
                        <Avatar key={avatarKey} className="h-28 w-28 sm:h-32 sm:w-32 cursor-pointer ring-4 ring-primary/20 hover:ring-primary/40 transition-all duration-300" onClick={triggerFileSelect} data-ai-hint="user avatar">
                            <AvatarImage src={previewURL || undefined} alt={user?.displayName || user?.email || "User"} />
                            <AvatarFallback className="text-3xl sm:text-4xl bg-muted">{getInitials(user?.displayName, user?.email)}</AvatarFallback>
                        </Avatar>
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                            onClick={triggerFileSelect} role="button" tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileSelect();}}
                            aria-label="Change profile picture"
                        >
                            <Edit3 className="h-7 w-7 sm:h-8 sm:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <p className="mt-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">Change</p>
                        </div>
                        <input
                            type="file" ref={fileInputRef} onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden" id="profile-picture-input"
                            disabled={isUploadingPhoto || isSavingDetails}
                        />
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        {selectedFile ? (
                        <div className="flex flex-col items-center sm:items-start gap-2">
                            <p className="text-sm text-muted-foreground truncate max-w-xs">New: {selectedFile.name}</p>
                            <Button type="button" onClick={handlePhotoUpload} disabled={isUploadingPhoto || isSavingDetails || !selectedFile} size="sm">
                            {isUploadingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                            Upload Photo
                            </Button>
                        </div>
                        ) : (
                            <Button type="button" variant="outline" onClick={triggerFileSelect} size="sm" disabled={isUploadingPhoto || isSavingDetails}>
                               <UploadCloud className="mr-2 h-4 w-4" /> Change Photo
                            </Button>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG, GIF, WebP. Max 5MB.</p>
                    </div>
                </div>

                <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-base">Display Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Your Name" {...field} className="text-base" disabled={isFormBusy}/>
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
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isFormBusy}>
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
                          <Input placeholder="E.g., UX Researcher" {...field} className="text-base" disabled={isFormBusy} />
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
                        <Textarea placeholder="Tell us a little about yourself..." {...field} className="text-base min-h-[100px]" disabled={isFormBusy}/>
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
                        <Input type="url" placeholder="https://your-website.com" {...field} className="text-base" disabled={isFormBusy}/>
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
                disabled={isSavingDetails || isUploadingPhoto || !form.formState.isDirty}
            >
                {isSavingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    