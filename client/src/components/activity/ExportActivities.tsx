import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportActivitiesProps {
  activityIds: string[];
  activityNames: string[];
  disabled?: boolean;
}

export function ExportActivities({
  activityIds,
  activityNames,
  disabled = false,
}: ExportActivitiesProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [includeMembers, setIncludeMembers] = useState(true);

  const handleOpenDialog = () => {
    setSelectedActivities(activityIds);
    setShowDialog(true);
  };

  const handleToggleActivity = (activityId: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleToggleAll = () => {
    if (selectedActivities.length === activityIds.length) {
      setSelectedActivities([]);
    } else {
      setSelectedActivities(activityIds);
    }
  };

  const handleExport = async () => {
    if (selectedActivities.length === 0) {
      toast.error('Pilih minimal satu kegiatan untuk diexport');
      return;
    }

    setIsExporting(true);

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const fileName = `Kegiatan_Export_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

    toast.success(`Export berhasil! File "${fileName}" sedang didownload`, {
      description: `${selectedActivities.length} kegiatan telah diexport`,
    });

    setIsExporting(false);
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenDialog}
        disabled={disabled || activityIds.length === 0}
      >
        <Download className="w-4 h-4 mr-2" />
        Export ({activityIds.length})
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Kegiatan</DialogTitle>
            <DialogDescription>
              Pilih kegiatan dan format export yang diinginkan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Format Export</Label>
              <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span>Excel (.xlsx)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-600" />
                      <span>PDF (.pdf)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <Label>Opsi Export</Label>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-members"
                  checked={includeMembers}
                  onCheckedChange={(checked) => setIncludeMembers(!!checked)}
                />
                <Label htmlFor="include-members" className="font-normal cursor-pointer">
                  Sertakan daftar anggota
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-documents"
                  checked={includeDocuments}
                  onCheckedChange={(checked) => setIncludeDocuments(!!checked)}
                />
                <Label htmlFor="include-documents" className="font-normal cursor-pointer">
                  Sertakan daftar dokumen bukti
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-history"
                  checked={includeHistory}
                  onCheckedChange={(checked) => setIncludeHistory(!!checked)}
                />
                <Label htmlFor="include-history" className="font-normal cursor-pointer">
                  Sertakan riwayat perubahan
                </Label>
              </div>
            </div>

            {/* Activity Selection */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-lg p-3">
              <div className="flex items-center gap-2 pb-2 border-b sticky top-0 bg-background">
                <Checkbox
                  id="select-all-export"
                  checked={selectedActivities.length === activityIds.length && activityIds.length > 0}
                  onCheckedChange={handleToggleAll}
                />
                <Label htmlFor="select-all-export" className="font-medium cursor-pointer">
                  Pilih Semua ({activityIds.length})
                </Label>
              </div>

              {activityIds.map((activityId, index) => (
                <div key={activityId} className="flex items-center gap-2">
                  <Checkbox
                    id={`export-${activityId}`}
                    checked={selectedActivities.includes(activityId)}
                    onCheckedChange={() => handleToggleActivity(activityId)}
                  />
                  <Label
                    htmlFor={`export-${activityId}`}
                    className="flex-1 cursor-pointer text-sm truncate"
                  >
                    {activityNames[index]}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-blue-900">
                {selectedActivities.length} kegiatan dipilih untuk diexport
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isExporting}>
              Batal
            </Button>
            <Button onClick={handleExport} disabled={selectedActivities.length === 0 || isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengexport...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export ({selectedActivities.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
