
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import NextImage from 'next/image';

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, alt, ...props }, ref) => {
  // Check if src is a valid string for NextImage (URL or absolute path)
  const useNextImage = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'));

  if (useNextImage) {
    return (
      <NextImage
        // The ref for NextImage is HTMLImageElement. If AvatarPrimitive.Image expects a different ref type,
        // this could be an issue. For basic display, ref might not be strictly needed for NextImage here.
        // Consider removing ref propagation to NextImage if it causes type or runtime errors.
        // ref={ref as React.Ref<HTMLImageElement>}
        src={src}
        alt={alt || ""}
        fill
        style={{ objectFit: 'cover' }} // Ensures the image covers the avatar area
        className={cn("aspect-square h-full w-full", className)}
        // sizes attribute can be added for further optimization if avatars have varied known sizes across the app
        // e.g., sizes="(max-width: 480px) 28px, 32px" (if used in multiple places with different CSS sizes)
        // For now, 'fill' with parent sizing from Avatar component is a good start for typical avatar usage.
        key={src} // Add key prop based on src to force re-render on src change
      />
    );
  }

  // Fallback to original Radix component if src is not a string or not a typical URL/path
  // This allows AvatarPrimitive.Image to handle its own logic for fallbacks or empty src
  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
