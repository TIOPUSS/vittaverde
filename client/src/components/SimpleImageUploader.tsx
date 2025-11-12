import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SimpleImageUploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
  currentImageUrl?: string;
  className?: string;
}

export function SimpleImageUploader({ 
  onImageUploaded, 
  currentImageUrl, 
  className = "" 
}: SimpleImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Imagem enviada com sucesso!",
        });
        onImageUploaded?.(result.imageUrl);
      } else {
        throw new Error(result.error || 'Falha no upload');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar imagem. Tente novamente.",
        variant: "destructive",
      });
      setPreviewUrl(currentImageUrl || "");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    onImageUploaded?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {previewUrl ? (
        <div className="relative">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-32 object-contain mx-auto rounded"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
        >
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">
            Clique para selecionar uma imagem
          </p>
          <p className="text-xs text-gray-400">
            PNG, JPG, GIF até 10MB
          </p>
        </div>
      )}

      <Button
        type="button"
        onClick={triggerFileInput}
        disabled={uploading}
        variant="outline"
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? "Enviando..." : previewUrl ? "Trocar Imagem" : "Selecionar Imagem"}
      </Button>
    </div>
  );
}