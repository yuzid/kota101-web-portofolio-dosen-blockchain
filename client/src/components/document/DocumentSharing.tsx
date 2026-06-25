import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
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
import { Share2, Link2, Copy, Mail, Users, X } from 'lucide-react';
import { toast } from 'sonner';

interface SharedUser {
  id: string;
  name: string;
  email: string;
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

const storageKey = (docId: string) => `dokumen_share_${docId}`;

export function DocumentSharing({ documentId, documentName, iconOnly = false, hideButton = false, open, onOpenChange }: DocumentSharingProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const showDialog = open !== undefined ? open : internalOpen;
  const setShowDialog = onOpenChange || setInternalOpen;
  const [shareEmail, setShareEmail] = useState('');
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(documentId));
    if (stored) {
      try {
        setSharedUsers(JSON.parse(stored));
      } catch {}
    }
  }, [documentId]);

  useEffect(() => {
    localStorage.setItem(storageKey(documentId), JSON.stringify(sharedUsers));
  }, [sharedUsers, documentId]);

  const handleShare = () => {
    if (!shareEmail) {
      toast.error('Masukkan email penerima');
      return;
    }

    if (sharedUsers.some((u) => u.email === shareEmail)) {
      toast.error('Dokumen sudah dibagikan ke email ini');
      return;
    }

    const newSharedUser: SharedUser = {
      id: `user-${Date.now()}`,
      name: shareEmail.split('@')[0],
      email: shareEmail,
      sharedAt: new Date().toISOString(),
    };

    setSharedUsers([...sharedUsers, newSharedUser]);
    setShareEmail('');

    toast.success(
      `Undangan akan dikirim ke ${shareEmail}`,
      { description: 'Notifikasi email akan dikirimkan oleh sistem setelah backend tersedia.' }
    );
  };

  const handleRemoveShare = (userId: string) => {
    setRemoveTargetId(userId);
    setShowRemoveDialog(true);
  };

  const confirmRemoveShare = () => {
    if (!removeTargetId) return;
    const updated = sharedUsers.filter((u) => u.id !== removeTargetId);
    setSharedUsers(updated);
    localStorage.setItem(storageKey(documentId), JSON.stringify(updated));
    toast.success('Akses dibatalkan');
    setShowRemoveDialog(false);
    setRemoveTargetId(null);
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/public/dokumen/${documentId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link berhasil disalin ke clipboard');
    } catch {
      toast.info(`Link: ${link}`);
    }
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
            {/* Add People (Disabled temporarily)
            <div className="space-y-3">
              <Label>Bagikan ke Orang</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Masukkan email penerima..."
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleShare();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleShare}>
                  <Mail className="w-4 h-4 mr-2" />
                  Kirim
                </Button>
              </div>
            </div>
            */}

            {/* Shared Users List (Disabled temporarily)
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
            */}

            {/* Email notification banner (Disabled temporarily)
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-blue-900">
                Notifikasi email akan dikirimkan oleh sistem ke penerima.
              </p>
            </div>
            */}

            {/* Share Link */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <Label>Link Berbagi</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/public/dokumen/${documentId}`}
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <Link2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-blue-900">
                  Siapapun dengan link ini dapat melihat dokumen
                </p>
              </div>
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
