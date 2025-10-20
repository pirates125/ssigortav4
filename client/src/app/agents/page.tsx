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
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Menu,
  LogOut,
  BarChart3,
  FileText,
  Shield,
  RefreshCw,
  Building2,
  Star,
  Award,
} from "lucide-react";
import { useMe, useLogout } from "@/hooks/useApi";

interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  branch: string;
  city: string;
  licenseNumber: string;
  customerCount: number;
  monthlySales: number;
  commission: number;
  rating: number;
  status: "active" | "inactive" | "suspended";
  joinDate: string;
  lastActivity: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
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
    return <LoadingPage title="Acenteler yükleniyor..." />;
  }

  if (!me) {
    return null;
  }

  // Mock agent data
  const agents: Agent[] = [
    {
      id: 1,
      name: "Ahmet Yılmaz",
      email: "ahmet.yilmaz@eesigorta.com",
      phone: "+90 532 555 0101",
      branch: "Merkez Şube",
      city: "İstanbul",
      licenseNumber: "AGT-2023-001",
      customerCount: 125,
      monthlySales: 450000,
      commission: 22500,
      rating: 4.8,
      status: "active",
      joinDate: "2023-01-15",
      lastActivity: "2024-01-15",
    },
    {
      id: 2,
      name: "Ayşe Demir",
      email: "ayse.demir@eesigorta.com",
      phone: "+90 532 555 0202",
      branch: "Ankara Şubesi",
      city: "Ankara",
      licenseNumber: "AGT-2023-002",
      customerCount: 98,
      monthlySales: 320000,
      commission: 16000,
      rating: 4.6,
      status: "active",
      joinDate: "2023-03-20",
      lastActivity: "2024-01-14",
    },
    {
      id: 3,
      name: "Mehmet Kaya",
      email: "mehmet.kaya@eesigorta.com",
      phone: "+90 532 555 0303",
      branch: "İzmir Şubesi",
      city: "İzmir",
      licenseNumber: "AGT-2023-003",
      customerCount: 76,
      monthlySales: 280000,
      commission: 14000,
      rating: 4.4,
      status: "active",
      joinDate: "2023-06-10",
      lastActivity: "2024-01-13",
    },
    {
      id: 4,
      name: "Fatma Özkan",
      email: "fatma.ozkan@eesigorta.com",
      phone: "+90 532 555 0404",
      branch: "Bursa Şubesi",
      city: "Bursa",
      licenseNumber: "AGT-2023-004",
      customerCount: 45,
      monthlySales: 180000,
      commission: 9000,
      rating: 4.2,
      status: "inactive",
      joinDate: "2023-09-05",
      lastActivity: "2023-12-20",
    },
    {
      id: 5,
      name: "Ali Çelik",
      email: "ali.celik@eesigorta.com",
      phone: "+90 532 555 0505",
      branch: "Merkez Şube",
      city: "İstanbul",
      licenseNumber: "AGT-2023-005",
      customerCount: 32,
      monthlySales: 120000,
      commission: 6000,
      rating: 3.8,
      status: "suspended",
      joinDate: "2023-11-15",
      lastActivity: "2024-01-10",
    },
  ];

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;
    const matchesBranch =
      branchFilter === "all" || agent.branch === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      suspended: "bg-red-100 text-red-800",
    };

    const labels = {
      active: "Aktif",
      inactive: "Pasif",
      suspended: "Askıda",
    };

    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const stats = [
    {
      title: "Toplam Acente",
      value: agents.length.toString(),
      change: "+2",
      changeType: "positive",
      icon: Users,
    },
    {
      title: "Aktif Acente",
      value: agents.filter((a) => a.status === "active").length.toString(),
      change: "85%",
      changeType: "positive",
      icon: TrendingUp,
    },
    {
      title: "Toplam Müşteri",
      value: agents.reduce((sum, a) => sum + a.customerCount, 0).toString(),
      change: "+15%",
      changeType: "positive",
      icon: Users,
    },
    {
      title: "Aylık Satış",
      value: `₺${(
        agents.reduce((sum, a) => sum + a.monthlySales, 0) / 1000000
      ).toFixed(1)}M`,
      change: "+8%",
      changeType: "positive",
      icon: TrendingUp,
    },
  ];

  const branches = Array.from(new Set(agents.map((a) => a.branch)));

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
                <h1 className="text-2xl font-bold text-foreground">
                  Acenteler
                </h1>
                <p className="text-muted-foreground">
                  Acente yönetimi ve performans takibi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Acente
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
                Acenteleri arayın ve filtreleyin
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
                      placeholder="Acente, email veya lisans ara..."
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
                    <option value="suspended">Askıda</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Şube</Label>
                  <select
                    id="branch"
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="all">Tümü</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
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

          {/* Agents List */}
          <Card className="animate-fade-in" style={{ animationDelay: "500ms" }}>
            <CardHeader>
              <CardTitle>Acente Listesi</CardTitle>
              <CardDescription>
                Tüm acentelerin detaylı bilgileri ve performansları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-6 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {agent.name}
                            </h3>
                            {getStatusBadge(agent.status)}
                            <div className="flex items-center gap-1">
                              {getRatingStars(agent.rating)}
                              <span className="text-sm text-muted-foreground ml-1">
                                ({agent.rating})
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{agent.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{agent.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                <span>Lisans: {agent.licenseNumber}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>{agent.branch}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{agent.city}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{agent.customerCount} Müşteri</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Aylık Satış:
                                </span>
                                <span className="font-semibold text-foreground">
                                  ₺{agent.monthlySales.toLocaleString("tr-TR")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Komisyon:
                                </span>
                                <span className="font-semibold text-foreground">
                                  ₺{agent.commission.toLocaleString("tr-TR")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Katılım Tarihi:
                                </span>
                                <span className="text-foreground">
                                  {agent.joinDate}
                                </span>
                              </div>
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
