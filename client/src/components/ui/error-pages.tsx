"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function ErrorPage({
  statusCode = 404,
  title = "Sayfa Bulunamadı",
  description = "Aradığınız sayfa mevcut değil veya taşınmış olabilir.",
  showRetry = false,
  onRetry,
}: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center animate-fade-in">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            {statusCode === 404 ? (
              <AlertTriangle className="w-8 h-8 text-destructive" />
            ) : (
              <RefreshCw className="w-8 h-8 text-destructive" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {statusCode}
            </CardTitle>
            <CardDescription className="text-lg mt-2">{title}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{description}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>

            {showRetry && onRetry && (
              <Button variant="outline" onClick={onRetry} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tekrar Dene
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <ErrorPage
      statusCode={404}
      title="Sayfa Bulunamadı"
      description="Aradığınız sayfa mevcut değil veya taşınmış olabilir."
    />
  );
}

export function ServerErrorPage() {
  return (
    <ErrorPage
      statusCode={500}
      title="Sunucu Hatası"
      description="Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
      showRetry={true}
      onRetry={() => window.location.reload()}
    />
  );
}

export function UnauthorizedPage() {
  return (
    <ErrorPage
      statusCode={403}
      title="Erişim Reddedildi"
      description="Bu sayfaya erişim yetkiniz bulunmuyor."
    />
  );
}
