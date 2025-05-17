**Product Requirement Document (PRD)**

**Project Title:**
Website Monitoring Automatic Weather Station (AWS) untuk Mendukung Operasional Penerbangan TNI AU

**Dokumen Disusun Oleh:**
berdasarkan Proposal Ricky Ardy Syahputra dan Permintaan User

**Tanggal:**
16 Mei 2025

---

## 1. Pendahuluan

### 1.1 Latar Belakang

Website ini dikembangkan untuk memonitor data Automatic Weather Station (AWS) yang digunakan dalam mendukung operasional penerbangan TNI AU. Sistem ini dirancang untuk menyajikan data cuaca secara real-time, menyimpan data historis, dan memungkinkan pengelolaan metadata serta pengguna melalui antarmuka yang aman, cepat, dan responsif.

### 1.2 Tujuan

* Menyediakan platform monitoring cuaca real-time berbasis web.
* Menyimpan dan mengelola data AWS untuk keperluan analisis jangka panjang.
* Menyediakan antarmuka admin untuk manajemen metadata dan konfigurasi sistem.
* Memberikan akses data yang fleksibel dan mudah dipahami oleh pengguna militer.

---

## 2. Stakeholder

| Role           | Description                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| Admin          | Bertugas memantau dan mengelola seluruh data dan konfigurasi sistem melalui login khusus. |
| User/Viewer    | Pengguna umum yang dapat mengakses dashboard publik tanpa perlu login.        |

---

## 3. Fitur Utama

### 3.1 Dashboard (Halaman Utama)

* Halaman publik tanpa perlu login
* Menggunakan header dan footer untuk navigasi (tanpa sidebar)
* Menampilkan metadata singkat stasiun:
  * Nama Stasiun
  * No. WMO
  * Koordinat (Latitude, Longitude)

* Menampilkan grafik dan angka real-time dari sensor cuaca (tanpa scroll pada layar desktop).
* Parameter yang ditampilkan:

  * Suhu (derajat Celsius) - card dengan nilai terbaru dan grafik 24 jam terakhir
  * Kelembapan relatif (%) - card dengan nilai terbaru dan grafik 24 jam terakhir
  * Tekanan udara (hPa) - card dengan nilai terbaru saja
  * Radiasi matahari (W/m^2) - card dengan nilai terbaru dan grafik 24 jam terakhir
  * Kecepatan dan arah angin - tampilan kompas dengan indikator arah angin dan nilai kecepatan di tengah (m/s)
  * Curah hujan (mm/jam) - card dengan nilai terbaru saja

* Data grafik 24 jam terakhir di-reset setiap pukul 00.00 GMT+0 (07.00 WIB)
* Terlihat saat data terakhir diterima
* Tampilan responsif dan adaptif (mobile & desktop)
* Toggle antara mode terang dan gelap (dark/light theme)

### 3.2 Login System

* Khusus untuk admin saja (akses ke panel admin)
* Autentikasi berbasis Supabase
* Input: Email & Password
* Validasi dan pengelolaan sesi admin
* Login button hanya terlihat di footer untuk akses panel admin

### 3.3 Pengelolaan Admin (CRUD Admin)

* Tabel daftar admin dengan opsi:

  * Tambah admin baru
  * Edit data admin (email, nama)
  * Hapus admin
* Form tambah/edit admin:

  * Nama Lengkap (teks)
  * Email (email format)
  * Password (hash & store securely)

### 3.4 CRUD Metadata Stasiun

* Tabel metadata stasiun:

  * ID Stasiun
  * Nama Stasiun
  * No. WMO
  * Lokasi (Latitude, Longitude)
  * Ketinggian (mdpl)

* Form input/edit metadata:

  * Nama Stasiun (teks)
  * No. WMO (angka)
  * Latitude (angka)
  * Longitude (angka)
  * Elevasi (angka)

### 3.5 Pengelolaan WebSocket MQTT & Data Processing

* Alamat WebSocket digunakan untuk menerima data real-time dari AWS
* Form input:

  * URL WebSocket (contoh: `wss://broker.hivemq.com:8884/mqtt`)
  * Status (Aktif/Nonaktif)
  * Topic untuk subscribe (misal: `aws/tniau/#`)
* Dapat diubah oleh admin melalui antarmuka
* Validasi URL secara format
* Konfigurasi MQTT broker oleh admin sistem

#### 3.5.1 Subscription dan Data Processing

* Subscription ke WebSocket MQTT berjalan otomatis segera setelah aplikasi dimuat di browser
* Subscription aktif pada semua halaman aplikasi (dashboard maupun admin)
* Sistem secara otomatis:
  * Subscribe ke topic MQTT yang telah dikonfigurasi
  * Menerima data
  * Melakukan parsing data
  * Menyimpan data ke database Supabase

#### 3.5.2 Pencegahan Duplikasi Data

* Implementasi deduplication dengan identifier unik (kombinasi timestamp + ID sensor)
* Verifikasi data sebelum penyimpanan ke database
* Pengecekan data duplikat dengan timestamp resolusi tinggi (millisecond)
* Implementasi algoritma idempotent untuk memastikan data yang sama tidak tersimpan berulang kali meskipun ada banyak klien yang terhubung secara bersamaan

### 3.6 Data Cuaca Historis

* Tabel histori data:

  * Waktu pengukuran
  * Parameter cuaca lengkap (suhu, kelembapan, tekanan, dll.)
* Fitur:

  * Filter berdasarkan tanggal rentang
  * Unduh data (CSV/XLSX)
  * Hapus data (dengan konfirmasi)

---

## 4. Desain Antarmuka (UI/UX)

### 4.1 Dark/Light Theme

* Pilihan mode terang dan gelap
* Palet warna utama:

  * \#eff6ff, #dbeafe, #bfdbfe, #93c5fd, #60a5fa, #3b82f6, #2563eb, #1d4ed8, #1e40af, #1e3a8a, #172554

### 4.2 Layout Responsif

* Desktop:

  * Dashboard tampil satu layar penuh (tanpa scroll)
  * Navigasi melalui header dan footer
* Mobile:

  * Komponen di-stack vertikal
  * Header dengan menu hamburger (tanpa sidebar)

---

## 5. Teknologi yang Digunakan

| Komponen   | Teknologi                                    |
| ---------- | -------------------------------------------- |
| Frontend   | React.js + Next.js                           |
| Backend    | Supabase (PostgreSQL + Auth + Storage)       |
| Realtime   | WebSocket MQTT (via HiveMQ atau broker lain) |
| Deployment | Vercel                                       |
| Tools Dev  | VS Code, GitHub, ESLint                      |

---

## 6. Keamanan

* HTTPS endpoint
* Validasi input sisi klien dan server
* Autentikasi JWT Supabase khusus untuk admin
* Dashboard publik tidak memerlukan login
* Panel admin terlindungi dengan login
* Log out otomatis admin setelah idle 15 menit

---

## 7. Validasi & Pengujian

| Jenis Tes           | Deskripsi                                                       |
| ------------------- | --------------------------------------------------------------- |
| Unit Test           | Setiap komponen UI dan fungsi JS                                |
| Integration Test    | Validasi komunikasi antar modul: login -> dashboard -> database |
| Responsiveness Test | Uji pada resolusi mobile, tablet, dan desktop                   |
| Load Test           | Simulasi banyak data cuaca masuk secara bersamaan               |
| Concurrency Test    | Verifikasi tidak ada duplikasi data saat banyak browser terhubung |
| Data Integrity Test | Validasi keunikan data yang tersimpan di database               |

---

## 8. Timeline (Estimasi)

| Tahap                      | Durasi   |
| -------------------------- | -------- |
| Desain UI/UX               | 1 minggu |
| Setup Supabase dan MQTT    | 1 minggu |
| Pengembangan Frontend      | 2 minggu |
| Integrasi dan pengujian    | 2 minggu |
| Finalisasi dan dokumentasi | 1 minggu |

---

## 9. Catatan Tambahan

* Sistem ini dikembangkan dengan prinsip fleksibilitas tinggi untuk pengoperasian di wilayah terpencil.
* Data dari sensor akan diproses secara lokal oleh data logger (misal CR310-WIFI) sebelum dikirim via MQTT ke platform.
* Backup database otomatis mingguan.
* Arsitektur WebSocket memastikan data tetap konsisten meskipun ada banyak pengguna yang mengakses situs secara bersamaan.
* Struktur data MQTT harus konsisten dengan format berikut (contoh):
  ```json
  {
    "station_id": "AWS001",
    "timestamp": "2025-05-16T09:30:45.123Z",
    "parameters": {
      "temperature": 27.5,
      "humidity": 85.2,
      "pressure": 1013.2,
      "radiation": 750.8,
      "wind_speed": 4.2,
      "wind_direction": 180,
      "rainfall": 0.5
    }
  }
  ```

---

**END OF DOCUMENT**
