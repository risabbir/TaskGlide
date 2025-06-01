
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
import { Loader2, UploadCloud, Edit3, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required.").max(50, "Display name is too long."),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateUserProfile, updateUserPhotoURL } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isDisplayNameUpdating, setIsDisplayNameUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Key to force Avatar re-render

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
      if (user.photoURL && !selectedFile) { // Only update if not currently selecting a new file
        setPreviewURL(user.photoURL);
        setAvatarKey(Date.now()); // Update key if user.photoURL changes from context
      } else if (!user.photoURL && !selectedFile) {
        setPreviewURL(null);
      }
    }
  }, [user, form, selectedFile]); // Added selectedFile to dependencies

  useEffect(() => {
    if (!selectedFile) {
      // If no file is selected, preview should be the user's current photoURL (handled by above useEffect)
      // or null if they don't have one.
      // Ensure avatarKey is also updated if user.photoURL was the source.
      if (previewURL === user?.photoURL) {
        // No need to update avatarKey here if it's already reflecting user.photoURL
      }
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewURL(objectUrl);
    setAvatarKey(Date.now()); // New local preview, update key
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile, user?.photoURL, previewURL]);


  async function onDisplayNameSubmit(data: ProfileFormData) {
    if (!user) return;
    setIsDisplayNameUpdating(true);
    const success = await updateUserProfile({ displayName: data.displayName });
    if (success) {
      form.reset({ displayName: data.displayName }, { keepDirty: false });
    }
    setIsDisplayNameUpdating(false);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        alert('Invalid file type. Please select an image (JPEG, PNG, GIF, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File is too large. Maximum size is 5MB.');
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
      // user.photoURL will update via context, triggering the other useEffect
      // which will set previewURL and update avatarKey.
      // Explicitly setting avatarKey here as well to be certain if context update is too slow for immediate feedback.
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

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please sign in to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl overflow-hidden">
      <CardHeader className="items-center text-center bg-card pt-8 pb-6 border-b">
        <div className="relative group mb-3">
          <Avatar key={avatarKey} className="h-32 w-32 cursor-pointer ring-4 ring-primary/20 ring-offset-4 ring-offset-card shadow-lg hover:ring-primary/40 transition-all duration-300" onClick={triggerFileSelect} data-ai-hint="user avatar">
            <AvatarImage src={previewURL || undefined} alt={user.displayName || user.email || "User"} />
            <AvatarFallback className="text-4xl">{getInitials(user.displayName, user.email)}</AvatarFallback>
          </Avatar>
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            onClick={triggerFileSelect}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileSelect();}}
            aria-label="Change profile picture"
          >
            <Edit3 className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            id="profile-picture-input"
            aria-labelledby="profile-picture-label"
        />
        {selectedFile && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">New photo: {selectedFile.name}</p>
            <Button onClick={handlePhotoUpload} disabled={isPhotoUploading} size="sm">
              {isPhotoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Save Photo
            </Button>
          </div>
        )}
         {!selectedFile && (
            <p id="profile-picture-label" className="text-sm text-muted-foreground mt-2 group-hover:text-primary transition-colors">Click avatar to change photo</p>
        )}
        <CardTitle className="text-2xl font-semibold mt-4">Account Details</CardTitle>
        <CardDescription className="text-base">Manage your display name and view your email.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onDisplayNameSubmit)}>
          <CardContent className="space-y-6 p-6 sm:p-8">
             <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} className="text-base" disabled={isDisplayNameUpdating}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel className="text-base">Email Address</FormLabel>
              <Input type="email" value={user.email || ""} disabled className="bg-muted/50 cursor-not-allowed border-input/50 text-base"/>
               <Alert variant="default" className="mt-2 text-sm text-muted-foreground p-3">
                  <Info className="h-4 w-4 !top-3.5 !left-3.5" />
                  <AlertDescription className="!pl-6">
                    Your email address is used for signing in and cannot be changed here.
                  </AlertDescription>
                </Alert>
            </FormItem>
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 sm:p-8 border-t">
            <Button type="submit" className="w-full sm:w-auto" disabled={isDisplayNameUpdating || !form.formState.isDirty}>
              {isDisplayNameUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Display Name
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
