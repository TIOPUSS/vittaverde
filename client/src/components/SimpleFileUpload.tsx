import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Video, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SimpleFileUploadProps {
  onUploadComplete: (fileUrl: string) => void;
  accept?: string;
  maxSize?: number; // MB
  label?: string;
  currentFile?: string;
  uploadType?: 'image' | 'video' | 'document' | 'any';
}

export function SimpleFileUpload({
  onUploadComplete,
  accept = 'image/*',
  maxSize = 10,
  label = 'Arquivo',
  currentFile,
  uploadType = 'any'
}: SimpleFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentFile || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = () => {
    switch (uploadType) {
      case 'image': return ImageIcon;
      case 'video': return Video;
      case 'document': return FileText;
      default: return File;
    }
  };

  const FileIcon = getFileIcon();

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: `O arquivo deve ter no máximo ${maxSize}MB`,
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        // For non-images, just store the filename
        setPreview(file.name);
      }

      // Get upload URL from backend
      const response = await fetch('/api/upload/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) throw new Error('Failed to get upload URL');
      
      const { uploadUrl, publicUrl } = await response.json();

      // Upload file directly to storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      toast({
        title: 'Upload concluído!',
        description: 'Arquivo enviado com sucesso',
      });

      onUploadComplete(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-3">
      <label className="text-sm font-bold text-gray-700">{label}</label>
      
      {preview ? (
        <div className="relative rounded-xl border-2 border-green-200 p-3 bg-green-50">
          {preview.startsWith('data:image') ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <FileIcon className="h-6 w-6 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Arquivo enviado</p>
                <p className="text-xs text-gray-500 truncate">{preview}</p>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full"
            onClick={clearFile}
            data-testid="button-clear-file"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
            dragActive 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 bg-gray-50 hover:border-green-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
            data-testid="input-file-upload"
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4" />
                <p className="text-sm font-medium text-gray-700">Enviando arquivo...</p>
              </>
            ) : (
              <>
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Clique ou arraste o arquivo aqui
                </p>
                <p className="text-xs text-gray-500">
                  Máximo {maxSize}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
