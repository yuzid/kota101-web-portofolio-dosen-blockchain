import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Home,
  FileText,
  Activity,
  FolderOpen,
  History,
  Bell,
  Users,
  BarChart3,
  Menu,
  ChevronLeft,
  BookOpen,
  FileCheck,
  Send,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { UserRole } from "../../contexts/AuthContext";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
}

const navigationItems: NavItem[] = [
  {
    label: "Beranda",
    icon: Home,
    path: "/dashboard",
    roles: ["admin_tu", "dosen", "kaprodi", "kajur"],
  },
  {
    label: "Manajemen Akun",
    icon: Users,
    path: "/manage-accounts",
    roles: ["administrator"],
  },
  {
    label: "Distribusi Dokumen",
    icon: Send,
    path: "/document-distribution",
    roles: ["admin_tu"],
  },
  {
    label: "Kegiatan Tridharma",
    icon: Activity,
    path: "/activities",
    roles: ["dosen"],
  },
  {
    label: "Dokumen Saya",
    icon: FolderOpen,
    path: "/documents",
    roles: ["dosen"],
  },
  {
    label: "Rekap AMI",
    icon: BarChart3,
    path: "/ami-recap",
    roles: ["kaprodi", "kajur"],
  },
  {
    label: "Monitoring Jurusan",
    icon: BarChart3,
    path: "/monitoring/jurusan",
    roles: ["kajur"],
  },
  {
    label: "Monitoring Prodi",
    icon: BarChart3,
    path: "/monitoring/prodi",
    roles: ["kaprodi"],
  },
  {
    label: "Notifikasi",
    icon: Bell,
    path: "/notifications",
    roles: ["admin_tu", "dosen", "kaprodi", "kajur"],
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const filteredItems = navigationItems.filter(
    (item) => user?.roles?.some((r) => item.roles.includes(r)) ?? false
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-sidebar-foreground">
                  Portofolio Dosen
                </span>
                <span className="text-xs text-muted-foreground">POLBAN</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-sidebar-accent rounded-md transition-colors"
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5 text-sidebar-foreground" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive ? "text-sidebar-primary" : ""
                      )}
                    />
                    {!isCollapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
