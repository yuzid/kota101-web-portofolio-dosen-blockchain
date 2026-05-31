import { useState } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Download, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';

interface BulkDownloadButtonProps {
  fileIds: string[];
  fileNames: string[];
  onDownload: (fileIds: string[]) => void;
  disabled?: boolean;
}

export function BulkDownloadButton({
  fileIds,
  fileNames,
  onDownload,
  disabled = false,
}: BulkDownloadButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const handleOpenDialog = () => {
    setSelectedFiles(fileIds);
    setShowDialog(true);
  };

  const handleToggleFile = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleToggleAll = () => {
    if (selectedFiles.length === fileIds.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(fileIds);
    }
  };

  const handleDownload = () => {
    if (selectedFiles.length === 0) {
      toast.error('Pilih minimal satu file untuk didownload');
      return;
    }

    onDownload(selectedFiles);
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenDialog}
        disabled={disabled || fileIds.length === 0}
      >
        <Download className="w-4 h-4 mr-2" />
        Download Massal ({fileIds.length})
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Download Massal</DialogTitle>
            <DialogDescription>
              Pilih file yang ingin didownload. File akan didownload satu per satu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <div className="flex items-center gap-2 p-2 border-b sticky top-0 bg-background">
              <Checkbox
                id="select-all"
                checked={selectedFiles.length === fileIds.length && fileIds.length > 0}
                onCheckedChange={handleToggleAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Pilih Semua ({fileIds.length})
              </label>
            </div>

            {fileIds.map((fileId, index) => (
              <div key={fileId} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded">
                <Checkbox
                  id={fileId}
                  checked={selectedFiles.includes(fileId)}
                  onCheckedChange={() => handleToggleFile(fileId)}
                />
                <label htmlFor={fileId} className="text-sm flex-1 cursor-pointer truncate">
                  {fileNames[index]}
                </label>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <PackageCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-blue-900">
              {selectedFiles.length} file dipilih untuk didownload
            </span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleDownload} disabled={selectedFiles.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Download ({selectedFiles.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
