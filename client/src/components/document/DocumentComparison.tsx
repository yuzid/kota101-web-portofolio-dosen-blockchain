import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { GitCompare, FileText, Calendar, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  version?: number;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
}

interface ComparisonResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  field: string;
  oldValue?: string;
  newValue?: string;
}

interface DocumentComparisonProps {
  documents: Document[];
}

export function DocumentComparison({ documents }: DocumentComparisonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [document1Id, setDocument1Id] = useState<string>('');
  const [document2Id, setDocument2Id] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);

  const handleCompare = async () => {
    if (!document1Id || !document2Id) {
      toast.error('Pilih kedua dokumen untuk dibandingkan');
      return;
    }

    if (document1Id === document2Id) {
      toast.error('Pilih dokumen yang berbeda');
      return;
    }

    setIsComparing(true);

    // Simulate comparison
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock comparison results
    const mockResults: ComparisonResult[] = [
      { type: 'unchanged', field: 'Judul Dokumen', oldValue: 'Laporan Penelitian', newValue: 'Laporan Penelitian' },
      { type: 'modified', field: 'Tanggal', oldValue: '15 Januari 2026', newValue: '20 Januari 2026' },
      { type: 'modified', field: 'Halaman', oldValue: '45 halaman', newValue: '52 halaman' },
      { type: 'added', field: 'Lampiran', newValue: '3 lampiran baru' },
      { type: 'modified', field: 'Kesimpulan', oldValue: 'Versi lama', newValue: 'Versi terbaru dengan revisi' },
      { type: 'unchanged', field: 'Penulis', oldValue: 'Dr. John Doe', newValue: 'Dr. John Doe' },
    ];

    setComparisonResults(mockResults);
    setIsComparing(false);
    toast.success('Perbandingan selesai');
  };

  const selectedDoc1 = documents.find((d) => d.id === document1Id);
  const selectedDoc2 = documents.find((d) => d.id === document2Id);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'removed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'modified':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChangeBadge = (type: string) => {
    switch (type) {
      case 'added':
        return <Badge className="bg-green-500">Ditambahkan</Badge>;
      case 'removed':
        return <Badge className="bg-red-500">Dihapus</Badge>;
      case 'modified':
        return <Badge className="bg-orange-500">Diubah</Badge>;
      default:
        return <Badge variant="secondary">Sama</Badge>;
    }
  };

  const changeCount = {
    added: comparisonResults.filter((r) => r.type === 'added').length,
    removed: comparisonResults.filter((r) => r.type === 'removed').length,
    modified: comparisonResults.filter((r) => r.type === 'modified').length,
    unchanged: comparisonResults.filter((r) => r.type === 'unchanged').length,
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        <GitCompare className="w-4 h-4 mr-2" />
        Bandingkan Dokumen
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Bandingkan Dokumen
            </DialogTitle>
            <DialogDescription>
              Pilih dua dokumen untuk melihat perbedaan antara keduanya
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Document Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dokumen 1 (Lama)</Label>
                <Select value={document1Id} onValueChange={setDocument1Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dokumen" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                        {doc.version && ` (v${doc.version})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDoc1 && (
                  <Card className="mt-2">
                    <CardContent className="p-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium truncate">{selectedDoc1.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        {selectedDoc1.uploadedBy}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(selectedDoc1.uploadedAt), 'dd MMM yyyy, HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-2">
                <Label>Dokumen 2 (Baru)</Label>
                <Select value={document2Id} onValueChange={setDocument2Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dokumen" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                        {doc.version && ` (v${doc.version})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDoc2 && (
                  <Card className="mt-2">
                    <CardContent className="p-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium truncate">{selectedDoc2.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        {selectedDoc2.uploadedBy}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(selectedDoc2.uploadedAt), 'dd MMM yyyy, HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <Button
              onClick={handleCompare}
              disabled={!document1Id || !document2Id || isComparing}
              className="w-full"
            >
              {isComparing ? 'Membandingkan...' : 'Mulai Perbandingan'}
            </Button>

            {/* Comparison Results */}
            {comparisonResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Hasil Perbandingan</h3>
                  <div className="flex gap-2">
                    {changeCount.added > 0 && (
                      <Badge className="bg-green-500">{changeCount.added} ditambahkan</Badge>
                    )}
                    {changeCount.modified > 0 && (
                      <Badge className="bg-orange-500">{changeCount.modified} diubah</Badge>
                    )}
                    {changeCount.removed > 0 && (
                      <Badge className="bg-red-500">{changeCount.removed} dihapus</Badge>
                    )}
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {comparisonResults.map((result, index) => (
                        <div key={index} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getChangeIcon(result.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{result.field}</span>
                                {getChangeBadge(result.type)}
                              </div>

                              {result.type !== 'unchanged' && (
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  {result.oldValue && (
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">Sebelum</Label>
                                      <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                                        {result.oldValue}
                                      </div>
                                    </div>
                                  )}
                                  {result.newValue && (
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">Sesudah</Label>
                                      <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                        {result.newValue}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {result.type === 'unchanged' && (
                                <p className="text-sm text-muted-foreground">{result.oldValue}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
