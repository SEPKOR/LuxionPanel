# Luxion OS

> Personal dashboard & cloud OS yang self-hosted — ringan, modular, dan terintegrasi AI.

Luxion OS adalah aplikasi web berbasis **Next.js 15** yang menyediakan lingkungan kerja personal lengkap dalam browser. Dibangun dengan 13+ modul produktivitas, monitoring sistem real-time, manajemen file, AI chat (Ollama & OpenAI), dan autentikasi user — semuanya dapat di-deploy dalam satu perintah Docker.

---

## ✨ Fitur

### 14 Modul Terintegrasi

| Modul | Ikon | Deskripsi |
|---|---|---|
| **Home** | 🏠 | Jam, salam, cuaca, statistik ringkas, shortcut, dan aktivitas terbaru |
| **Dashboard** | 📊 | Command center ringkas untuk status modul dan overview sistem |
| **Homelab** | 🖥️ | Monitoring real-time: CPU, RAM, disk, jaringan, Docker container, ping, uptime |
| **Notes** | 📝 | Catatan Markdown lengkap dengan tag, kategori, pin, autosave, dan pencarian |
| **Tasks** | ✅ | Todo list dengan prioritas, progress tracker, due date, dan status selesai |
| **Files** | 📁 | Upload, download, hapus, folder, preview gambar (WebP + thumbnail via Sharp) |
| **Gallery** | 🖼️ | Galeri foto dengan album, lazy grid, lightbox, dan metadata EXIF |
| **Music** | 🎵 | Playlist FLAC-ready, album art, shuffle, repeat |
| **Bookmarks** | 🔖 | Bookmark terorganisir dengan kategori, favicon auto-fetch, drag sort |
| **AI Chat** | ✨ | Chat dengan LLM (Ollama lokal / OpenAI API) + tool-calling ke data dashboard |
| **Analytics** | 📈 | Statistik penyimpanan, jumlah file/note/task, uptime, grafik ringan |
| **Terminal** | ⬛ | Easter-egg command overlay: matrix rain, neofetch, fortune, help, dll. |
| **Settings** | ⚙️ | Tema (dark/light), bahasa (EN/ID), animasi, timezone, backup/restore |
| **Admin** | 🛡️ | Manajemen user (khusus administrator): list, reset password, hapus |

### Kemampuan Lain

- **Global Search** — `Ctrl+K` mencari di seluruh modul sekaligus
- **Responsive Design** — Mobile-first dengan navigasi drawer
- **Autentikasi** — Register/login dengan JWT (NextAuth), scrypt password hashing
- **AI Tool-Calling** — AI dapat mencari notes, cek tasks, baca statistik homelab, list file, dan lainnya
- **Enkripsi** — API key tersimpan terenkripsi (AES-256-GCM)
- **Rate Limiting** — Perlindungan API abuse
- **Health Check** — Endpoint `/health` + Docker HEALTHCHECK
- **Disable Modules** — Nonaktifkan modul via env variable `NEXT_PUBLIC_LUXION_DISABLED_MODULES`

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 15.5 (App Router, Turbopack) |
| **Frontend** | React 19, Tailwind CSS v4, Framer Motion |
| **Bahasa** | TypeScript 5 (strict mode) |
| **Database** | SQLite via Prisma ORM 6 |
| **Auth** | NextAuth v4 (Credentials provider, JWT session) |
| **AI/LLM** | Ollama (lokal) + OpenAI-compatible API |
| **Image** | Sharp (JPEG/PNG → WebP, thumbnail) |
| **Validasi** | Zod v4 |
| **Ikoni** | Lucide React |
| **Testing** | Vitest + Testing Library |
| **Deploy** | Docker (multi-stage build, docker-compose) |

---

## 🚀 Getting Started

### Prasyarat

- **Node.js** 22+
- **npm** 10+
- (Opsional) **Docker** & **Docker Compose** untuk deployment produksi
- (Opsional) **Ollama** untuk AI chat lokal

### Instalasi Development

```bash
# 1. Clone repository
git clone https://github.com/username/luxion-os.git
cd luxion-os

# 2. Install dependencies
npm install

# 3. Copy dan isi environment variables
cp .env.example .env
# Edit .env — setidaknya isi NEXTAUTH_SECRET dan LUXION_ENCRYPTION_KEY

# 4. Generate Prisma client & migrate database
npx prisma generate
npx prisma migrate dev --name init

# 5. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Deploy dengan Docker

```bash
# 1. Copy .env.example ke .env dan isi semua variabel
cp .env.example .env

# 2. Build dan jalankan
docker compose up -d

# 3. Jalankan migrasi database di container
docker compose exec luxion npx prisma migrate deploy
```

Aplikasi berjalan di `http://localhost:3000`.

---

## ⚙️ Environment Variables

Salin `.env.example` menjadi `.env` dan sesuaikan nilainya:

| Variabel | Default | Deskripsi |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Path database SQLite |
| `NEXTAUTH_URL` | `http://localhost:3000` | URL aplikasi untuk NextAuth |
| `NEXTAUTH_SECRET` | *(wajib diisi)* | Secret JWT (min. 12 karakter) |
| `LUXION_APP_NAME` | `Luxion OS` | Nama aplikasi yang tampil di UI |
| `LUXION_PUBLIC_URL` | `http://localhost:3000` | Public URL aplikasi |
| `LUXION_ENCRYPTION_KEY` | *(wajib diisi)* | Kunci enkripsi AES-256 (min. 32 karakter) |
| `LUXION_STORAGE_PATH` | `./storage` | Direktori penyimpanan file |
| `LUXION_BACKUP_PATH` | `./backups` | Direktori backup |
| `LUXION_UPLOAD_MAX_MB` | `25` | Maksimal ukuran upload file (MB) |
| `LUXION_RATE_LIMIT_WINDOW_MS` | `60000` | Window rate limiting (ms) |
| `LUXION_RATE_LIMIT_MAX` | `120` | Maksimal request per window |
| `LUXION_DOCKER_ENABLED` | `false` | Aktifkan monitoring Docker container |
| `LUXION_PING_TARGETS` | `cloudflare.com,github.com` | Target ping check (koma-separated) |
| `LUXION_OLLAMA_URL` | `http://localhost:11434` | URL endpoint Ollama |
| `LUXION_OLLAMA_MODEL` | `llama3.1` | Model Ollama yang digunakan |
| `OPENAI_COMPATIBLE_BASE_URL` | *(kosong)* | Base URL untuk OpenAI-compatible API |
| `OPENAI_API_KEY` | *(kosong)* | API key OpenAI |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model OpenAI yang digunakan |
| `NEXT_PUBLIC_LUXION_DISABLED_MODULES` | *(kosong)* | Daftar modul yang dinonaktifkan (koma-separated) |

Untuk generate secret yang aman:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🏗️ Arsitektur

```
luxion-os/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Halaman login & register
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/            # Shell dashboard + modul dinamis
│   │   └── layout.tsx
│   ├── api/v1/                 # REST API endpoints (13 route)
│   │   ├── homelab/
│   │   ├── stats/
│   │   ├── ai/chat/
│   │   ├── auth/register/
│   │   ├── user/profile/
│   │   ├── user/api-keys/
│   │   ├── admin/users/
│   │   ├── notes/
│   │   ├── tasks/
│   │   ├── files/
│   │   ├── bookmarks/
│   │   ├── music/
│   │   └── backup/
│   └── health/route.ts
├── components/                 # Komponen UI
│   ├── layout/                 # Shell, sidebar, header, search
│   └── ui/                     # Button, Card, Badge, Input, etc.
├── modules/                    # 13 modul aplikasi
│   ├── home/
│   ├── dashboard/
│   ├── homelab/
│   ├── notes/
│   ├── tasks/
│   ├── files/
│   ├── gallery/
│   ├── music/
│   ├── bookmarks/
│   ├── ai/
│   ├── analytics/
│   ├── terminal/
│   ├── settings/
│   └── admin/
├── lib/                        # Library & business logic
│   ├── auth.ts                 # Konfigurasi NextAuth
│   ├── config.ts               # Zod validasi env + disabled modules
│   ├── modules.ts              # Registry modul
│   ├── system.ts               # Monitoring CPU/RAM/Disk/Docker
│   ├── ai-tools.ts             # 10 AI tool definitions
│   ├── file-storage.ts         # File system + Sharp processing
│   ├── crypto.ts               # AES-256-GCM enkripsi API keys
│   ├── session.ts              # Auth guard utilities
│   ├── api.ts                  # Response helper, rate limiter
│   ├── password.ts             # scrypt hashing
│   └── utils.ts                # cn(), formatBytes(), dll.
├── prisma/
│   └── schema.prisma           # 8 model: User, Note, Task, Bookmark,
│                               #   ApiKey, ChatMessage, StoredFile, MusicTrack
├── scripts/
│   └── healthcheck.mjs         # Docker HEALTHCHECK script
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # Docker Compose configuration
├── vitest.config.ts            # Test runner config
└── next.config.ts              # Next.js config (standalone, CSP, headers)
```

---

## 🤖 AI Integration

Luxion OS mendukung dua provider AI:

1. **Ollama** (lokal) — jalankan model LLM di mesin sendiri
2. **OpenAI-compatible** — gunakan API OpenAI atau alternatif yang kompatibel

### AI Tools (Tool-Calling)

AI Chat dapat memanggil 10 tools untuk berinteraksi dengan data dashboard Anda:

| Tool | Fungsi |
|---|---|
| `search_notes` | Mencari catatan berdasarkan query |
| `get_note_by_id` | Membaca satu catatan secara detail |
| `list_tasks` | Menampilkan daftar tugas |
| `create_task` | Membuat tugas baru |
| `toggle_task` | Menandai tugas selesai/belum |
| `get_homelab_stats` | Membaca statistik CPU/RAM/Disk/Docker |
| `list_files` | Menampilkan file yang tersimpan |
| `system_info` | Informasi umum sistem |
| `get_dashboard_summary` | Ringkasan dashboard |
| `search_bookmarks` | Mencari bookmark |

API keys disimpan terenkripsi (AES-256-GCM) dan dapat dikelola per-user melalui Settings → API Keys.

---

## 📦 Scripts

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Build production |
| `npm start` | Jalankan production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Jalankan test suite (Vitest) |
| `npm run test:watch` | Test dalam watch mode |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Buat dan jalankan migrasi database |
| `npm run db:deploy` | Jalankan migrasi di production |
| `npm run health` | Jalankan health check script |

---

## 🧪 Testing

```bash
# Jalankan semua test
npm test

# Watch mode
npm run test:watch
```

Test menggunakan **Vitest** + **Testing Library** dengan **jsdom** environment.

---

## 🔒 Keamanan

- Password di-hash dengan **scrypt** (Node.js crypto), timing-safe comparison
- API keys dienkripsi **AES-256-GCM** sebelum disimpan
- JWT session via **NextAuth** dengan secret kuat
- **Rate limiting** per-IP untuk mencegah abuse
- **Security headers**: Content-Security-Policy, HSTS, XSS Protection, dll.
- Semua user data di-cascade on delete

---

## 🌍 Multi-Bahasa

UI mendukung dua bahasa yang disimpan per-user:
- 🇬🇧 English (`en`)
- 🇮🇩 Bahasa Indonesia (`id`)

Bahasa dikonfigurasi di Settings dan disimpan di profil user.

---

## 📄 Lisensi

MIT License

---

**Dibangun dengan** [Next.js](https://nextjs.org), [React](https://react.dev), [Prisma](https://prisma.io), [Tailwind CSS](https://tailwindcss.com) — self-hosted, no vendor lock-in.
