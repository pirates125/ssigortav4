# EESigorta Branch/Agency Portal

Modern sigorta acente yönetim sistemi - Go backend + Next.js frontend

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Go 1.21+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Kurulum

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/pirates125/ssigortav4.git
cd ssigortav4
```

2. **Backend'i başlatın**
```bash
cd server
cp .env.example .env
# .env dosyasını düzenleyin
go mod download
go run cmd/api/main.go
```

3. **Frontend'i başlatın**
```bash
cd client
npm install
npm run dev
```

4. **Tarayıcıda açın**
```
http://localhost:3000
```

### 🔑 Varsayılan Giriş
- **Email:** admin@eesigorta.com
- **Şifre:** password

## 📋 Özellikler

- ✅ **Kimlik Doğrulama** - JWT + 2FA
- ✅ **Müşteri Yönetimi** - CRUD işlemleri
- ✅ **Teklif Karşılaştırması** - Fiyat analizi
- ✅ **Poliçe Yönetimi** - Oluşturma ve takip
- ✅ **Raporlama** - Dashboard ve export
- ✅ **Web Scraping** - Otomatik teklif toplama

## 🛠️ Teknolojiler

**Backend:** Go, Gin, GORM, PostgreSQL, Redis  
**Frontend:** Next.js 15, TypeScript, TailwindCSS, shadcn/ui  
**DevOps:** Docker, Docker Compose

## 📁 Proje Yapısı

```
ssigortav4/
├── server/          # Go backend
├── client/          # Next.js frontend
├── deployments/     # Docker configs
└── migrations/      # DB migrations
```

## 🔧 Geliştirme

```bash
# Backend test
cd server && go test ./...

# Frontend test
cd client && npm test

# Docker ile çalıştır
docker-compose up -d
```

## 📞 Destek

Sorunlar için [Issues](https://github.com/pirates125/ssigortav4/issues) bölümünü kullanın.

---
**EESigorta** - Modern Sigorta Teknolojileri