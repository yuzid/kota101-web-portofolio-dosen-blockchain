import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import type { FileVersion } from "../../hooks/useFileManagement";
import {
  History,
  RotateCcw,
  Trash2,
  CheckCircle,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

interface FileVersionHistoryProps {
  versions: FileVersion[];
  onRestore: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  onDownload: (version: FileVersion) => void;
}

export function FileVersionHistory({
  versions,
  onRestore,
  onDelete,
  onDownload,
}: FileVersionHistoryProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<FileVersion | null>(
    null
  );

  const sortedVersions = [...versions].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleRestoreClick = (version: FileVersion) => {
    if (version.isCurrent) {
      toast.info("Versi ini sudah menjadi versi aktif");
      return;
    }
    setSelectedVersion(version);
    setShowRestoreDialog(true);
  };

  const handleDeleteClick = (version: FileVersion) => {
    if (version.isCurrent) {
      toast.error("Tidak bisa hapus versi yang sedang aktif");
      return;
    }
    setSelectedVersion(version);
    setShowDeleteDialog(true);
  };

  const handleRestore = () => {
    if (selectedVersion) {
      onRestore(selectedVersion.id);
      setShowRestoreDialog(false);
      setSelectedVersion(null);
    }
  };

  const handleDelete = () => {
    if (selectedVersion) {
      onDelete(selectedVersion.id);
      setShowDeleteDialog(false);
      setSelectedVersion(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Riwayat Versi</CardTitle>
            <Badge variant="secondary">{versions.length} Versi</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedVersions.map((version, index) => (
              <div
                key={version.id}
                className={`flex items-start gap-3 p-3 border rounded-lg ${
                  version.isCurrent
                    ? "bg-primary/5 border-primary"
                    : "bg-muted/30"
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(version.uploadedBy)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      Versi {version.versionNumber}
                    </span>
                    {version.isCurrent && (
                      <Badge className="bg-green-500 text-white text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    )}
                    {index === 0 && !version.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Terbaru
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-1">
                    {version.fileName}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{version.uploadedBy}</span>
                    <span>•</span>
                    <span>
                      {format(
                        new Date(version.uploadedAt),
                        "dd MMM yyyy, HH:mm"
                      )}
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(version.fileSize)}</span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(version)}
                    title="Download versi ini"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {!version.isCurrent && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreClick(version)}
                        title="Pulihkan versi ini"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(version)}
                        title="Hapus versi ini"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {versions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada riwayat versi</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan Versi Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Versi <strong>{selectedVersion?.versionNumber}</strong> akan
              menjadi versi aktif. Versi saat ini tidak akan dihapus dan masih
              bisa diakses dari riwayat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Pulihkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Versi Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Versi <strong>{selectedVersion?.versionNumber}</strong> akan
              dihapus permanen. Ini akan mengosongkan{" "}
              <strong>
                {selectedVersion && formatFileSize(selectedVersion.fileSize)}
              </strong>{" "}
              dari kuota penyimpanan Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
