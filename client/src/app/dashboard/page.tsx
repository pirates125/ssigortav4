"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingPage } from "@/components/ui/loading";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Download,
  RefreshCw,
  Building2,
  BarChart3,
  Plus,
  Eye,
} from "lucide-react";
import { useMe, useLogout } from "@/hooks/useApi";

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: me, isLoading } = useMe();
  const logoutMutation = useLogout();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !me) {
      router.push("/login");
    }
  }, [me, isLoading, router, mounted]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
  };

  if (!mounted || isLoading) {
    return <LoadingPage title="Dashboard yükleniyor..." />;
  }

  if (!me) {
    return null;
  }

  const quickActions = [
    {
      title: "Yeni Teklif Oluştur",
      description: "Müşteri için sigorta teklifi hazırla",
      icon: FileText,
      href: "/quotes/new",
      color: "bg-blue-500",
    },
    {
      title: "Yeni Müşteri Ekle",
      description: "Sisteme yeni müşteri kaydı",
      icon: Users,
      href: "/customers",
      color: "bg-green-500",
    },
    {
      title: "Teklifleri Görüntüle",
      description: "Mevcut teklifleri incele",
      icon: Eye,
      href: "/quotes",
      color: "bg-purple-500",
    },
    {
      title: "Raporları İncele",
      description: "Detaylı analiz ve raporlar",
      icon: BarChart3,
      href: "/reports",
      color: "bg-orange-500",
    },
  ];

  const stats = [
    {
      title: "Toplam Müşteri",
      value: "1,234",
      change: "+12%",
      changeType: "positive",
      icon: Users,
    },
    {
      title: "Aktif Poliçe",
      value: "856",
      change: "+8%",
      changeType: "positive",
      icon: Shield,
    },
    {
      title: "Bu Ay Teklif",
      value: "342",
      change: "+23%",
      changeType: "positive",
      icon: FileText,
    },
    {
      title: "Toplam Prim",
      value: "₺2.4M",
      change: "+15%",
      changeType: "positive",
      icon: DollarSign,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        onLogout={handleLogout}
        user={{ email: me.data?.email || "", role: me.data?.role || "" }}
      />

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation menu for EESigorta Portal
          </SheetDescription>
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
            <div className="flex-1 p-2 overflow-y-auto">
              <nav className="space-y-1">
                {[
                  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
                  { name: "Müşteriler", href: "/customers", icon: Users },
                  { name: "Teklifler", href: "/quotes", icon: FileText },
                  { name: "Poliçeler", href: "/policies", icon: Shield },
                  { name: "Şubeler", href: "/branches", icon: Building2 },
                  { name: "Acenteler", href: "/agents", icon: Users },
                  { name: "Raporlar", href: "/reports", icon: TrendingUp },
                  { name: "Scraper", href: "/admin/scraper", icon: RefreshCw },
                  { name: "Ayarlar", href: "/settings", icon: Settings },
                ].map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 px-3"
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Button>
                ))}
              </nav>
            </div>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-border">
              {me.data && (
                <div className="mb-3 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-foreground">
                    {me.data.email}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {me.data.role}
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Çıkış Yap</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 ml-0 md:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Hoş geldiniz, {me.data?.email || "Kullanıcı"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change} geçen aya göre
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Hızlı İşlemler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="hover-lift cursor-pointer animate-fade-in h-full"
                  style={{ animationDelay: `${(index + 4) * 100}ms` }}
                  onClick={() => router.push(action.href)}
                >
                  <CardHeader className="pb-3 h-full flex flex-col">
                    <div
                      className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}
                    >
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription className="grow">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              className="animate-fade-in"
              style={{ animationDelay: "800ms" }}
            >
              <CardHeader>
                <CardTitle>Son Teklifler</CardTitle>
                <CardDescription>
                  En son oluşturulan sigorta teklifleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Kasko Teklifi #{1000 + i}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ahmet Yılmaz - BMW 5 Serisi
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ₺{15000 + i * 1000}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          2 saat önce
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card
              className="animate-fade-in"
              style={{ animationDelay: "900ms" }}
            >
              <CardHeader>
                <CardTitle>Sistem Durumu</CardTitle>
                <CardDescription>Servislerin mevcut durumu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">API Servisi</span>
                    </div>
                    <span className="text-sm text-green-600">Çalışıyor</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Veritabanı</span>
                    </div>
                    <span className="text-sm text-green-600">Bağlı</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Scraper Servisi</span>
                    </div>
                    <span className="text-sm text-yellow-600">Beklemede</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Redis Cache</span>
                    </div>
                    <span className="text-sm text-green-600">Aktif</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
