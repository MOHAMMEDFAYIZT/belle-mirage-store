import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface MultiImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  currentImages?: string[];
}

export const MultiImageUpload = ({ onImagesChange, currentImages = [] }: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      const newImageUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          toast.error(`File ${file.name} is not an image`);
          continue;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image ${file.name} should be less than 5MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
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

        newImageUrls.push(data.publicUrl);
      }

      // Add new images to existing ones
      const allImages = [...currentImages, ...newImageUrls];
      onImagesChange(allImages);
      toast.success(`Uploaded ${newImageUrls.length} image(s) successfully`);

    } catch (error: any) {
      toast.error('Error uploading images: ' + error.message);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = currentImages.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...currentImages];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="multi-image-upload">Product Images</Label>
        <Input
          id="multi-image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          disabled={uploading}
        />
        <p className="text-sm text-muted-foreground">
          Supported formats: JPG, PNG, WebP. Max 10 images, 5MB each
        </p>
      </div>

      {uploading && <p>Uploading images...</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentImages.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image}
              alt={`Product image ${index + 1}`}
              className="w-full h-24 object-cover rounded-md border"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={() => moveImage(index, index - 1)}
                >
                  ↑
                </Button>
              )}
              {index < currentImages.length - 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={() => moveImage(index, index + 1)}
                >
                  ↓
                </Button>
              )}
            </div>
            <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
              {index + 1}
            </div>
          </div>
        ))}
        
        {currentImages.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-md p-8">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No images uploaded yet
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Upload product images to display here
            </p>
          </div>
        )}
      </div>

      {currentImages.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {currentImages.length} image(s) uploaded. Drag & drop to reorder.
        </p>
      )}
    </div>
  );
};