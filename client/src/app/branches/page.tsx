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
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/loading";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Phone,
  Mail,
  Users,
  TrendingUp,
  Menu,
  LogOut,
  BarChart3,
  FileText,
  Shield,
  RefreshCw,
} from "lucide-react";
import { useMe, useLogout } from "@/hooks/useApi";

interface Branch {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  agentCount: number;
  customerCount: number;
  monthlySales: number;
  status: "active" | "inactive";
  createdAt: string;
}

export default function BranchesPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    return <LoadingPage title="Şubeler yükleniyor..." />;
  }

  if (!me) {
    return null;
  }

  // Mock branch data
  const branches: Branch[] = [
    {
      id: 1,
      name: "Merkez Şube",
      city: "İstanbul",
      address: "Levent Mahallesi, Büyükdere Caddesi No: 123",
      phone: "+90 212 555 0101",
      email: "merkez@eesigorta.com",
      manager: "Ahmet Yılmaz",
      agentCount: 15,
      customerCount: 1250,
      monthlySales: 2500000,
      status: "active",
      createdAt: "2023-01-15",
    },
    {
      id: 2,
      name: "Ankara Şubesi",
      city: "Ankara",
      address: "Çankaya Mahallesi, Atatürk Bulvarı No: 456",
      phone: "+90 312 555 0202",
      email: "ankara@eesigorta.com",
      manager: "Ayşe Demir",
      agentCount: 12,
      customerCount: 980,
      monthlySales: 1800000,
      status: "active",
      createdAt: "2023-03-20",
    },
    {
      id: 3,
      name: "İzmir Şubesi",
      city: "İzmir",
      address: "Konak Mahallesi, Cumhuriyet Meydanı No: 789",
      phone: "+90 232 555 0303",
      email: "izmir@eesigorta.com",
      manager: "Mehmet Kaya",
      agentCount: 8,
      customerCount: 650,
      monthlySales: 1200000,
      status: "active",
      createdAt: "2023-06-10",
    },
    {
      id: 4,
      name: "Bursa Şubesi",
      city: "Bursa",
      address: "Osmangazi Mahallesi, Atatürk Caddesi No: 321",
      phone: "+90 224 555 0404",
      email: "bursa@eesigorta.com",
      manager: "Fatma Özkan",
      agentCount: 6,
      customerCount: 420,
      monthlySales: 850000,
      status: "inactive",
      createdAt: "2023-09-05",
    },
  ];

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.manager.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || branch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800",
    };

    const labels = {
      active: "Aktif",
      inactive: "Pasif",
    };

    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const stats = [
    {
      title: "Toplam Şube",
      value: branches.length.toString(),
      change: "+1",
      changeType: "positive",
      icon: Building2,
    },
    {
      title: "Aktif Şube",
      value: branches.filter((b) => b.status === "active").length.toString(),
      change: "100%",
      changeType: "positive",
      icon: TrendingUp,
    },
    {
      title: "Toplam Acente",
      value: branches.reduce((sum, b) => sum + b.agentCount, 0).toString(),
      change: "+5",
      changeType: "positive",
      icon: Users,
    },
    {
      title: "Aylık Satış",
      value: `₺${(
        branches.reduce((sum, b) => sum + b.monthlySales, 0) / 1000000
      ).toFixed(1)}M`,
      change: "+12%",
      changeType: "positive",
      icon: TrendingUp,
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
                <h1 className="text-2xl font-bold text-foreground">Şubeler</h1>
                <p className="text-muted-foreground">Şube yönetimi ve takibi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Şube
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
              <CardDescription>Şubeleri arayın ve filtreleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Arama</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Şube, şehir veya müdür ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="all">Tümü</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button variant="outline" className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    Filtrele
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branches List */}
          <Card className="animate-fade-in" style={{ animationDelay: "500ms" }}>
            <CardHeader>
              <CardTitle>Şube Listesi</CardTitle>
              <CardDescription>Tüm şubelerin detaylı bilgileri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBranches.map((branch) => (
                  <div
                    key={branch.id}
                    className="p-6 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {branch.name}
                            </h3>
                            {getStatusBadge(branch.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{branch.city}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{branch.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{branch.email}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Müdür: {branch.manager}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{branch.agentCount} Acente</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                <span>{branch.customerCount} Müşteri</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Aylık Satış:
                              </span>
                              <span className="font-semibold text-foreground">
                                ₺{branch.monthlySales.toLocaleString("tr-TR")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-muted-foreground">
                                Kuruluş Tarihi:
                              </span>
                              <span className="text-sm text-foreground">
                                {branch.createdAt}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
