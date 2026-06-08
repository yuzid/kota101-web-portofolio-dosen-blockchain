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
  ChevronDown,
  BookOpen,
  FileCheck,
  Send,
  Building2,
  Briefcase,
  GraduationCap,
  Landmark,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { UserRole } from "../../contexts/AuthContext";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  roles: string[];
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: "Beranda",
    icon: Home,
    path: "/dashboard",
    roles: ["admin_tu", "dosen", "kaprodi", "kajur"],
  },
  {
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
    roles: ["administrator"],
  },
  {
    label: "Manajemen Akun",
    icon: Users,
    path: "/manage-accounts",
    roles: ["administrator"],
  },
  {
    label: "Akademik",
    icon: Building2,
    roles: ["administrator"],
    children: [
      {
        label: "Jurusan",
        icon: Landmark,
        path: "/admin/akademik/jurusan",
        roles: ["administrator"],
      },
      {
        label: "Program Studi",
        icon: GraduationCap,
        path: "/admin/akademik/prodi",
        roles: ["administrator"],
      },
    ],
  },
  {
    label: "Jabatan",
    icon: Briefcase,
    roles: ["administrator"],
    children: [
      {
        label: "Ketua Jurusan",
        icon: Landmark,
        path: "/admin/jabatan/kajur",
        roles: ["administrator"],
      },
      {
        label: "Ketua Prodi",
        icon: GraduationCap,
        path: "/admin/jabatan/kaprodi",
        roles: ["administrator"],
      },
    ],
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
    label: "Notifikasi",
    icon: Bell,
    path: "/notifications",
    roles: ["admin_tu", "dosen", "kaprodi", "kajur"],
  },
];

function isChildActive(locationPath: string, children: NavItem[]): boolean {
  return children.some(
    (child) =>
      locationPath === child.path || locationPath.startsWith(child.path + "/")
  );
}

function isAnyChildActive(locationPath: string, item: NavItem): boolean {
  return (
    isChildActive(locationPath, item.children!) ||
    item.children!.some(
      (child) => child.children && isChildActive(locationPath, child.children)
    )
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const location = useLocation();

  const filteredItems = navigationItems.filter(
    (item) => user?.roles?.some((r) => item.roles.includes(r)) ?? false
  );

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.label);
    const childActive = hasChildren && isAnyChildActive(location.pathname, item);
    const isOpen = isExpanded || childActive;

    if (hasChildren) {
      return (
        <li key={item.label}>
          <button
            onClick={() => !isCollapsed && toggleMenu(item.label)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group w-full text-left",
              childActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 flex-shrink-0",
                childActive ? "text-sidebar-primary" : ""
              )}
            />
            {!isCollapsed && (
              <>
                <span className="text-sm flex-1">{item.label}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isOpen ? "rotate-0" : "-rotate-90"
                  )}
                />
              </>
            )}
          </button>
          {!isCollapsed && isOpen && (
            <ul className="ml-3 mt-1 space-y-1 border-l border-sidebar-border pl-2">
              {item.children!.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive =
                  location.pathname === child.path ||
                  location.pathname.startsWith(child.path + "/");

                return (
                  <li key={child.path}>
                    <Link
                      to={child.path!}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group text-sm",
                        isChildActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <ChildIcon
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          isChildActive ? "text-sidebar-primary" : ""
                        )}
                      />
                      <span className="text-sm">{child.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={item.path}>
        <Link
          to={item.path!}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group",
            location.pathname === item.path
              ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5 flex-shrink-0",
              location.pathname === item.path ? "text-sidebar-primary" : ""
            )}
          />
          {!isCollapsed && (
            <span className="text-sm">{item.label}</span>
          )}
        </Link>
      </li>
    );
  };

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
            {filteredItems.map((item) => renderNavItem(item))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
