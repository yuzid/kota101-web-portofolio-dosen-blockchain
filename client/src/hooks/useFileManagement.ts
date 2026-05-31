import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface FileVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  isCurrent: boolean;
}

export interface ManagedFile {
  id: string;
  name: string;
  currentVersion: number;
  versions: FileVersion[];
  type: string;
  totalSize: number;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

export interface StorageQuota {
  used: number; // in bytes
  total: number; // in bytes
  percentage: number;
}

const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024 * 1024; // 5GB default

export function useFileManagement() {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [storageQuota, setStorageQuota] = useState<StorageQuota>({
    used: 0,
    total: STORAGE_QUOTA_BYTES,
    percentage: 0,
  });

  // Upload new file
  const uploadFile = useCallback(async (file: File, uploadedBy: string): Promise<string | null> => {
    try {
      // Check quota
      if (storageQuota.used + file.size > storageQuota.total) {
        toast.error('Kuota storage tidak cukup!');
        return null;
      }

      // Simulate file upload
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const versionId = `ver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      // Create mock URL (in real app, this would be from server/storage)
      const mockUrl = URL.createObjectURL(file);

      const newVersion: FileVersion = {
        id: versionId,
        versionNumber: 1,
        fileName: file.name,
        fileSize: file.size,
        uploadedBy,
        uploadedAt: now,
        url: mockUrl,
        isCurrent: true,
      };

      const newFile: ManagedFile = {
        id: fileId,
        name: file.name,
        currentVersion: 1,
        versions: [newVersion],
        type: file.type,
        totalSize: file.size,
        createdBy: uploadedBy,
        createdAt: now,
        lastModified: now,
      };

      setFiles((prev) => [...prev, newFile]);
      updateStorageQuota(storageQuota.used + file.size);

      toast.success(`File "${file.name}" berhasil diupload`);
      return fileId;
    } catch (error) {
      toast.error('Gagal upload file');
      console.error(error);
      return null;
    }
  }, [storageQuota]);

  // Upload new version of existing file
  const uploadNewVersion = useCallback(async (
    fileId: string,
    newFile: File,
    uploadedBy: string
  ): Promise<boolean> => {
    try {
      const existingFile = files.find(f => f.id === fileId);
      if (!existingFile) {
        toast.error('File tidak ditemukan');
        return false;
      }

      // Check quota
      if (storageQuota.used + newFile.size > storageQuota.total) {
        toast.error('Kuota storage tidak cukup!');
        return false;
      }

      const versionId = `ver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const mockUrl = URL.createObjectURL(newFile);

      const newVersion: FileVersion = {
        id: versionId,
        versionNumber: existingFile.currentVersion + 1,
        fileName: newFile.name,
        fileSize: newFile.size,
        uploadedBy,
        uploadedAt: now,
        url: mockUrl,
        isCurrent: true,
      };

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                currentVersion: newVersion.versionNumber,
                versions: [
                  ...f.versions.map(v => ({ ...v, isCurrent: false })),
                  newVersion,
                ],
                totalSize: f.totalSize + newFile.size,
                lastModified: now,
              }
            : f
        )
      );

      updateStorageQuota(storageQuota.used + newFile.size);
      toast.success(`Versi baru "${newFile.name}" berhasil diupload`);
      return true;
    } catch (error) {
      toast.error('Gagal upload versi baru');
      console.error(error);
      return false;
    }
  }, [files, storageQuota]);

  // Restore specific version
  const restoreVersion = useCallback((fileId: string, versionId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;

        const targetVersion = f.versions.find(v => v.id === versionId);
        if (!targetVersion) return f;

        return {
          ...f,
          currentVersion: targetVersion.versionNumber,
          versions: f.versions.map(v => ({
            ...v,
            isCurrent: v.id === versionId,
          })),
          lastModified: new Date().toISOString(),
        };
      })
    );

    toast.success('Versi berhasil dipulihkan');
  }, []);

  // Delete file
  const deleteFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    updateStorageQuota(storageQuota.used - file.totalSize);
    toast.success('File berhasil dihapus');
  }, [files, storageQuota]);

  // Delete specific version
  const deleteVersion = useCallback((fileId: string, versionId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;

        const versionToDelete = f.versions.find(v => v.id === versionId);
        if (!versionToDelete || versionToDelete.isCurrent) {
          toast.error('Tidak bisa hapus versi yang sedang aktif');
          return f;
        }

        const newVersions = f.versions.filter(v => v.id !== versionId);
        const newTotalSize = f.totalSize - versionToDelete.fileSize;

        updateStorageQuota(storageQuota.used - versionToDelete.fileSize);

        return {
          ...f,
          versions: newVersions,
          totalSize: newTotalSize,
        };
      })
    );

    toast.success('Versi berhasil dihapus');
  }, [storageQuota]);

  // Bulk download files
  const bulkDownload = useCallback(async (fileIds: string[]) => {
    try {
      const filesToDownload = files.filter(f => fileIds.includes(f.id));

      if (filesToDownload.length === 0) {
        toast.error('Tidak ada file yang dipilih');
        return;
      }

      // In real app, this would create a ZIP file on server
      // For now, just download each file individually
      for (const file of filesToDownload) {
        const currentVersion = file.versions.find(v => v.isCurrent);
        if (currentVersion) {
          const link = document.createElement('a');
          link.href = currentVersion.url;
          link.download = currentVersion.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      toast.success(`${filesToDownload.length} file berhasil didownload`);
    } catch (error) {
      toast.error('Gagal download file');
      console.error(error);
    }
  }, [files]);

  // Get file by ID
  const getFile = useCallback((fileId: string): ManagedFile | undefined => {
    return files.find(f => f.id === fileId);
  }, [files]);

  // Update storage quota
  const updateStorageQuota = useCallback((usedBytes: number) => {
    setStorageQuota({
      used: usedBytes,
      total: STORAGE_QUOTA_BYTES,
      percentage: (usedBytes / STORAGE_QUOTA_BYTES) * 100,
    });
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  return {
    files,
    storageQuota,
    uploadFile,
    uploadNewVersion,
    restoreVersion,
    deleteFile,
    deleteVersion,
    bulkDownload,
    getFile,
    formatFileSize,
  };
}
