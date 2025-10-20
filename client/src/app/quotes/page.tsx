"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, CheckCircle } from "lucide-react";

export default function QuotesPage() {
  const router = useRouter();
  const [quotes] = useState([
    {
      id: 1,
      customer_name: "Ahmet Yılmaz",
      coverage_type: "Kasko",
      vehicle: "BMW 5 Serisi 2020",
      status: "completed",
      created_at: "2024-01-15",
      quote_count: 5,
    },
    {
      id: 2,
      customer_name: "Ayşe Demir",
      coverage_type: "Trafik",
      vehicle: "Volkswagen Golf 2021",
      status: "processing",
      created_at: "2024-01-14",
      quote_count: 0,
    },
    {
      id: 3,
      customer_name: "Mehmet Kaya",
      coverage_type: "Kasko",
      vehicle: "Mercedes C200 2022",
      status: "pending",
      created_at: "2024-01-13",
      quote_count: 0,
    },
  ]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      approved: "bg-purple-100 text-purple-800",
    };

    const labels = {
      pending: "Beklemede",
      processing: "İşleniyor",
      completed: "Tamamlandı",
      approved: "Onaylandı",
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sigorta Teklifleri
          </h1>
          <p className="text-gray-600 mt-1">
            Müşterileriniz için sigorta teklifleri oluşturun ve karşılaştırın
          </p>
        </div>
        <Button onClick={() => router.push("/quotes/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Teklif
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teklif Listesi</CardTitle>
          <CardDescription>Tüm sigorta teklifleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Müşteri</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Sigorta Türü
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Araç</th>
                  <th className="text-left py-3 px-4 font-medium">Durum</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Teklif Sayısı
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Tarih</th>
                  <th className="text-left py-3 px-4 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">
                      {quote.customer_name}
                    </td>
                    <td className="py-3 px-4">{quote.coverage_type}</td>
                    <td className="py-3 px-4">{quote.vehicle}</td>
                    <td className="py-3 px-4">
                      {getStatusBadge(quote.status)}
                    </td>
                    <td className="py-3 px-4">
                      {quote.quote_count > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {quote.quote_count} teklif
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{quote.created_at}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {quote.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/quotes/${quote.id}/comparison`)
                            }
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Karşılaştır
                          </Button>
                        )}
                        {quote.status === "pending" && (
                          <Button size="sm" variant="outline" disabled>
                            <Clock className="h-4 w-4 mr-1" />
                            Bekliyor
                          </Button>
                        )}
                        {quote.status === "approved" && (
                          <Button size="sm" variant="outline" disabled>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Onaylandı
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
