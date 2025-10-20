"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Users,
  FileText,
  Shield,
  Download,
  RefreshCw,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onLogout?: () => void;
  user?: {
    email: string;
    role: string;
  };
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Ana sayfa ve genel bakış",
  },
  {
    title: "Müşteriler",
    href: "/customers",
    icon: Users,
    description: "Müşteri yönetimi",
  },
  {
    title: "Teklifler",
    href: "/quotes",
    icon: FileText,
    description: "Sigorta teklifleri",
  },
  {
    title: "Poliçeler",
    href: "/policies",
    icon: Shield,
    description: "Aktif poliçeler",
  },
  {
    title: "Şubeler",
    href: "/branches",
    icon: Building2,
    description: "Şube yönetimi",
  },
  {
    title: "Acenteler",
    href: "/agents",
    icon: Users,
    description: "Acente yönetimi",
  },
  {
    title: "Raporlar",
    href: "/reports",
    icon: BarChart3,
    description: "Analiz ve raporlar",
  },
  {
    title: "Scraper",
    href: "/admin/scraper",
    icon: RefreshCw,
    description: "Web scraper yönetimi",
  },
  {
    title: "Ayarlar",
    href: "/settings",
    icon: Settings,
    description: "Sistem ayarları",
  },
];

export function Sidebar({ className, onLogout, user, ...props }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div
      className={cn("flex min-h-screen fixed left-0 top-0 z-50", className)}
      {...props}
    >
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col bg-card border-r border-border transition-all duration-300 h-screen",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-semibold text-foreground">
                  EESigorta
                </h2>
                <p className="text-xs text-muted-foreground">Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-2">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10 transition-all duration-200",
                      isActive &&
                        "bg-primary text-primary-foreground shadow-sm",
                      !isCollapsed && "px-3"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <div className="flex-1 text-left animate-slide-in">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs opacity-70">
                          {item.description}
                        </div>
                      </div>
                    )}
                    {!isCollapsed && isActive && (
                      <ChevronRight className="w-4 h-4 animate-slide-in" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border">
          {!isCollapsed && user && (
            <div className="mb-3 p-3 bg-muted rounded-lg animate-fade-in">
              <div className="text-sm font-medium text-foreground">
                {user.email}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {user.role}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={onLogout}
            className={cn(
              "w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10",
              !isCollapsed && "px-3"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Çıkış Yap</span>}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar onLogout={onLogout} user={user} />
    </div>
  );
}

function MobileSidebar({
  onLogout,
  user,
}: {
  onLogout?: () => void;
  user?: any;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  EESigorta
                </h2>
                <p className="text-xs text-muted-foreground">Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-12 px-3",
                        isActive && "bg-primary text-primary-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs opacity-70">
                          {item.description}
                        </div>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-border">
            {user && (
              <div className="mb-3 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium text-foreground">
                  {user.email}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={onLogout}
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 px-3"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileMenuButton() {
  return (
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="w-5 h-5" />
    </Button>
  );
}
