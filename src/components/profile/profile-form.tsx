
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
import { Loader2, UploadCloud, Edit3, Info, UserCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required.").max(50, "Display name is too long."),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateUserProfile, updateUserPhotoURL } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now()); 

  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isDisplayNameUpdating, setIsDisplayNameUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

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

  useEffect(() => {
    if (user) {
      form.reset({ displayName: user.displayName || "" });
      if (!selectedFile) {
        const currentAuthPhotoURL = user.photoURL || null;
        if (previewURL !== currentAuthPhotoURL) {
          setPreviewURL(currentAuthPhotoURL);
          setAvatarKey(Date.now()); 
        }
      }
    } else {
      form.reset({ displayName: "" });
      setPreviewURL(null);
      if (selectedFile) setSelectedFile(null);
      setAvatarKey(Date.now());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedFile, form.reset]);

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

  if (!user && !form.formState.isLoading) { 
    return (
      <Card className="w-full shadow-xl overflow-hidden">
        <CardHeader className="items-center text-center bg-card p-6 border-b">
          <CardTitle className="text-2xl font-semibold mt-4">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <p>Loading user profile or please sign in.</p>
        </CardContent>
      </Card>
    );
  }
  
  const currentDisplayName = form.watch("displayName");

  return (
    <Card className="w-full shadow-xl overflow-hidden">
      <CardHeader className="p-6 border-b">
         <CardTitle className="text-2xl font-semibold flex items-center">
            <UserCircle className="mr-3 h-6 w-6 text-primary" />
            Account Details
        </CardTitle>
        <CardDescription className="text-base">Update your display name, profile picture, and view your email.</CardDescription>
      </CardHeader>
      <Form {...form}>
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
                    <Input placeholder="Your Name" {...field} className="text-base" disabled={isDisplayNameUpdating}/>
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
                        To change your email address, please use the "Change Email Address" section below.
                    </AlertDescription>
                </Alert>
            </FormItem>
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 sm:p-8 border-t">
        <Button 
            type="button" 
            onClick={form.handleSubmit(onDisplayNameSubmit)}
            className="w-full sm:w-auto" 
            disabled={isDisplayNameUpdating || !form.formState.isDirty || currentDisplayName === (user?.displayName || "")}
        >
            {isDisplayNameUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Display Name
        </Button>
        </CardFooter>
      </Form>
    </Card>
  );
}
