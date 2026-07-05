import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PageTransition } from "../ui/page-transition";
import { SidebarProvider, useSidebarContext } from "../../contexts/SidebarContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

function LayoutContent({ children, title, breadcrumbs }: MainLayoutProps) {
  const { isCollapsed } = useSidebarContext();
  const sidebarMargin = isCollapsed ? "md:ml-16" : "md:ml-60";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar title={title} />

      <main className={`${sidebarMargin} mt-16 p-4 md:p-6 transition-[margin] duration-300`}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.path || "#"}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}

export function MainLayout({ children, title, breadcrumbs }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutContent title={title} breadcrumbs={breadcrumbs}>
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
}
