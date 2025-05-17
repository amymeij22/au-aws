# Aplikasi Monitoring AWS (Automatic Weather Station)

Aplikasi web untuk memonitor dan mengelola data dari Automatic Weather Station (AWS).

## Fitur

- **Dashboard Real-time** - Tampilan data cuaca real-time dan historis
- **Admin Panel** - Manajemen stasiun, MQTT, dan pengguna
- **Integrasi Supabase** - Database PostgreSQL, autentikasi, dan penyimpanan data
- **MQTT over WebSocket** - Komunikasi real-time dengan broker HiveMQ
- **Responsif** - Tampilan yang adaptif untuk desktop dan mobile
- **Anti-Duplikasi Data** - Sistem yang mencegah duplikasi data dari multiple client
- **Keamanan** - Autentikasi admin dengan password hashing

## Teknologi yang Digunakan

- **Next.js** - Framework React untuk aplikasi web
- **TypeScript** - Bahasa pemrograman dengan tipe statis
- **Supabase** - Backend as a Service (PostgreSQL + Auth)
- **MQTT.js** - Klien MQTT untuk koneksi WebSocket
- **TailwindCSS** - Framework CSS
- **Shadcn UI** - Komponen UI yang dapat dikustomisasi
- **Chart.js/Recharts** - Visualisasi data dalam bentuk grafik
- **React Hook Form** - Manajemen form dan validasi

## Arsitektur Sistem

Aplikasi ini menggunakan arsitektur client-server dengan komponen utama:

1. **Client** - Aplikasi Next.js yang berjalan di browser pengguna
2. **Supabase** - Database PostgreSQL untuk penyimpanan data stasiun dan cuaca
3. **MQTT Broker** - HiveMQ cloud untuk pengiriman data real-time dari AWS
4. **AWS Device** - Perangkat yang mengukur dan mengirim data cuaca melalui MQTT

Aliran data:
- AWS device mengirim data ke MQTT broker
- Aplikasi web berlangganan topic MQTT untuk menerima data secara real-time
- Data disimpan ke Supabase untuk akses historis
- Dashboard menampilkan data real-time dan historis

## Memulai

### Prasyarat

- Node.js 18+ dan npm/pnpm
- Akun Supabase
- Akun HiveMQ Cloud (opsional, dapat menggunakan broker publik)

### Instalasi

1. Kloning repositori ini
   ```bash
   git clone https://github.com/amymeij22/au-aws
   cd au-aws
   ```

2. Instal dependensi
   ```bash
   npm install
   # atau
   pnpm install
   ```

3. Buat file `.env.local` dengan variabel berikut:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Setup database
   ```bash
   node setup-database.js
   ```

5. Jalankan server pengembangan
   ```bash
   npm run dev
   # atau
   pnpm dev
   ```

6. Buka [http://localhost:3000](http://localhost:3000) dengan browser untuk melihat hasilnya.

## Struktur Database

### Tabel `stations`
Menyimpan data stasiun AWS:
- `id`: UUID unik untuk stasiun
- `name`: Nama stasiun
- `wmo_number`: Nomor WMO stasiun
- `latitude`: Koordinat lintang
- `longitude`: Koordinat bujur
- `elevation`: Ketinggian dari permukaan laut
- `created_at`: Timestamp pembuatan record

### Tabel `weather_data`
Menyimpan data pengukuran cuaca:
- `id`: UUID unik untuk data cuaca
- `timestamp`: Waktu pengukuran data
- `temperature`: Suhu udara (°C)
- `humidity`: Kelembapan relatif (%)
- `pressure`: Tekanan udara (hPa)
- `radiation`: Radiasi matahari (W/m²)
- `wind_speed`: Kecepatan angin (m/s)
- `wind_direction`: Arah angin (derajat)
- `rainfall`: Curah hujan (mm/jam)
- `station_id`: ID stasiun pengukur
- `created_at`: Timestamp pembuatan record

### Tabel `admins`
Menyimpan data admin aplikasi:
- `id`: UUID unik untuk admin
- `username`: Username untuk login
- `password`: Password yang di-hash dengan pgcrypto
- `full_name`: Nama lengkap admin
- `role`: Peran admin
- `created_at`: Timestamp pembuatan record
- `last_login`: Timestamp login terakhir

### Tabel `mqtt_config`
Menyimpan konfigurasi koneksi MQTT:
- `id`: UUID unik untuk konfigurasi
- `url`: URL broker MQTT
- `port`: Port broker MQTT
- `topic`: Topic yang dilanggan
- `username`: Username broker MQTT
- `password`: Password broker MQTT
- `is_active`: Status aktif konfigurasi
- `created_at`: Timestamp pembuatan record

## Integrasi MQTT WebSocket

Aplikasi ini menggunakan MQTT over WebSocket untuk menerima data real-time dari stasiun AWS dengan format berikut:

```json
{
  "Temp": 27.5,
  "Rh": 68.2,
  "wind.Direction": 240,
  "wind.Speed": 3.8,
  "pressure": 1012.3,
  "radiation": 634.2,
  "precipitation": 0.5,
  "timestamp": "2023-05-20T08:45:12.000Z"
}
```

## Sistem Anti-Duplikasi Data

Aplikasi dilengkapi sistem canggih untuk mencegah duplikasi data ketika beberapa client terhubung ke broker MQTT yang sama:

1. **Multi-layer Prevention:**
   - **In-memory Cache** - Menggunakan `useRef` untuk menyimpan timestamp data yang sudah diproses
   - **Shared Storage** - Menggunakan localStorage untuk sinkronisasi antar tab
   - **BroadcastChannel API** - Memungkinkan komunikasi antar tab secara realtime
   - **Database Validation** - Pengecekan duplikasi langsung di level database

2. **MQTT Optimizations:**
   - **QoS Level 2** - Menerapkan quality of service "exactly once" di broker MQTT
   - **Persistent Client ID** - Menyimpan client ID di localStorage untuk konsistensi koneksi
   - **Clean Session: false** - Menjaga status subscribe antar koneksi

3. **Polling & Realtime Data:**
   - **Centralized Polling** - Satu tab aktif melakukan polling database
   - **Supabase Realtime** - Menggunakan fitur realtime subscription untuk notifikasi data baru
   - **Auto-refresh Dashboard** - Dashboard secara otomatis memuat data terbaru

4. **Cross-tab Coordination:**
   - **Tab Leader Election** - Hanya satu tab yang melakukan polling database
   - **Leader Health Checks** - Pemilihan leader baru jika leader saat ini tidak aktif
   - **Shared Timestamp Registry** - Registry timestamp data yang sudah diproses digunakan bersama

Pendekatan ini memastikan data yang sama tidak disimpan berulang kali meskipun ada banyak tab/perangkat yang terhubung secara bersamaan, dan semua klien tetap menampilkan data realtime yang konsisten.

## Autentikasi dan Keamanan

Aplikasi memiliki sistem autentikasi admin dengan:
- Password hashing
- Functions dan triggers di PostgreSQL untuk keamanan
- Session management dan validasi

## Pengembangan Lanjutan

- Untuk menambahkan stasiun baru, gunakan halaman admin
- Untuk mengubah konfigurasi MQTT, gunakan halaman MQTT di panel admin
- Untuk menambahkan, mengubah, atau menghapus admin, gunakan halaman Admin di panel admin

## Kontribusi

Kontribusi sangat diterima! Jika ingin berkontribusi:
1. Fork repositori
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## Lisensi

[MIT](LICENSE)
