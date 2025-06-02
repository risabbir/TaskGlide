
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
  role: z.string().optional(), // Changed from occupation to role
  otherRole: z.string().max(100, "Role details are too long.").optional(), // Changed from otherOccupation
  bio: z.string().max(500, "Bio should not exceed 500 characters.").optional(),
  website: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)." }).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.role === 'other' && !data.otherRole?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify your role", // Updated message
      path: ["otherRole"],
    });
  }
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateUserProfile, updateUserPhotoURL, authOpLoading } = useAuth(); // Added authOpLoading
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now()); 
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
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
    // Populate form with user data if available
    if (user) {
      form.reset({ 
        displayName: user.displayName || "",
        // These would typically come from Firestore if saved there
        role: form.getValues("role") || "", 
        otherRole: form.getValues("otherRole") || "",
        bio: form.getValues("bio") || "",
        website: form.getValues("website") || "",
      });
    }
  }, [user, form.reset, form]); // form.getValues not needed if form instance is stable

  useEffect(() => {
    // Update preview URL based on selected file or user's current photoURL
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewURL(objectUrl);
      setAvatarKey(Date.now());
      return () => URL.revokeObjectURL(objectUrl);
    } else if (user?.photoURL) {
      if (previewURL !== user.photoURL) { // Only update if different
        setPreviewURL(user.photoURL);
        setAvatarKey(Date.now());
      }
    } else {
        if (previewURL !== null) { // Only update if different
            setPreviewURL(null);
            setAvatarKey(Date.now());
        }
    }
  }, [selectedFile, user, previewURL]);


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
      const finalRole = data.role === 'other' ? data.otherRole : data.role;
      // Placeholder for saving additional fields to Firestore
      console.log("Additional profile details to save to Firestore:", {
        role: finalRole,
        bio: data.bio,
        website: data.website,
      });
      
      if (Object.keys(profileAuthUpdates).length > 0 && !data.bio && !data.website && !finalRole) {
        toast({ title: "Display Name Updated", description: "Your display name has been successfully updated." });
      } else {
         toast({ title: "Profile Details Saved", description: "Your profile details have been submitted." });
      }
      form.reset(data, { keepDirty: false }); 
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
    // authOpLoading is used by context for its operations
    const success = await updateUserPhotoURL(selectedFile);
    if (success) {
      setSelectedFile(null); // Clear selected file, useEffect will update previewURL to user.photoURL
      // setAvatarKey(Date.now()); // useEffect for previewURL already handles this
    }
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
  
  const isLoading = authOpLoading || isProfileUpdating;

  return (
    <Card className="w-full shadow-xl overflow-hidden">
      <CardHeader className="p-6 border-b">
         <CardTitle className="text-xl font-semibold flex items-center"> {/* Adjusted size */}
            <UserIcon className="mr-3 h-5 w-5 text-primary" />
            Personal Information
        </CardTitle>
        <CardDescription className="text-sm">Update your display name, photo, and other personal details.</CardDescription> {/* Adjusted size */}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onProfileSubmit)}>
            <CardContent className="space-y-6 p-6 sm:p-8"> {/* Adjusted spacing */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group">
                        <Avatar key={avatarKey} className="h-28 w-28 sm:h-32 sm:w-32 cursor-pointer ring-4 ring-primary/20 hover:ring-primary/40 transition-all duration-300" onClick={triggerFileSelect} data-ai-hint="user avatar"> {/* Adjusted size */}
                            <AvatarImage src={previewURL || undefined} alt={user?.displayName || user?.email || "User"} />
                            <AvatarFallback className="text-3xl sm:text-4xl bg-muted">{getInitials(user?.displayName, user?.email)}</AvatarFallback> {/* Adjusted size */}
                        </Avatar>
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                            onClick={triggerFileSelect}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileSelect();}}
                            aria-label="Change profile picture"
                        >
                            <Edit3 className="h-7 w-7 sm:h-8 sm:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> {/* Adjusted size */}
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
                            <p className="text-sm text-muted-foreground truncate max-w-xs">New: {selectedFile.name}</p>
                            <Button onClick={handlePhotoUpload} disabled={authOpLoading} size="sm">
                            {authOpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                            Upload Photo
                            </Button>
                        </div>
                        ) : (
                            <Button variant="outline" onClick={triggerFileSelect} size="sm" disabled={authOpLoading}>
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
                    <FormLabel className="text-sm">Display Name</FormLabel> {/* Adjusted size */}
                    <FormControl>
                        <Input placeholder="Your Name" {...field} className="text-sm" disabled={isLoading}/> {/* Adjusted size */}
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
                      <FormLabel className="text-sm">Your Role</FormLabel> {/* Changed label */}
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger className="text-sm"> {/* Adjusted size */}
                            <SelectValue placeholder="Select your role..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OCCUPATIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-sm"> {/* Adjusted size */}
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
                        <FormLabel className="text-sm">Please specify your role</FormLabel> {/* Changed label */}
                        <FormControl>
                          <Input placeholder="E.g., UX Researcher" {...field} className="text-sm" disabled={isLoading} /> {/* Adjusted size */}
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
                      <FormLabel className="text-sm">Bio / About Me</FormLabel> {/* Adjusted size */}
                      <FormControl>
                        <Textarea placeholder="Tell us a little about yourself..." {...field} className="text-sm min-h-[100px]" disabled={isLoading}/> {/* Adjusted size */}
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
                      <FormLabel className="text-sm">Website URL</FormLabel> {/* Adjusted size */}
                      <FormControl>
                        <Input type="url" placeholder="https://your-website.com" {...field} className="text-sm" disabled={isLoading}/> {/* Adjusted size */}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                    <FormLabel className="text-sm">Current Email Address</FormLabel> {/* Adjusted size */}
                    <Input type="email" value={user?.email || ""} disabled className="bg-muted/50 cursor-not-allowed border-input/50 text-sm"/> {/* Adjusted size */}
                    <Alert variant="default" className="mt-2 text-xs text-muted-foreground p-2.5"> {/* Adjusted size and padding */}
                        <Info className="h-3.5 w-3.5 !top-3 !left-3" /> {/* Adjusted size and position */}
                        <AlertDescription className="!pl-5"> {/* Adjusted padding */}
                            To change your email address, please use the "Account Settings" tab.
                        </AlertDescription>
                    </Alert>
                </FormItem>
            </CardContent>
            <CardFooter className="bg-muted/20 p-6 sm:p-8 border-t"> {/* Subtle background */}
            <Button 
                type="submit" 
                className="w-full sm:w-auto" 
                disabled={isLoading || !form.formState.isDirty}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    