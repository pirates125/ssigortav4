"use client";

import { useState } from "react";
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
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  PlayCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function ScraperAdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);

  // Simulated data
  const [targets] = useState([
    {
      id: 1,
      name: "Anadolu Sigorta",
      logo_url: "https://via.placeholder.com/50",
      base_url: "https://www.anadolusigorta.com.tr",
      is_active: true,
      use_headless: false,
      last_run: "2024-01-15 10:30",
      success_rate: 98,
    },
    {
      id: 2,
      name: "Allianz",
      logo_url: "https://via.placeholder.com/50",
      base_url: "https://www.allianz.com.tr",
      is_active: true,
      use_headless: true,
      last_run: "2024-01-15 10:28",
      success_rate: 95,
    },
    {
      id: 3,
      name: "Mapfre",
      logo_url: "https://via.placeholder.com/50",
      base_url: "https://www.mapfre.com.tr",
      is_active: true,
      use_headless: false,
      last_run: "2024-01-15 10:25",
      success_rate: 92,
    },
    {
      id: 4,
      name: "Aksigorta",
      logo_url: "https://via.placeholder.com/50",
      base_url: "https://www.aksigorta.com.tr",
      is_active: false,
      use_headless: true,
      last_run: "2024-01-14 15:20",
      success_rate: 88,
    },
  ]);

  const [scraperRuns] = useState([
    {
      id: 1,
      target_name: "Anadolu Sigorta",
      status: "completed",
      total_quotes: 45,
      successful_quotes: 44,
      failed_quotes: 1,
      started_at: "2024-01-15 10:30:00",
      completed_at: "2024-01-15 10:32:15",
      duration: "2m 15s",
    },
    {
      id: 2,
      target_name: "Allianz",
      status: "completed",
      total_quotes: 38,
      successful_quotes: 36,
      failed_quotes: 2,
      started_at: "2024-01-15 10:28:00",
      completed_at: "2024-01-15 10:30:45",
      duration: "2m 45s",
    },
    {
      id: 3,
      target_name: "Mapfre",
      status: "running",
      total_quotes: 30,
      successful_quotes: 25,
      failed_quotes: 0,
      started_at: "2024-01-15 10:25:00",
      completed_at: null,
      duration: "7m 30s",
    },
  ]);

  const handleRunScraper = (targetId: number) => {
    toast.success("Scraper başlatıldı!");
  };

  const handleToggleActive = (targetId: number) => {
    toast.success("Hedef durumu güncellendi!");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      running: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };

    const labels = {
      completed: "Tamamlandı",
      running: "Çalışıyor",
      failed: "Başarısız",
      pending: "Bekliyor",
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
          <h1 className="text-2xl font-bold text-gray-900">Scraper Yönetimi</h1>
          <p className="text-gray-600 mt-1">
            Sigorta şirketlerinden otomatik fiyat çekme ayarları
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tümünü Çalıştır
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hedef
          </Button>
        </div>
      </div>

      {/* Scraper Targets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sigorta Şirketleri</CardTitle>
          <CardDescription>Scraper hedefleri ve durumları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {targets.map((target) => (
              <Card
                key={target.id}
                className={`${
                  target.is_active ? "border-ees-blue" : "border-gray-300"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-semibold text-ees-blue">
                          {target.name.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{target.name}</h3>
                        <p className="text-xs text-gray-500">
                          {target.use_headless ? "Headless" : "Colly"}
                        </p>
                      </div>
                    </div>
                    {target.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Başarı Oranı:</span>
                      <span className="font-semibold text-green-600">
                        %{target.success_rate}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Son Çalışma:</span>
                      <span className="text-gray-700">{target.last_run}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleRunScraper(target.id)}
                      disabled={!target.is_active}
                    >
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Çalıştır
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(target.id)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Scraper Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Son Scraper Çalışmaları</CardTitle>
          <CardDescription>Detaylı çalışma logları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Hedef</th>
                  <th className="text-left py-3 px-4 font-medium">Durum</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Toplam Teklif
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Başarılı</th>
                  <th className="text-left py-3 px-4 font-medium">Başarısız</th>
                  <th className="text-left py-3 px-4 font-medium">Süre</th>
                  <th className="text-left py-3 px-4 font-medium">Başlangıç</th>
                </tr>
              </thead>
              <tbody>
                {scraperRuns.map((run) => (
                  <tr key={run.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{run.target_name}</td>
                    <td className="py-3 px-4">{getStatusBadge(run.status)}</td>
                    <td className="py-3 px-4">{run.total_quotes}</td>
                    <td className="py-3 px-4 text-green-600">
                      {run.successful_quotes}
                    </td>
                    <td className="py-3 px-4 text-red-600">
                      {run.failed_quotes}
                    </td>
                    <td className="py-3 px-4">{run.duration}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {run.started_at}
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
