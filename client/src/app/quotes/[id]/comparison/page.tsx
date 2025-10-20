"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  ArrowUpDown,
  CheckCircle,
  Star,
  FileText,
  Download,
} from "lucide-react";
import { useMe, useLogout, useQuote, useScrapedQuotes } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function QuoteComparisonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
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
  const { data: quoteData, isLoading: quoteLoading } = useQuote(parseInt(id));
  const { data: scrapedQuotesData, isLoading: scrapedLoading } =
    useScrapedQuotes(parseInt(id));

  const [sortBy, setSortBy] = useState<"price" | "discount" | "company">(
    "price"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const quote = quoteData?.data;
  const scrapedQuotes = scrapedQuotesData?.data || [];

  // Sort quotes
  const sortedQuotes = [...scrapedQuotes].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "price":
        comparison = a.final_price - b.final_price;
        break;
      case "discount":
        comparison = a.discount - b.discount;
        break;
      case "company":
        comparison = a.company_name.localeCompare(b.company_name);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (column: "price" | "discount" | "company") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleApproveQuote = async (scrapedQuoteId: number) => {
    try {
      router.push(
        `/policies/new?quote_id=${id}&scraped_quote_id=${scrapedQuoteId}`
      );
    } catch (error) {
      toast.error("Poliçe oluşturma başarısız");
    }
  };

  const getLowestPrice = () => {
    if (scrapedQuotes.length === 0) return 0;
    return Math.min(...scrapedQuotes.map((q: any) => q.final_price));
  };

  const lowestPrice = getLowestPrice();

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
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Fiyat Karşılaştırması
            </h1>
            <p className="text-gray-600">
              Teklif #{id} için tüm sigorta şirketi tekliflerini karşılaştırın
            </p>
          </div>

          {quoteLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
            </div>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Teklif Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Müşteri</p>
                    <p className="font-semibold">
                      {quote?.customer?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ürün</p>
                    <p className="font-semibold">
                      {quote?.product?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Araç</p>
                    <p className="font-semibold">
                      {quote?.vehicle_brand} {quote?.vehicle_model} (
                      {quote?.vehicle_year})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plaka</p>
                    <p className="font-semibold">
                      {quote?.vehicle_plate || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Comparison Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Fiyat Karşılaştırması</CardTitle>
                  <CardDescription>
                    {scrapedQuotes.length} şirket teklifi - En düşük fiyat:{" "}
                    {formatCurrency(lowestPrice)}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Excel İndir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {scrapedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("company")}
                          className="hover:bg-transparent"
                        >
                          Şirket
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Prim</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("discount")}
                          className="hover:bg-transparent"
                        >
                          İndirim
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("price")}
                          className="hover:bg-transparent"
                        >
                          Net Fiyat
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Fark</TableHead>
                      <TableHead className="text-right">Durum</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedQuotes.map((quote: any, index: number) => {
                      const isLowest = quote.final_price === lowestPrice;
                      const priceDiff = quote.final_price - lowestPrice;
                      const diffPercent =
                        lowestPrice > 0
                          ? ((priceDiff / lowestPrice) * 100).toFixed(1)
                          : 0;

                      return (
                        <TableRow
                          key={quote.id}
                          className={
                            isLowest ? "bg-green-50 hover:bg-green-100" : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {index + 1}
                            {isLowest && (
                              <Star className="inline-block ml-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {quote.company_logo && (
                                <img
                                  src={quote.company_logo}
                                  alt={quote.company_name}
                                  className="h-6 w-6 rounded mr-2"
                                />
                              )}
                              <span className="font-semibold">
                                {quote.company_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(quote.premium)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            -{formatCurrency(quote.discount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-bold text-lg ${
                                isLowest ? "text-green-600" : ""
                              }`}
                            >
                              {formatCurrency(quote.final_price)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {priceDiff > 0 ? (
                              <span className="text-red-600">
                                +{formatCurrency(priceDiff)} (+{diffPercent}%)
                              </span>
                            ) : (
                              <span className="text-green-600 font-semibold">
                                En Düşük
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                quote.status === "scraped"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {quote.status === "scraped"
                                ? "Hazır"
                                : quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleApproveQuote(quote.id)}
                              className={
                                isLowest
                                  ? "bg-green-600 hover:bg-green-700"
                                  : ""
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {isLowest ? "En İyi Teklif" : "Seç"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {scrapedQuotes.length === 0 && !scrapedLoading && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Henüz teklif bulunamadı.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Scraper çalıştırılarak teklifler toplanabilir.
                  </p>
                </div>
              )}

              {scrapedQuotes.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">💡 İpucu</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Tablo başlıklarına tıklayarak sıralama yapabilirsiniz
                    </li>
                    <li>• Yeşil satır en uygun fiyatı gösterir</li>
                    <li>• "Fark" sütunu en düşük fiyata göre fark gösterir</li>
                    <li>
                      • Excel indir butonuyla tüm teklifleri indirebilirsiniz
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
