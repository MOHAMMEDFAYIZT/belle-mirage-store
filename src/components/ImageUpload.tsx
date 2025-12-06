import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  currentImage?: string;
}

export const ImageUpload = ({ onImageUpload, currentImage }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      onImageUpload(data.publicUrl);
      toast.success('Image uploaded successfully');

    } catch (error: any) {
      toast.error('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentImage && (
        <div className="relative">
          <img
            src={currentImage}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-md"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="image-upload">Upload Product Image</Label>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
        />
        <p className="text-sm text-muted-foreground">
          Supported formats: JPG, PNG, WebP. Max size: 5MB
        </p>
      </div>

      {uploading && <p>Uploading image...</p>}
    </div>
  );
};