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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingPage } from "@/components/ui/loading";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Shield,
  RefreshCw,
  Filter,
  Search,
  Menu,
  LogOut,
  Building2,
} from "lucide-react";
import { useMe, useLogout } from "@/hooks/useApi";

interface ReportData {
  id: string;
  title: string;
  type: "dashboard" | "sales" | "customers" | "policies" | "financial";
  description: string;
  lastGenerated: string;
  status: "ready" | "generating" | "error";
  size: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    return <LoadingPage title="Raporlar yükleniyor..." />;
  }

  if (!me) {
    return null;
  }

  // Mock report data
  const reports: ReportData[] = [
    {
      id: "1",
      title: "Aylık Satış Raporu",
      type: "sales",
      description: "Bu ayın satış performansı ve analizi",
      lastGenerated: "2024-01-15",
      status: "ready",
      size: "2.3 MB",
    },
    {
      id: "2",
      title: "Müşteri Analiz Raporu",
      type: "customers",
      description: "Müşteri segmentasyonu ve davranış analizi",
      lastGenerated: "2024-01-14",
      status: "ready",
      size: "1.8 MB",
    },
    {
      id: "3",
      title: "Poliçe Performans Raporu",
      type: "policies",
      description: "Aktif poliçelerin performans analizi",
      lastGenerated: "2024-01-13",
      status: "generating",
      size: "-",
    },
    {
      id: "4",
      title: "Finansal Özet Raporu",
      type: "financial",
      description: "Gelir-gider analizi ve finansal durum",
      lastGenerated: "2024-01-12",
      status: "ready",
      size: "3.1 MB",
    },
    {
      id: "5",
      title: "Dashboard Özeti",
      type: "dashboard",
      description: "Genel sistem durumu ve KPI'lar",
      lastGenerated: "2024-01-15",
      status: "ready",
      size: "856 KB",
    },
  ];

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = reportType === "all" || report.type === reportType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      ready: "bg-green-100 text-green-800",
      generating: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
    };

    const labels = {
      ready: "Hazır",
      generating: "Oluşturuluyor",
      error: "Hata",
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      dashboard: BarChart3,
      sales: TrendingUp,
      customers: Users,
      policies: Shield,
      financial: DollarSign,
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  const stats = [
    {
      title: "Toplam Rapor",
      value: reports.length.toString(),
      change: "+2",
      changeType: "positive",
      icon: FileText,
    },
    {
      title: "Bu Ay Oluşturulan",
      value: "12",
      change: "+5",
      changeType: "positive",
      icon: Calendar,
    },
    {
      title: "Toplam Boyut",
      value: "8.2 MB",
      change: "+1.2 MB",
      changeType: "positive",
      icon: Download,
    },
    {
      title: "Aktif Raporlar",
      value: reports.filter((r) => r.status === "ready").length.toString(),
      change: "100%",
      changeType: "positive",
      icon: BarChart3,
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
                  { name: "Raporlar", href: "/reports", icon: TrendingUp },
                  { name: "Scraper", href: "/admin/scraper", icon: RefreshCw },
                  { name: "Ayarlar", href: "/settings", icon: Building2 },
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
                <h1 className="text-2xl font-bold text-foreground">Raporlar</h1>
                <p className="text-muted-foreground">
                  Sistem raporları ve analizler
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
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

          {/* Filters */}
          <Card className="animate-fade-in" style={{ animationDelay: "400ms" }}>
            <CardHeader>
              <CardTitle>Filtreler</CardTitle>
              <CardDescription>
                Raporları türe ve tarihe göre filtreleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Arama</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Rapor ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Rapor Türü</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="sales">Satış</SelectItem>
                      <SelectItem value="customers">Müşteri</SelectItem>
                      <SelectItem value="policies">Poliçe</SelectItem>
                      <SelectItem value="financial">Finansal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateRange">Tarih Aralığı</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tarih seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Son 7 gün</SelectItem>
                      <SelectItem value="30">Son 30 gün</SelectItem>
                      <SelectItem value="90">Son 90 gün</SelectItem>
                      <SelectItem value="365">Son 1 yıl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrele
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card className="animate-fade-in" style={{ animationDelay: "500ms" }}>
            <CardHeader>
              <CardTitle>Rapor Listesi</CardTitle>
              <CardDescription>
                Mevcut raporları görüntüleyin ve indirin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getTypeIcon(report.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {report.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Son oluşturulma: {report.lastGenerated}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Boyut: {report.size}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                      <Button
                        size="sm"
                        disabled={report.status !== "ready"}
                        onClick={() => {
                          // Handle download
                          console.log("Downloading report:", report.id);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        İndir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-fade-in" style={{ animationDelay: "600ms" }}>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
              <CardDescription>
                Yeni rapor oluşturun veya mevcut raporları yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className="h-20 flex flex-col gap-2"
                  onClick={() => {
                    // Handle new report
                    console.log("Creating new report");
                  }}
                >
                  <FileText className="w-6 h-6" />
                  <span>Yeni Rapor Oluştur</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => {
                    // Handle scheduled reports
                    console.log("Managing scheduled reports");
                  }}
                >
                  <Calendar className="w-6 h-6" />
                  <span>Zamanlanmış Raporlar</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => {
                    // Handle report templates
                    console.log("Managing report templates");
                  }}
                >
                  <BarChart3 className="w-6 h-6" />
                  <span>Rapor Şablonları</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
