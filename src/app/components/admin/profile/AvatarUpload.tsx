"use client";

import React, { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/app/lib/utils";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useToast } from "@/app/hooks/useToast";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  adminName: string;
}

export default function AvatarUpload({ currentAvatarUrl, onUploadSuccess, adminName }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session } = useAdminAuth();
  const { showToast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Invalid file type. Please select an image.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB.", "error");
      return;
    }

    // Create a local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    if (!session?.access_token) {
      showToast("You must be logged in to upload an avatar.", "error");
      return;
    }

    try {
      setIsUploading(true);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error("Could not verify user identity.");
      
      const userId = userData.user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('admin-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('admin-avatars')
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrl);
      showToast("Profile photo updated successfully!", "success");

    } catch (error: unknown) {
      console.error("Avatar upload failed:", error);
      showToast("Failed to upload avatar. Make sure the storage bucket exists and you have permissions.", "error");
      // Revert preview on failure
      setPreviewUrl(currentAvatarUrl || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative group cursor-pointer inline-block">
      <input 
        type="file" 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-border bg-surface-elevated flex items-center justify-center relative transition-all duration-300",
          !isUploading && "group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(229,132,35,0.2)]"
        )}
      >
        {previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={previewUrl} 
            alt="Profile Avatar" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="text-3xl sm:text-4xl font-black text-primary/40 uppercase">
             {adminName?.slice(0, 2) || "AD"}
          </div>
        )}
        
        {/* Overlay */}
        <div className={cn(
          "absolute inset-0 bg-background/60 flex flex-col items-center justify-center backdrop-blur-sm opacity-0 transition-opacity duration-300",
          !isUploading && "group-hover:opacity-100",
          isUploading && "opacity-100"
        )}>
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <>
              <Camera className="w-6 h-6 text-foreground mb-1" />
              <span className="text-xs font-bold text-foreground">Change</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
