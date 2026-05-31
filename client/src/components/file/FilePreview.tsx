import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Image as ImageIcon, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface FilePreviewProps {
  file: {
    name: string;
    type: string;
    size: number;
    url: string;
  };
  onDownload?: () => void;
}

export function FilePreview({ file, onDownload }: FilePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  const isDoc = file.type.includes('word') || file.type.includes('document');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="w-12 h-12 text-blue-500" />;
    if (isPDF) return <FileText className="w-12 h-12 text-red-500" />;
    return <FileText className="w-12 h-12 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getFileIcon()}
            <div>
              <CardTitle className="text-lg">{file.name}</CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                <Badge variant="outline">{file.type.split('/').pop()?.toUpperCase()}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {(isImage || isPDF) && (
              <>
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                {isImage && (
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-muted/30 min-h-[500px] flex items-center justify-center overflow-auto">
          {isImage && (
            <img
              src={file.url}
              alt={file.name}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
              }}
              className="max-w-full h-auto"
            />
          )}
          {isPDF && (
            <iframe
              src={file.url}
              title={file.name}
              className="w-full h-full min-h-[500px]"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
              }}
            />
          )}
          {isDoc && (
            <div className="text-center space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">Preview untuk file Word tidak tersedia</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Silakan download file untuk melihat isinya
                </p>
              </div>
              {onDownload && (
                <Button onClick={onDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              )}
            </div>
          )}
          {!isImage && !isPDF && !isDoc && (
            <div className="text-center space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">Preview tidak tersedia</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Format file ini tidak mendukung preview
                </p>
              </div>
              {onDownload && (
                <Button onClick={onDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              )}
            </div>
          )}
        </div>
        {(isImage || isPDF) && (
          <div className="flex justify-center mt-3 text-sm text-muted-foreground">
            Zoom: {zoom}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}
