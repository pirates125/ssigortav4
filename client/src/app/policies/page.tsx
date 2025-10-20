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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useMe, useLogout, usePolicies, useDeletePolicy } from "@/hooks/useApi";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function PoliciesPage() {
  const router = useRouter();
  const logoutMutation = useLogout();

  // ---- Auth Gate ----
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
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
  const { data: me } = useMe();
  const { data: policiesData, isLoading } = usePolicies();
  const deletePolicyMutation = useDeletePolicy();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const policies: any[] = policiesData?.data?.data || [];
  const total = policiesData?.data?.total || 0;

  const filteredPolicies = policies.filter((policy: any) => {
    const matchesSearch =
      policy.policy_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.customer?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      policy.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || policy.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDeletePolicy = async (id: number) => {
    if (confirm("Bu poliçeyi silmek istediğinizden emin misiniz?")) {
      try {
        await deletePolicyMutation.mutateAsync(id);
        toast.success("Poliçe başarıyla silindi!");
      } catch (error) {
        toast.error("Poliçe silme başarısız");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "Aktif" },
      expired: { variant: "secondary" as const, label: "Süresi Dolmuş" },
      cancelled: { variant: "destructive" as const, label: "İptal Edilmiş" },
      pending: { variant: "outline" as const, label: "Beklemede" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Poliçeler</h1>
            <p className="text-gray-600">
              Tüm poliçeleri görüntüleyin ve yönetin
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Toplam Poliçe
                    </p>
                    <p className="text-2xl font-bold">{total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Aktif Poliçe
                    </p>
                    <p className="text-2xl font-bold">
                      {
                        policies.filter((p: any) => p.status === "active")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Süresi Dolmuş
                    </p>
                    <p className="text-2xl font-bold">
                      {
                        policies.filter((p: any) => p.status === "expired")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Toplam Prim
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        policies.reduce(
                          (sum: number, p: any) => sum + (p.premium || 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Poliçe no, müşteri veya şirket ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="expired">Süresi Dolmuş</option>
                    <option value="cancelled">İptal Edilmiş</option>
                    <option value="pending">Beklemede</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Dışa Aktar</span>
                  </Button>
                  <Button
                    onClick={() => router.push("/policies/new")}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Yeni Poliçe</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Poliçe Listesi</CardTitle>
              <CardDescription>
                {filteredPolicies.length} poliçe gösteriliyor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poliçe No</TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Şirket</TableHead>
                        <TableHead>Prim</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Başlangıç</TableHead>
                        <TableHead>Bitiş</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPolicies.map((policy: any) => (
                        <TableRow key={policy.id}>
                          <TableCell className="font-medium">
                            {policy.policy_number}
                          </TableCell>
                          <TableCell>
                            {policy.customer?.name || "N/A"}
                          </TableCell>
                          <TableCell>{policy.company_name}</TableCell>
                          <TableCell>
                            {formatCurrency(policy.premium)}
                          </TableCell>
                          <TableCell>{getStatusBadge(policy.status)}</TableCell>
                          <TableCell>{formatDate(policy.start_date)}</TableCell>
                          <TableCell>{formatDate(policy.end_date)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/policies/${policy.id}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/policies/${policy.id}/edit`)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePolicy(policy.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredPolicies.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Poliçe bulunamadı.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
