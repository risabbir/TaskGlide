
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Though it will be hidden
import { Loader2, Edit3, UploadCloud } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProfilePictureUploaderProps {
  // No props needed as it will get user from context and update context directly
}

export function ProfilePictureUploader(props: ProfilePictureUploaderProps) {
  const { user, updateUserPhotoURL } = useAuth();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarRenderKey, setAvatarRenderKey] = useState(Date.now());


  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewURL(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewURL(null);
    }
  }, [selectedFile]);

  // This effect ensures that if the user.photoURL changes externally (e.g. another device),
  // and we are not in a local preview/upload cycle, the avatar key is updated to reflect it.
  useEffect(() => {
    if (!selectedFile && !isUploading) {
        setAvatarRenderKey(Date.now());
    }
  }, [user?.photoURL, selectedFile, isUploading]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please select an image (JPEG, PNG, GIF, WebP).", variant: "destructive" });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File Too Large", description: "Maximum photo size is 5MB.", variant: "destructive" });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile || !user) return;
    setIsUploading(true);
    try {
      const newFirebasePhotoURL = await updateUserPhotoURL(selectedFile); // This updates context
      if (newFirebasePhotoURL) {
        toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
        setSelectedFile(null); // Clear local preview
        if (fileInputRef.current) fileInputRef.current.value = "";
        setAvatarRenderKey(Date.now()); // Force Avatar to re-render with new context value
      }
      // Error toasts are handled by updateUserPhotoURL in context
    } catch (error) {
      console.error("Error during photo upload process in Uploader:", error);
      toast({ title: "Upload Failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    if (email) {
      const parts = email.split("@")[0];
      return parts ? parts.substring(0, 2).toUpperCase() : email.substring(0, 1).toUpperCase();
    }
    return "??";
  };

  const avatarSrc = previewURL || user?.photoURL || undefined;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative group">
        <Avatar
          key={avatarRenderKey} // Force re-render of Avatar if key changes
          className="h-28 w-28 sm:h-32 sm:w-32 cursor-pointer ring-4 ring-primary/20 hover:ring-primary/40 transition-all duration-300"
          onClick={!isUploading ? triggerFileSelect : undefined}
          data-ai-hint="user avatar"
        >
          <AvatarImage src={avatarSrc} alt={user?.displayName || user?.email || "User"} />
          <AvatarFallback className="text-3xl sm:text-4xl bg-muted">{getInitials(user?.displayName, user?.email)}</AvatarFallback>
        </Avatar>
        {!isUploading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            onClick={triggerFileSelect} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileSelect(); }}
            aria-label="Change profile picture"
          >
            <Edit3 className="h-7 w-7 sm:h-8 sm:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <p className="mt-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">Change</p>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        <input
          type="file" ref={fileInputRef} onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden" id="profile-picture-input-uploader" // Ensure ID is unique if multiple instances or similar inputs exist
          disabled={isUploading}
        />
      </div>
      <div className="flex-grow text-center sm:text-left">
        {selectedFile && !isUploading ? (
          <div className="flex flex-col items-center sm:items-start gap-2">
            <p className="text-sm text-muted-foreground truncate max-w-xs">New: {selectedFile.name}</p>
            <Button type="button" onClick={handlePhotoUpload} disabled={isUploading} size="sm">
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
          </div>
        ) : !isUploading ? (
          <Button type="button" variant="outline" onClick={triggerFileSelect} size="sm" disabled={isUploading}>
            <UploadCloud className="mr-2 h-4 w-4" /> Change Photo
          </Button>
        ) : (
           <Button type="button" variant="outline" size="sm" disabled={true}>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
          </Button>
        )}
        {!isUploading && <p className="text-xs text-muted-foreground mt-2">JPG, PNG, GIF, WebP. Max 5MB.</p>}
      </div>
    </div>
  );
}
