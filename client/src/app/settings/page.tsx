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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Save,
} from "lucide-react";
import { useMe, useLogout } from "@/hooks/useApi";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: me, isLoading: meLoading } = useMe();
  const logoutMutation = useLogout();

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    privacy: {
      profileVisible: true,
      dataSharing: false,
    },
    appearance: {
      theme: "light",
      language: "tr",
    },
    system: {
      autoSave: true,
      debugMode: false,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !meLoading && !me) {
      router.push("/login");
    }
  }, [me, meLoading, router, mounted]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
  };

  const handleSave = () => {
    // Save settings logic here
    toast.success("Ayarlar kaydedildi!");
  };

  if (!mounted || meLoading) {
    return <div>Loading...</div>;
  }

  if (!me) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        onLogout={handleLogout}
        user={{ email: me.data?.email || "", role: me.data?.role || "" }}
      />
      <div className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
            <p className="text-muted-foreground">Sistem ayarlarını yönetin</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil Ayarları
                </CardTitle>
                <CardDescription>Kişisel bilgilerinizi yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    value={me.data?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input
                    id="role"
                    value={me.data?.role || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="2fa">2FA Durumu</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="2fa"
                      checked={me.data?.two_fa_enabled || false}
                      disabled
                    />
                    <Label htmlFor="2fa">
                      {me.data?.two_fa_enabled ? "Etkin" : "Devre Dışı"}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Görünüm Ayarları
                </CardTitle>
                <CardDescription>
                  Tema ve görünüm tercihlerinizi ayarlayın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <span className="text-sm text-muted-foreground">
                      Dark/Light Mode
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Dil</Label>
                  <Input
                    id="language"
                    value="Türkçe"
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Bildirim Ayarları
                </CardTitle>
                <CardDescription>
                  Bildirim tercihlerinizi yönetin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-posta Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      E-posta ile bildirim al
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          email: checked,
                        },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Tarayıcı push bildirimleri
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          push: checked,
                        },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      SMS ile bildirim al
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.sms}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          sms: checked,
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gizlilik Ayarları
                </CardTitle>
                <CardDescription>
                  Gizlilik ve güvenlik tercihlerinizi ayarlayın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profil Görünürlüğü</Label>
                    <p className="text-sm text-muted-foreground">
                      Profilinizi diğer kullanıcılara göster
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.profileVisible}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        privacy: {
                          ...settings.privacy,
                          profileVisible: checked,
                        },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Veri Paylaşımı</Label>
                    <p className="text-sm text-muted-foreground">
                      Anonim veri paylaşımına izin ver
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.dataSharing}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        privacy: {
                          ...settings.privacy,
                          dataSharing: checked,
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Sistem Ayarları
                </CardTitle>
                <CardDescription>
                  Sistem ve performans ayarlarını yönetin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Otomatik Kaydetme</Label>
                      <p className="text-sm text-muted-foreground">
                        Değişiklikleri otomatik kaydet
                      </p>
                    </div>
                    <Switch
                      checked={settings.system.autoSave}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          system: {
                            ...settings.system,
                            autoSave: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Debug Modu</Label>
                      <p className="text-sm text-muted-foreground">
                        Geliştirici modunu etkinleştir
                      </p>
                    </div>
                    <Switch
                      checked={settings.system.debugMode}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          system: {
                            ...settings.system,
                            debugMode: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Ayarları Kaydet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
