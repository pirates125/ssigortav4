### Gereksinimler

- Go 1.21+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Kurulum

```bash
git clone https://github.com/pirates125/ssigortav4.git
cd ssigortav4
```

```bash
cd server
cp .env.example .env
# .env dosyasını düzenleyin
go mod download
go run cmd/api/main.go
```

```bash
cd client
npm install
npm run dev
```

```
http://localhost:3000
```

- **Email:** admin@eesigorta.com
- **Şifre:** password
