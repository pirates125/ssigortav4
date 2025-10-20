"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, FileText, TrendingUp } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-ees-blue to-ees-emerald flex items-center justify-center p-4">
      <div className="text-center text-white">
        <div className="mb-8">
          <Shield className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">EESigorta Portal</h1>
          <p className="text-xl opacity-90">Şube/Acente Yönetim Sistemi</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <Users className="h-8 w-8 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Müşteri Yönetimi</h3>
            <p className="text-sm opacity-80">
              Müşteri bilgilerini kolayca yönetin
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <FileText className="h-8 w-8 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Poliçe İşlemleri</h3>
            <p className="text-sm opacity-80">Poliçe oluşturma ve takibi</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <TrendingUp className="h-8 w-8 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Raporlama</h3>
            <p className="text-sm opacity-80">Detaylı raporlar ve analizler</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm opacity-70">Yönlendiriliyor...</p>
        </div>
      </div>
    </div>
  );
}
