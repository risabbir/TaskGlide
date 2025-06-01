
"use client";

import { useForm, Controller } from "react-hook-form";
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
import { Loader2, UploadCloud, Edit3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState, useRef } from "react";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required.").max(50, "Display name is too long."),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateUserProfile, updateUserPhotoURL, loading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


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
      if (user.photoURL) {
        setPreviewURL(user.photoURL); 
      } else {
        setPreviewURL(null);
      }
    }
  }, [user, form]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewURL(user?.photoURL || null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewURL(objectUrl);
    return () => URL.revokeObjectURL(objectUrl); 
  }, [selectedFile, user?.photoURL]);


  async function onDisplayNameSubmit(data: ProfileFormData) {
    if (!user) return;
    const success = await updateUserProfile({ displayName: data.displayName });
    if (success) {
      form.reset({ displayName: data.displayName }, { keepDirty: false }); 
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile || !user) return;
    setIsPhotoUploading(true);
    const success = await updateUserPhotoURL(selectedFile);
    if (success) {
      setSelectedFile(null); 
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
          <Avatar className="h-32 w-32 cursor-pointer ring-2 ring-primary/30 ring-offset-4 ring-offset-card shadow-lg hover:ring-primary transition-all duration-300" onClick={triggerFileSelect} data-ai-hint="user avatar">
            <AvatarImage src={previewURL || undefined} alt={user.displayName || user.email || "User"} />
            <AvatarFallback className="text-4xl">{getInitials(user.displayName, user.email)}</AvatarFallback>
          </Avatar>
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            onClick={triggerFileSelect}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileSelect();}}
            aria-label="Change profile picture"
          >
            <Edit3 className="h-10 w-10 text-white" />
          </div>
        </div>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
            id="profile-picture-input"
        />
        {selectedFile && (
          <Button onClick={handlePhotoUpload} disabled={isPhotoUploading || loading} size="sm" className="mt-3">
            {isPhotoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Save Photo
          </Button>
        )}
        <CardTitle className="text-2xl font-semibold mt-4">Account Details</CardTitle>
        <CardDescription className="text-base">Manage your display name and view your email.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onDisplayNameSubmit)}>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <FormItem>
              <FormLabel className="text-base">Email Address</FormLabel>
              <Input type="email" value={user.email || ""} disabled className="bg-muted/50 cursor-not-allowed border-input/50 text-base"/>
              <p className="text-xs text-muted-foreground mt-1">Your email address cannot be changed here.</p>
              <FormMessage />
            </FormItem>
            
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} className="text-base"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 sm:p-8 border-t">
            <Button type="submit" className="w-full sm:w-auto" disabled={loading || !form.formState.isDirty || isPhotoUploading}>
              {(loading && !isPhotoUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Display Name
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
