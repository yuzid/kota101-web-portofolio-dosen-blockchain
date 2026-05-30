import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { UserRole } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { UserCog, Check } from "lucide-react";

const roleLabels: Record<UserRole, string> = {
  administrator: "Administrator",
  admin_tu: "Admin TU",
  dosen: "Dosen",
  kaprodi: "Kaprodi",
  kajur: "Kajur",
};

const roleBadgeColors: Record<UserRole, string> = {
  administrator: "bg-red-500 text-white",
  admin_tu: "bg-blue-500 text-white",
  dosen: "bg-green-500 text-white",
  kaprodi: "bg-purple-500 text-white",
  kajur: "bg-orange-500 text-white",
};

const roleDescriptions: Record<UserRole, string> = {
  administrator: "Kelola akun pengguna dan pengaturan sistem",
  admin_tu: "Distribusi dokumen dan manajemen administrasi",
  dosen: "Kelola kegiatan tridharma dan dokumen",
  kaprodi: "Monitor dan rekap kegiatan program studi",
  kajur: "Monitor dan rekap kegiatan jurusan",
};

export function RoleSwitcher() {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>(
    user?.roles[0] || "dosen"
  );

  if (!user || user.roles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    // In production, this would update the user's active role in the backend
    // and trigger a reload of the appropriate data/sidebar/etc.
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="gap-2"
      >
        <UserCog className="w-4 h-4" />
        <span className="hidden md:inline">Ganti Tampilan</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Tampilan Role</DialogTitle>
            <DialogDescription>
              Anda memiliki {user.roles.length} role. Pilih tampilan yang ingin
              Anda gunakan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {user.roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={`w-full text-left p-4 border rounded-lg transition-colors hover:bg-accent/50 ${
                  activeRole === role ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={roleBadgeColors[role]}>
                    {roleLabels[role]}
                  </Badge>
                  {activeRole === role && (
                    <div className="flex items-center gap-1 text-primary">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Aktif</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {roleDescriptions[role]}
                </p>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <UserCog className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-blue-900">
              Saat ini tampilan menggabungkan semua role Anda. Fitur switch role
              akan segera tersedia.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
