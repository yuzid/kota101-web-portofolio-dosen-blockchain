import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router";
import {
  Home,
  FileText,
  Activity,
  FolderOpen,
  Users,
  BarChart3,
  Menu,
  ChevronLeft,
  ChevronDown,
  BookOpen,
  Send,
  Building2,
  Briefcase,
  GraduationCap,
  Landmark,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebarContext } from "../../contexts/SidebarContext";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useEffect, useState } from "react";
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
    roles: ["staf_tu", "dosen", "kaprodi", "kajur"],
  },
  {
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
    roles: ["admin"],
  },
  {
    label: "Manajemen Akun",
    icon: Users,
    path: "/manage-accounts",
    roles: ["admin"],
  },
  {
    label: "Akademik",
    icon: Building2,
    roles: ["admin"],
    children: [
      {
        label: "Jurusan",
        icon: Landmark,
        path: "/admin/akademik/jurusan",
        roles: ["admin"],
      },
      {
        label: "Program Studi",
        icon: GraduationCap,
        path: "/admin/akademik/prodi",
        roles: ["admin"],
      },
    ],
  },
  {
    label: "Jabatan",
    icon: Briefcase,
    roles: ["admin"],
    children: [
      {
        label: "Ketua Jurusan",
        icon: Landmark,
        path: "/admin/jabatan/kajur",
        roles: ["admin"],
      },
      {
        label: "Ketua Prodi",
        icon: GraduationCap,
        path: "/admin/jabatan/kaprodi",
        roles: ["admin"],
      },
    ],
  },
  {
    label: "Distribusi Dokumen",
    icon: Send,
    path: "/document-distribution",
    roles: ["staf_tu"],
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
    label: "Monitoring Jurusan",
    icon: BarChart3,
    roles: ["kajur"],
    children: [
      {
        label: "Kegiatan",
        icon: Activity,
        path: "/monitoring/jurusan",
        roles: ["kajur"],
      },
      {
        label: "Laporan Rekapitulasi",
        icon: FileText,
        path: "/monitoring/jurusan/rekap",
        roles: ["kajur"],
      },
    ],
  },
  {
    label: "Monitoring Prodi",
    icon: BarChart3,
    roles: ["kaprodi"],
    children: [
      {
        label: "Kegiatan",
        icon: Activity,
        path: "/monitoring/prodi",
        roles: ["kaprodi"],
      },
      {
        label: "Laporan Rekapitulasi",
        icon: FileText,
        path: "/monitoring/prodi/rekap",
        roles: ["kaprodi"],
      },
    ],
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

interface SidebarNavProps {
  isCollapsed: boolean;
  onItemClick?: () => void;
}

function SidebarNav({ isCollapsed, onItemClick }: SidebarNavProps) {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const location = useLocation();

  const filteredItems = navigationItems.filter(
    (item) => user?.roles?.some((r) => item.roles.includes(r)) ?? false
  );

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
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
          <motion.button
            onClick={() => {
              if (!isCollapsed) toggleMenu(item.label);
            }}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group w-full text-left",
              "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  childActive ? "text-sidebar-primary" : ""
                )}
              />
            </motion.div>
            {!isCollapsed && (
              <>
                <span className="text-sm flex-1">{item.label}</span>
                <motion.div
                  animate={{ rotate: isOpen ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </>
            )}
          </motion.button>
          <AnimatePresence>
            {!isCollapsed && isOpen && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 mt-1 space-y-1 border-l border-sidebar-border pl-2 overflow-hidden"
              >
                {item.children!.map((child, childIndex) => {
                  const ChildIcon = child.icon;
                  const isChildActive = location.pathname === child.path;

                  return (
                    <motion.li
                      key={child.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: childIndex * 0.03 }}
                    >
                      <Link
                        to={child.path!}
                        onClick={onItemClick}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group text-sm relative",
                          isChildActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        {isChildActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          />
                        )}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <ChildIcon
                            className={cn(
                              "w-4 h-4 flex-shrink-0",
                              isChildActive ? "text-sidebar-primary" : ""
                            )}
                          />
                        </motion.div>
                        <span className="text-sm">{child.label}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </li>
      );
    }

    return (
      <motion.li
        key={item.path}
        whileHover={{ x: 3 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Link
          to={item.path!}
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group relative",
            location.pathname === item.path
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          {location.pathname === item.path && (
            <motion.div
              layoutId="sidebar-active-desktop"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-full"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon
              className={cn(
                "w-5 h-5 flex-shrink-0",
                location.pathname === item.path ? "text-sidebar-primary" : ""
              )}
            />
          </motion.div>
          {!isCollapsed && (
            <span className="text-sm">{item.label}</span>
          )}
        </Link>
      </motion.li>
    );
  };

  return (
    <nav className="flex-1 overflow-y-auto p-2">
      <motion.ul
        className="space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, staggerChildren: 0.05 }}
      >
        {filteredItems.map((item, index) => (
          <motion.li
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {renderNavItem(item)}
          </motion.li>
        ))}
      </motion.ul>
    </nav>
  );
}

export function Sidebar() {
  const { isCollapsed, setCollapsed, isMobile, isMobileOpen, setMobileOpen } = useSidebarContext();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img
              src="/images/Logo_Polban.svg"
              alt="POLBAN"
              className="w-8 h-8"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground">
                Portofolio Dosen
              </span>
              <span className="text-xs text-muted-foreground">POLBAN</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className="p-1 hover:bg-sidebar-accent rounded-md transition-colors hidden md:block"
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
          )}
        </button>
      </div>

      <SidebarNav isCollapsed={isCollapsed} />

      <div className="p-3 border-t border-sidebar-border">
        {mounted && (
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              {theme === "dark" ? (
                <Moon className="w-4 h-4 shrink-0 text-sidebar-foreground" />
              ) : (
                <Sun className="w-4 h-4 shrink-0 text-sidebar-foreground" />
              )}
              {!isCollapsed && (
                <span className="text-sm text-sidebar-foreground truncate">
                  {theme === "dark" ? "Gelap" : "Terang"}
                </span>
              )}
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              className={cn(isCollapsed && "mx-auto")}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigasi</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full">
            {sidebarContent}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 hidden md:block",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
