
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
import { Loader2, UploadCloud, Edit3, Info, UserCircle as UserIcon } from "lucide-react"; // Renamed UserCircle to UserIcon
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
  occupation: z.string().optional(),
  otherOccupation: z.string().max(100, "Occupation details are too long.").optional(),
  bio: z.string().max(500, "Bio should not exceed 500 characters.").optional(),
  website: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)." }).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.occupation === 'other' && !data.otherOccupation?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify your occupation",
      path: ["otherOccupation"],
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
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false); // Renamed for clarity
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      // For new fields, initialize as empty or from user object if they existed (which they don't yet from auth)
      occupation: "", 
      otherOccupation: "",
      bio: "",
      website: "",
    },
  });
  
  const watchedOccupation = form.watch("occupation");

  useEffect(() => {
    // Populate form with user data if available
    // This part would be extended if occupation, bio, website were fetched from Firestore
    if (user) {
      form.reset({ 
        displayName: user.displayName || "",
        occupation: form.getValues("occupation") || "", // Keep current form value if already set, or default
        otherOccupation: form.getValues("otherOccupation") || "",
        bio: form.getValues("bio") || "",
        website: form.getValues("website") || "",
      });
      if (!selectedFile) {
        const currentAuthPhotoURL = user.photoURL || null;
        if (previewURL !== currentAuthPhotoURL) {
          setPreviewURL(currentAuthPhotoURL);
          setAvatarKey(Date.now()); 
        }
      }
    } else {
      form.reset({ displayName: "", occupation: "", otherOccupation: "", bio: "", website: "" });
      setPreviewURL(null);
      if (selectedFile) setSelectedFile(null);
      setAvatarKey(Date.now());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedFile, form.reset]); // form.getValues might not be needed if defaultValues handles new fields fine

  useEffect(() => {
    let objectUrl: string | undefined;
    if (selectedFile) {
      objectUrl = URL.createObjectURL(selectedFile);
      setPreviewURL(objectUrl);
      setAvatarKey(Date.now()); 
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedFile]);


  async function onProfileSubmit(data: ProfileFormData) {
    if (!user) return;
    setIsProfileUpdating(true);

    const profileAuthUpdates: { displayName?: string } = {};
    if (data.displayName !== (user.displayName || "")) {
      profileAuthUpdates.displayName = data.displayName;
    }

    let authUpdateSuccess = true;
    if (Object.keys(profileAuthUpdates).length > 0) {
      authUpdateSuccess = await updateUserProfile(profileAuthUpdates);
    }

    if (authUpdateSuccess) {
      const finalOccupation = data.occupation === 'other' ? data.otherOccupation : data.occupation;
      console.log("Profile details submitted (new fields for Firestore):", {
        occupation: finalOccupation,
        bio: data.bio,
        website: data.website,
      });
      // If only displayName was changed and saved
      if (Object.keys(profileAuthUpdates).length > 0 && !data.bio && !data.website && !finalOccupation) {
        toast({ title: "Display Name Updated", description: "Your display name has been successfully updated." });
      } else {
         toast({ title: "Profile Details Saved", description: "Your display name has been updated. Other details logged (requires backend)." });
      }
      form.reset(data, { keepDirty: false }); // Reset with new data to clear dirty state
    } else if (Object.keys(profileAuthUpdates).length > 0) {
        toast({ title: "Update Failed", description: "Could not update your display name.", variant: "destructive"});
    }
    setIsProfileUpdating(false);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({title: "Invalid File Type", description: "Please select an image (JPEG, PNG, GIF, WebP).", variant: "destructive"});
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({title: "File Too Large", description: "Maximum photo size is 5MB.", variant: "destructive"});
        return;
      }
      setSelectedFile(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile || !user) return;
    setIsPhotoUploading(true);
    const success = await updateUserPhotoURL(selectedFile);
    if (success) {
      setSelectedFile(null); 
      setAvatarKey(Date.now()); 
    }
    setIsPhotoUploading(false);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

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
  
  return (
    <Card className="w-full shadow-xl overflow-hidden">
      <CardHeader className="p-6 border-b">
         <CardTitle className="text-2xl font-semibold flex items-center">
            <UserIcon className="mr-3 h-6 w-6 text-primary" /> {/* Changed icon */}
            Profile Information
        </CardTitle>
        <CardDescription className="text-base">Update your display name, photo, and other personal details.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onProfileSubmit)}>
            <CardContent className="space-y-8 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group">
                        <Avatar key={avatarKey} className="h-32 w-32 cursor-pointer ring-4 ring-primary/20 hover:ring-primary/40 transition-all duration-300" onClick={triggerFileSelect} data-ai-hint="user avatar">
                            <AvatarImage src={previewURL || undefined} alt={user?.displayName || user?.email || "User"} />
                            <AvatarFallback className="text-4xl bg-muted">{getInitials(user?.displayName, user?.email)}</AvatarFallback>
                        </Avatar>
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                            onClick={triggerFileSelect}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileSelect();}}
                            aria-label="Change profile picture"
                        >
                            <Edit3 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <p className="mt-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">Change</p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            id="profile-picture-input"
                        />
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        {selectedFile ? (
                        <div className="flex flex-col items-center sm:items-start gap-2">
                            <p className="text-sm text-muted-foreground">New: {selectedFile.name}</p>
                            <Button onClick={handlePhotoUpload} disabled={isPhotoUploading} size="sm">
                            {isPhotoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                            Upload Photo
                            </Button>
                        </div>
                        ) : (
                            <Button variant="outline" onClick={triggerFileSelect} size="sm">
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
                        <Input placeholder="Your Name" {...field} className="text-base" disabled={isProfileUpdating}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Occupation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select an occupation..." />
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

                {watchedOccupation === 'other' && (
                  <FormField
                    control={form.control}
                    name="otherOccupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Please specify your occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., UX Researcher" {...field} className="text-base" disabled={isProfileUpdating} />
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
                        <Textarea placeholder="Tell us a little about yourself..." {...field} className="text-base min-h-[100px]" disabled={isProfileUpdating}/>
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
                        <Input type="url" placeholder="https://your-website.com" {...field} className="text-base" disabled={isProfileUpdating}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                    <FormLabel className="text-base">Current Email Address</FormLabel>
                    <Input type="email" value={user?.email || ""} disabled className="bg-muted/50 cursor-not-allowed border-input/50 text-base"/>
                    <Alert variant="default" className="mt-2 text-sm text-muted-foreground p-3">
                        <Info className="h-4 w-4 !top-3.5 !left-3.5" />
                        <AlertDescription className="!pl-6">
                            To change your email address, please use the "Account Settings" tab.
                        </AlertDescription>
                    </Alert>
                </FormItem>
            </CardContent>
            <CardFooter className="bg-muted/30 p-6 sm:p-8 border-t">
            <Button 
                type="submit" 
                className="w-full sm:w-auto" 
                disabled={isProfileUpdating || !form.formState.isDirty}
            >
                {isProfileUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile Details
            </Button>
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

