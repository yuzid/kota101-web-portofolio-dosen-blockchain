import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Share2, Link2, Copy, Mail, Users, X, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SharedUser {
  id: string;
  name: string;
  email: string;
  permission: 'view' | 'comment' | 'edit';
  sharedAt: string;
}

interface DocumentSharingProps {
  documentId: string;
  documentName: string;
  iconOnly?: boolean;
  hideButton?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DocumentSharing({ documentId, documentName, iconOnly = false, hideButton = false, open, onOpenChange }: DocumentSharingProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const showDialog = open !== undefined ? open : internalOpen;
  const setShowDialog = onOpenChange || setInternalOpen;
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [linkSharing, setLinkSharing] = useState(false);
  const [linkExpiry, setLinkExpiry] = useState<string>('7d');
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([
    {
      id: '1',
      name: 'Dr. Ahmad Fauzi',
      email: 'ahmad.fauzi@polban.ac.id',
      permission: 'edit',
      sharedAt: '2026-05-10T10:00:00',
    },
    {
      id: '2',
      name: 'Dr. Siti Nurhaliza',
      email: 'siti.nurhaliza@polban.ac.id',
      permission: 'view',
      sharedAt: '2026-05-12T14:30:00',
    },
  ]);

  const handleShare = () => {
    if (!shareEmail) {
      toast.error('Masukkan email penerima');
      return;
    }

    // Check if already shared
    if (sharedUsers.some((u) => u.email === shareEmail)) {
      toast.error('Dokumen sudah dibagikan ke email ini');
      return;
    }

    const newSharedUser: SharedUser = {
      id: `user-${Date.now()}`,
      name: shareEmail.split('@')[0],
      email: shareEmail,
      permission: sharePermission,
      sharedAt: new Date().toISOString(),
    };

    setSharedUsers([...sharedUsers, newSharedUser]);
    setShareEmail('');
    toast.success(`Dokumen berhasil dibagikan ke ${shareEmail}`);
  };

  const handleRemoveShare = (userId: string) => {
    setRemoveTargetId(userId);
    setShowRemoveDialog(true);
  };

  const confirmRemoveShare = () => {
    if (!removeTargetId) return;
    setSharedUsers(sharedUsers.filter((u) => u.id !== removeTargetId));
    toast.success('Akses dibatalkan');
    setShowRemoveDialog(false);
    setRemoveTargetId(null);
  };

  const handleUpdatePermission = (userId: string, permission: 'view' | 'comment' | 'edit') => {
    setSharedUsers(
      sharedUsers.map((u) => (u.id === userId ? { ...u, permission } : u))
    );
    toast.success('Izin akses diperbarui');
  };

  const handleCopyLink = () => {
    const link = `https://portofolio.polban.ac.id/shared/${documentId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link berhasil disalin ke clipboard');
  };

  const handleGenerateShareLink = () => {
    setLinkSharing(true);
    toast.success('Link berbagi diaktifkan', {
      description: 'Siapapun dengan link ini dapat mengakses dokumen',
    });
  };

  const removeTargetUser = removeTargetId ? sharedUsers.find(u => u.id === removeTargetId) : null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case 'view':
        return <Badge variant="secondary">Lihat</Badge>;
      case 'comment':
        return <Badge className="bg-blue-500">Komentar</Badge>;
      case 'edit':
        return <Badge className="bg-green-500">Edit</Badge>;
      default:
        return <Badge variant="secondary">{permission}</Badge>;
    }
  };

  return (
    <>
      {!hideButton && (
        <Button variant={iconOnly ? "ghost" : "outline"} size={iconOnly ? "sm" : "default"} onClick={() => setShowDialog(true)}>
          <Share2 className="w-4 h-4" />
          {!iconOnly && <span className="ml-2">Bagikan</span>}
        </Button>
      )}

      {/* Remove Share Confirmation */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akses?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akses <strong>{removeTargetUser?.name}</strong> ({removeTargetUser?.email}) dari dokumen ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveShare} className="bg-destructive hover:bg-destructive/90">
              Hapus Akses
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Bagikan Dokumen
            </DialogTitle>
            <DialogDescription>"{documentName}"</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add People */}
            <div className="space-y-3">
              <Label>Bagikan ke Orang</Label>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    type="email"
                    placeholder="Masukkan email..."
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleShare();
                      }
                    }}
                  />
                </div>
                <Select value={sharePermission} onValueChange={(value: any) => setSharePermission(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Lihat saja</SelectItem>
                    <SelectItem value="comment">Bisa komentar</SelectItem>
                    <SelectItem value="edit">Bisa edit</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleShare}>
                  <Mail className="w-4 h-4 mr-2" />
                  Kirim
                </Button>
              </div>
            </div>

            {/* Shared Users List */}
            {sharedUsers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Label>Orang yang Memiliki Akses ({sharedUsers.length})</Label>
                </div>
                <div className="border rounded-lg divide-y">
                  {sharedUsers.map((user) => (
                    <div key={user.id} className="p-3 flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Select
                        value={user.permission}
                        onValueChange={(value: any) => handleUpdatePermission(user.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">Lihat saja</SelectItem>
                          <SelectItem value="comment">Bisa komentar</SelectItem>
                          <SelectItem value="edit">Bisa edit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveShare(user.id)}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share Link */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <Label>Link Berbagi</Label>
                </div>
                {!linkSharing ? (
                  <Button variant="outline" size="sm" onClick={handleGenerateShareLink}>
                    Buat Link
                  </Button>
                ) : (
                  <Badge className="bg-green-500">
                    <Check className="w-3 h-3 mr-1" />
                    Aktif
                  </Badge>
                )}
              </div>

              {linkSharing && (
                <>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`https://portofolio.polban.ac.id/shared/${documentId}`}
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" onClick={handleCopyLink}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Link kadaluarsa dalam:</Label>
                    <Select value={linkExpiry} onValueChange={setLinkExpiry}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1d">1 hari</SelectItem>
                        <SelectItem value="7d">7 hari</SelectItem>
                        <SelectItem value="30d">30 hari</SelectItem>
                        <SelectItem value="never">Tidak pernah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                    <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <p className="text-orange-900">
                      Siapapun dengan link ini dapat melihat dokumen
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
