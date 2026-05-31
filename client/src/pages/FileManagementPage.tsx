import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { FileUploader } from '../components/file/FileUploader';
import { StorageQuota } from '../components/file/StorageQuota';
import { FileVersionHistory } from '../components/file/FileVersionHistory';
import { BulkDownloadButton } from '../components/file/BulkDownloadButton';
import { useFileManagement } from '../hooks/useFileManagement';
import {
  Search, Upload, FileText, Eye, History, Trash2,
  X, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function FileManagementPage() {
  const navigate = useNavigate();
  const {
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
  } = useFileManagement();

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock user for demo
  const user = { name: 'Dr. John Doe' };

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || file.type.includes(filterType);
    return matchesSearch && matchesType;
  });

  const hasActiveFilters = searchTerm !== '' || filterType !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
  };

  const handleFilesSelected = async (files: File[]) => {
    for (const file of files) {
      await uploadFile(file, user.name);
    }
  };

  const handleNewVersionSelected = async (files: File[]) => {
    if (!selectedFileId || files.length === 0) return;

    const success = await uploadNewVersion(selectedFileId, files[0], user.name);
    if (success) {
      setShowNewVersionDialog(false);
      setSelectedFileId(null);
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    if (!selectedFileId) return;
    restoreVersion(selectedFileId, versionId);
  };

  const handleDeleteVersion = (versionId: string) => {
    if (!selectedFileId) return;
    deleteVersion(selectedFileId, versionId);
  };

  const handleDeleteFile = (fileId: string) => {
    deleteFile(fileId);
  };

  const handleDownloadVersion = (version: any) => {
    const link = document.createElement('a');
    link.href = version.url;
    link.download = version.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Download "${version.fileName}" dimulai`);
  };

  const handleBulkDownload = (fileIds: string[]) => {
    bulkDownload(fileIds);
  };

  const selectedFile = selectedFileId ? getFile(selectedFileId) : null;

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const getCurrentVersion = (file: any) => {
    return file.versions.find((v: any) => v.isCurrent);
  };

  return (
    <MainLayout
      title="Manajemen File"
      breadcrumbs={[
        { label: 'Beranda', path: '/dashboard' },
        { label: 'Manajemen File' },
      ]}
    >
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manajemen File</h2>
            <p className="text-sm text-muted-foreground">
              Upload, kelola versi, dan download file dengan mudah
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload File Baru
          </Button>
        </div>

        {/* Storage Quota */}
        <StorageQuota
          used={storageQuota.used}
          total={storageQuota.total}
          percentage={storageQuota.percentage}
        />

        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama file..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tipe File" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Gambar</SelectItem>
                  <SelectItem value="word">Dokumen Word</SelectItem>
                </SelectContent>
              </Select>

              <BulkDownloadButton
                fileIds={filteredFiles.map((f) => f.id)}
                fileNames={filteredFiles.map((f) => f.name)}
                onDownload={handleBulkDownload}
              />

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Reset Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Files Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama File</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Versi</TableHead>
                  <TableHead>Ukuran Total</TableHead>
                  <TableHead>Terakhir Diubah</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="w-8 h-8" />
                        <p>
                          {files.length === 0
                            ? 'Belum ada file. Upload file pertama Anda!'
                            : 'Tidak ada file yang sesuai dengan filter'}
                        </p>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={resetFilters}>
                            Reset Filter
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFiles.map((file) => {
                    const currentVersion = getCurrentVersion(file);
                    return (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileTypeIcon(file.type)}
                            <span className="font-medium">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {file.type.split('/').pop()?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">v{file.currentVersion}</span>
                            {file.versions.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {file.versions.length} versi
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(file.totalSize)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(file.lastModified), 'dd MMM yyyy, HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm">{file.createdBy}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {currentVersion && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadVersion(currentVersion)}
                                title="Download"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFileId(file.id);
                                setShowVersionDialog(true);
                              }}
                              title="Lihat riwayat versi"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFileId(file.id);
                                setShowNewVersionDialog(true);
                              }}
                              title="Upload versi baru"
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id)}
                              title="Hapus file"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Statistics */}
        {files.length > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total File</p>
                  <p className="text-2xl font-bold">{files.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Versi</p>
                  <p className="text-2xl font-bold">
                    {files.reduce((sum, f) => sum + f.versions.length, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Storage Terpakai</p>
                  <p className="text-2xl font-bold">{formatFileSize(storageQuota.used)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Storage Tersisa</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(storageQuota.total - storageQuota.used)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload File Baru</DialogTitle>
            <DialogDescription>
              Upload file baru ke sistem. Anda dapat mengupload beberapa file sekaligus.
            </DialogDescription>
          </DialogHeader>

          <FileUploader onFilesSelected={handleFilesSelected} multiple={true} />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Riwayat Versi</DialogTitle>
            <DialogDescription>
              {selectedFile && `File: ${selectedFile.name}`}
            </DialogDescription>
          </DialogHeader>

          {selectedFile && (
            <FileVersionHistory
              versions={selectedFile.versions}
              onRestore={handleRestoreVersion}
              onDelete={handleDeleteVersion}
              onDownload={handleDownloadVersion}
            />
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowVersionDialog(false);
                setSelectedFileId(null);
              }}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Version Upload Dialog */}
      <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Versi Baru</DialogTitle>
            <DialogDescription>
              {selectedFile && `Upload versi baru untuk: ${selectedFile.name}`}
            </DialogDescription>
          </DialogHeader>

          <FileUploader onFilesSelected={handleNewVersionSelected} multiple={false} />

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-blue-900">
              Versi saat ini tidak akan dihapus dan masih bisa diakses dari riwayat versi
            </span>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewVersionDialog(false);
                setSelectedFileId(null);
              }}
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
