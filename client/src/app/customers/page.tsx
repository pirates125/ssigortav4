"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Menu,
  Building2,
  Users,
  FileText,
  Shield,
  TrendingUp,
  Settings,
  RefreshCw,
  LogOut,
  BarChart3,
} from "lucide-react";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useMe,
  useLogout,
} from "@/hooks/useApi";
import { formatDate, formatPhoneNumber } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function CustomersPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoutMutation = useLogout();

  // ---- Auth Gate (SSR-safe) ----
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // only on client
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    if (!token) {
      setIsAuthed(false);
      router.push("/login");
    } else {
      setIsAuthed(true);
    }
    setAuthReady(true);
  }, [router]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
  };

  // ---- Hooks & State ----
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const { data: me } = useMe();

  const {
    data: customersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCustomers({
    query: searchQuery,
    page,
    pageSize: 20,
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")) {
      await deleteMutation.mutateAsync(id);
      toast.success("Müşteri silindi");
      refetch();
    }
  };

  // ---- Normalize data SHAPE once ----
  const customerList = customersData?.data?.data ?? [];
  const total = customersData?.data?.total ?? 0;
  const totalPages = customersData?.data?.total_pages ?? 0;

  // ---- Render Gates ----
  if (!authReady) {
    return <div className="p-6">Yükleniyor...</div>;
  }
  if (isAuthed === false) {
    return <div className="p-6">Girişe yönlendiriliyorsunuz…</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          onLogout={handleLogout}
          user={{ email: me?.data?.email || "", role: me?.data?.role || "" }}
        />
      </div>

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
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {me?.data?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {me?.data?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {me?.data?.role}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-10 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Çıkış Yap</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-h-screen ml-0 md:ml-64">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
            </div>
            <p className="text-gray-600">Müşteri bilgilerini yönetin</p>
          </div>

          {/* Search & Add */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Müşteri ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingCustomer(null);
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Yeni Müşteri</span>
              <span className="sm:hidden">Yeni</span>
            </Button>
          </div>

          {/* States */}
          {isError && (
            <Card className="mb-6">
              <CardContent className="py-4">
                <p className="text-red-600">
                  Veri alınırken hata oluştu. {(error as any)?.message || ""}
                </p>
                <div className="mt-2">
                  <Button variant="outline" onClick={() => refetch()}>
                    Tekrar dene
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Listesi</CardTitle>
              <CardDescription>Toplam {total} müşteri</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">
                            TC/VKN
                          </th>
                          <th className="text-left py-3 px-4 font-medium">
                            İsim
                          </th>
                          <th className="text-left py-3 px-4 font-medium hidden md:table-cell">
                            E-posta
                          </th>
                          <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">
                            Telefon
                          </th>
                          <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">
                            Şehir
                          </th>
                          <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">
                            Kayıt Tarihi
                          </th>
                          <th className="text-left py-3 px-4 font-medium">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerList.map((customer: any) => (
                          <tr
                            key={customer.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">{customer.tc_vkn}</td>
                            <td className="py-3 px-4 font-medium">
                              {customer.name}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              {customer.email || "-"}
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              {customer.phone
                                ? formatPhoneNumber(customer.phone)
                                : "-"}
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              {customer.city || "-"}
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              {formatDate(customer.created_at)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(customer)}
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(customer.id)}
                                  disabled={deleteMutation.isPending}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {customerList.length === 0 && (
                          <tr>
                            <td
                              className="py-6 text-center text-sm text-gray-500"
                              colSpan={7}
                            >
                              Kayıt bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
                      <div className="text-sm text-gray-500">
                        Sayfa {page} / {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
