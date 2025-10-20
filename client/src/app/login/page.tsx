"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLogin, useVerify2FA } from "@/hooks/useApi";
import { Eye, EyeOff, Shield, Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const twoFASchema = z.object({
  code: z.string().length(6, "2FA kodu 6 haneli olmalıdır"),
});

type TwoFAFormData = z.infer<typeof twoFASchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [user, setUser] = useState<any>(null);

  const loginMutation = useLogin();
  const verify2FAMutation = useVerify2FA();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@eesigorta.com",
      password: "password",
    },
  });

  const twoFAForm = useForm<TwoFAFormData>({
    resolver: zodResolver(twoFASchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      setUser(response.data.user);

      if (response.data.requires_2fa) {
        setRequires2FA(true);
      } else {
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      // Error is handled by the mutation
    }
  };

  const onTwoFASubmit = async (data: TwoFAFormData) => {
    try {
      await verify2FAMutation.mutateAsync(data);
      router.push("/dashboard");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ees-blue to-ees-emerald p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ees-blue/10">
              <Shield className="h-6 w-6 text-ees-blue" />
            </div>
            <CardTitle>2FA Doğrulaması</CardTitle>
            <CardDescription>
              {user?.email} için 2FA kodunu giriniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={twoFAForm.handleSubmit(onTwoFASubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="code">2FA Kodu</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  {...twoFAForm.register("code")}
                  className="text-center text-lg tracking-widest"
                />
                {twoFAForm.formState.errors.code && (
                  <p className="text-sm text-red-500">
                    {twoFAForm.formState.errors.code.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verify2FAMutation.isPending}
              >
                {verify2FAMutation.isPending ? "Doğrulanıyor..." : "Doğrula"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setRequires2FA(false)}
              >
                Geri Dön
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ees-blue to-ees-emerald p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ees-blue/10">
            <Shield className="h-6 w-6 text-ees-blue" />
          </div>
          <CardTitle className="text-2xl font-bold">EESigorta Portal</CardTitle>
          <CardDescription>Şube/Acente Yönetim Sistemi</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={loginForm.handleSubmit(onLoginSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@eesigorta.com"
                  className="pl-10"
                  {...loginForm.register("email")}
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...loginForm.register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
