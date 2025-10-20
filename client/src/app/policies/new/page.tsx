"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
} from "lucide-react";
import {
  useMe,
  useLogout,
  useQuote,
  useScrapedQuotes,
  useCreatePolicy,
} from "@/hooks/useApi";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function NewPolicyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get("quote_id");
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
  const { data: quote, isLoading: quoteLoading } = useQuote(
    quoteId ? parseInt(quoteId) : 0
  );
  const { data: scrapedQuotesData, isLoading: scrapedLoading } = useScrapedQuotes(
    quoteId ? parseInt(quoteId) : 0
  );
  const scrapedQuotes = scrapedQuotesData?.data || [];
  const createPolicyMutation = useCreatePolicy();

  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [policyData, setPolicyData] = useState({
    policyNumber: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const handleCreatePolicy = async () => {
    if (!selectedQuote || !quote) {
      toast.error("Lütfen bir teklif seçin");
      return;
    }

    try {
      await createPolicyMutation.mutateAsync({
        customerId: quote.customer_id,
        productId: quote.product_id,
        agentId: me?.data?.id || 1,
        quoteId: quote.id,
        policyNumber: policyData.policyNumber,
        companyName: selectedQuote.company_name,
        premium: selectedQuote.final_price,
        status: "active",
        startDate: policyData.startDate,
        endDate: policyData.endDate,
      });

      toast.success("Poliçe başarıyla oluşturuldu!");
      router.push("/policies");
    } catch (error) {
      toast.error("Poliçe oluşturma başarısız");
    }
  };

  // ---- Render Gates ----
  if (!authReady) {
    return <div className="p-6">Yükleniyor...</div>;
  }
  if (isAuthed === false) {
    return <div className="p-6">Girişe yönlendiriliyorsunuz…</div>;
  }

  if (!quoteId) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar
          onLogout={handleLogout}
          user={{ email: me?.data?.email || "", role: me?.data?.role || "" }}
        />
        <div className="flex-1 ml-64 min-h-screen p-6">
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Geçersiz Quote ID</h2>
              <p className="text-gray-600 mb-4">Quote ID bulunamadı.</p>
              <Button onClick={() => router.push("/quotes")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Teklifler Sayfasına Dön
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Poliçe</h1>
            <p className="text-gray-600">
              Teklif #{quoteId} için poliçe oluşturun
            </p>
          </div>

          {quoteLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quote Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Teklif Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Teklif No</Label>
                    <p className="text-lg font-semibold">#{quote?.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Müşteri</Label>
                    <p className="text-lg">{quote?.customer?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Ürün</Label>
                    <p className="text-lg">{quote?.product?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Araç Bilgileri
                    </Label>
                    <p className="text-sm text-gray-600">
                      {quote?.vehicle_brand} {quote?.vehicle_model} (
                      {quote?.vehicle_year})
                    </p>
                    <p className="text-sm text-gray-600">
                      Plaka: {quote?.vehicle_plate}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Policy Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Poliçe Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="policyNumber">Poliçe Numarası *</Label>
                    <Input
                      id="policyNumber"
                      value={policyData.policyNumber}
                      onChange={(e) =>
                        setPolicyData({
                          ...policyData,
                          policyNumber: e.target.value,
                        })
                      }
                      placeholder="POL-2024-001"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={policyData.startDate}
                        onChange={(e) =>
                          setPolicyData({
                            ...policyData,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Bitiş Tarihi *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={policyData.endDate}
                        onChange={(e) =>
                          setPolicyData({
                            ...policyData,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notlar</Label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={policyData.notes}
                      onChange={(e) =>
                        setPolicyData({ ...policyData, notes: e.target.value })
                      }
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Poliçe ile ilgili notlar..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scraped Quotes Comparison */}
          {scrapedLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
            </div>
          ) : (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sigorta Şirketi Teklifleri</CardTitle>
                <CardDescription>
                  En uygun teklifi seçin ve poliçe oluşturun
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scrapedQuotes?.map((scrapedQuote: any) => (
                    <Card
                      key={scrapedQuote.id}
                      className={`cursor-pointer transition-all ${
                        selectedQuote?.id === scrapedQuote.id
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedQuote(scrapedQuote)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {scrapedQuote.company_logo && (
                              <img
                                src={scrapedQuote.company_logo}
                                alt={scrapedQuote.company_name}
                                className="h-8 w-8 rounded mr-2"
                              />
                            )}
                            <h3 className="font-semibold">
                              {scrapedQuote.company_name}
                            </h3>
                          </div>
                          {selectedQuote?.id === scrapedQuote.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>

                        <Separator className="my-3" />

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Prim:</span>
                            <span className="font-semibold">
                              {formatCurrency(scrapedQuote.premium)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              İndirim:
                            </span>
                            <span className="text-green-600">
                              -{formatCurrency(scrapedQuote.discount)}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>Final Fiyat:</span>
                            <span className="text-blue-600">
                              {formatCurrency(scrapedQuote.final_price)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Badge
                            variant={
                              scrapedQuote.status === "scraped"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {scrapedQuote.status === "scraped"
                              ? "Hazır"
                              : scrapedQuote.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {scrapedQuotes?.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Henüz teklif bulunamadı.</p>
                  </div>
                )}

                {selectedQuote && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleCreatePolicy}
                      disabled={createPolicyMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createPolicyMutation.isPending
                        ? "Oluşturuluyor..."
                        : "Poliçe Oluştur"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
