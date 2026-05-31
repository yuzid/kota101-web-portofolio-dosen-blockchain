import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { HardDrive, AlertCircle } from 'lucide-react';

interface StorageQuotaProps {
  used: number; // in bytes
  total: number; // in bytes
  percentage: number;
}

export function StorageQuota({ used, total, percentage }: StorageQuotaProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = () => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusBadge = () => {
    if (percentage >= 90) {
      return (
        <Badge className="bg-red-500">
          <AlertCircle className="w-3 h-3 mr-1" />
          Hampir Penuh
        </Badge>
      );
    }
    if (percentage >= 75) {
      return (
        <Badge className="bg-orange-500">
          Perhatian
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500">
        Baik
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Kuota Penyimpanan</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Terpakai</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {formatFileSize(used)} / {formatFileSize(total)}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage.toFixed(1)}% terpakai</span>
            <span>{formatFileSize(total - used)} tersisa</span>
          </div>
        </div>

        {percentage >= 90 && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Ruang penyimpanan hampir habis</p>
              <p className="text-red-700 mt-1">
                Hapus file lama atau versi yang tidak diperlukan untuk mengosongkan ruang
              </p>
            </div>
          </div>
        )}

        {percentage >= 75 && percentage < 90 && (
          <div className="flex gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-900">
                Ruang penyimpanan sudah mencapai {percentage.toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
