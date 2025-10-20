#!/bin/bash

# EESigorta Portal - Hızlı Kurulum Script
# Bu script projeyi hızlıca kurmak için kullanılır

set -e

echo "🚀 EESigorta Portal Kurulumu Başlatılıyor..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker kurulu değil. Lütfen önce Docker'ı kurun."
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose kurulu değil. Lütfen önce Docker Compose'u kurun."
    exit 1
fi

echo "✅ Docker ve Docker Compose bulundu"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 .env dosyası oluşturuluyor..."
    cp env.example .env
    echo "✅ .env dosyası oluşturuldu"
else
    echo "ℹ️  .env dosyası zaten mevcut"
fi
echo ""

# Start Docker containers
echo "🐳 Docker container'ları başlatılıyor..."
docker-compose -f deployments/docker-compose.yml up -d postgres redis
echo "✅ Veritabanı servisleri başlatıldı"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ PostgreSQL'in hazır olması bekleniyor..."
sleep 5

# Run migrations
echo "🗄️  Veritabanı migrationları çalıştırılıyor..."
docker-compose -f deployments/docker-compose.yml exec -T postgres psql -U eesigorta -d eesigorta < migrations/0001_init.sql || true
echo "✅ Migration'lar tamamlandı"
echo ""

# Seed database
echo "🌱 Örnek veri ekleniyor..."
docker-compose -f deployments/docker-compose.yml exec -T postgres psql -U eesigorta -d eesigorta < migrations/seed.sql || true
echo "✅ Seed data eklendi"
echo ""

# Install frontend dependencies
echo "📦 Frontend bağımlılıkları kuruluyor..."
cd client && npm install --legacy-peer-deps && cd ..
echo "✅ Frontend bağımlılıkları kuruldu"
echo ""

# Build backend
echo "🔨 Backend build ediliyor..."
cd server && go build -o api cmd/api/main.go && cd ..
echo "✅ Backend build edildi"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Kurulum tamamlandı!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Uygulamayı başlatmak için:"
echo "   make dev"
echo ""
echo "📝 Demo Hesaplar:"
echo "   Admin:   admin@eesigorta.com / Pass123!"
echo "   Manager: manager@eesigorta.com / Pass123!"
echo "   Agent:   agent@eesigorta.com / Pass123!"
echo ""
echo "🌐 Erişim URL'leri:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   Asynqmon:    http://localhost:8081"
echo "   MinIO:       http://localhost:9001"
echo "   Grafana:     http://localhost:3001"
echo ""
echo "📚 Daha fazla bilgi için README.md dosyasına bakın"
echo ""

