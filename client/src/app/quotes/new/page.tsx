"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

const quoteSchema = z.object({
  customer_id: z.string().min(1, "Müşteri seçiniz"),
  coverage_type: z.string().min(1, "Sigorta türü seçiniz"),
  vehicle_plate: z.string().optional(),
  vehicle_year: z.string().optional(),
  vehicle_brand: z.string().optional(),
  vehicle_model: z.string().optional(),
  start_date: z.string().min(1, "Başlangıç tarihi gerekli"),
  end_date: z.string().min(1, "Bitiş tarihi gerekli"),
  additional_info: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function NewQuotePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customer_id: "",
      coverage_type: "kasko",
      vehicle_plate: "",
      vehicle_year: "",
      vehicle_brand: "",
      vehicle_model: "",
      start_date: "",
      end_date: "",
      additional_info: "",
    },
  });

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    try {
      // API call will be implemented
      console.log("Quote data:", data);
      toast.success(
        "Teklif talebiniz oluşturuldu! Sigorta şirketlerinden fiyatlar çekiliyor..."
      );
      setTimeout(() => {
        router.push("/quotes");
      }, 2000);
    } catch (error) {
      toast.error("Teklif oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Geri
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Sigorta Teklifi</CardTitle>
          <CardDescription>
            Müşteriniz için sigorta teklifi oluşturun. Sistem otomatik olarak
            tüm sigorta şirketlerinden fiyat çekecektir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customer_id">Müşteri</Label>
              <select
                id="customer_id"
                {...form.register("customer_id")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Müşteri seçiniz</option>
                <option value="1">Ahmet Yılmaz (12345678901)</option>
                <option value="2">Ayşe Demir (23456789012)</option>
                <option value="3">Mehmet Kaya (34567890123)</option>
              </select>
              {form.formState.errors.customer_id && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.customer_id.message}
                </p>
              )}
            </div>

            {/* Coverage Type */}
            <div className="space-y-2">
              <Label htmlFor="coverage_type">Sigorta Türü</Label>
              <select
                id="coverage_type"
                {...form.register("coverage_type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="kasko">Kasko</option>
                <option value="trafik">Trafik Sigortası</option>
                <option value="dask">DASK</option>
                <option value="saglik">Sağlık Sigortası</option>
              </select>
            </div>

            {/* Vehicle Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_plate">Araç Plakası</Label>
                <Input
                  id="vehicle_plate"
                  placeholder="34 ABC 123"
                  {...form.register("vehicle_plate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_year">Araç Yılı</Label>
                <Input
                  id="vehicle_year"
                  type="number"
                  placeholder="2020"
                  {...form.register("vehicle_year")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_brand">Araç Markası</Label>
                <Input
                  id="vehicle_brand"
                  placeholder="BMW"
                  {...form.register("vehicle_brand")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_model">Araç Modeli</Label>
                <Input
                  id="vehicle_model"
                  placeholder="5 Serisi"
                  {...form.register("vehicle_model")}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Başlangıç Tarihi</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...form.register("start_date")}
                />
                {form.formState.errors.start_date && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.start_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Bitiş Tarihi</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...form.register("end_date")}
                />
                {form.formState.errors.end_date && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
              <Label htmlFor="additional_info">Ek Bilgiler</Label>
              <textarea
                id="additional_info"
                rows={4}
                placeholder="Özel notlar, talepler..."
                {...form.register("additional_info")}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Oluşturuluyor..." : "Teklif Oluştur"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
