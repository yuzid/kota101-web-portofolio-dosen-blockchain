import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Upload, X, FileText, Image as ImageIcon, FileCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  multiple?: boolean;
  existingFiles?: UploadedFile[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  url?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const DEFAULT_MAX_SIZE_MB = 10;

export function FileUploader({
  onFilesSelected,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeInMB = DEFAULT_MAX_SIZE_MB,
  multiple = true,
  existingFiles = [],
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Tipe file tidak didukung. Hanya: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`;
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeInMB) {
      return `Ukuran file terlalu besar. Maksimal ${maxSizeInMB}MB`;
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const newUploadedFiles: UploadedFile[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        newUploadedFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadProgress: 0,
          status: 'error',
          errorMessage: error,
        });
      } else {
        validFiles.push(file);
        newUploadedFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadProgress: 0,
          status: 'pending',
        });
      }
    });

    setUploadedFiles([...uploadedFiles, ...newUploadedFiles]);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      // Simulate upload progress
      simulateUpload(newUploadedFiles.filter(f => f.status === 'pending'));
    }
  };

  const simulateUpload = (files: UploadedFile[]) => {
    files.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  uploadProgress: progress,
                  status: progress === 100 ? 'success' : 'uploading',
                }
              : f
          )
        );

        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 200);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    if (type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary hover:bg-muted/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          Klik untuk upload atau drag & drop file ke sini
        </p>
        <p className="text-xs text-muted-foreground">
          {acceptedTypes.map(t => t.split('/').pop()?.toUpperCase()).join(', ')} (Max. {maxSizeInMB}MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={handleFileInputChange}
        />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{uploadedFiles.length} File</p>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
            >
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {formatFileSize(file.size)}
                </p>

                {file.status === 'uploading' && (
                  <div className="space-y-1">
                    <Progress value={file.uploadProgress} className="h-1" />
                    <p className="text-xs text-muted-foreground">
                      Uploading... {file.uploadProgress}%
                    </p>
                  </div>
                )}

                {file.status === 'success' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <FileCheck className="w-3 h-3" />
                    <span className="text-xs">Upload berhasil</span>
                  </div>
                )}

                {file.status === 'error' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-xs">{file.errorMessage}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
