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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
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
      <Sidebar
        onLogout={handleLogout}
        user={{ email: me?.data?.email || "", role: me?.data?.role || "" }}
      />

      <div className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
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
