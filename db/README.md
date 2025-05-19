# Database Setup untuk AWS Monitoring

File SQL dalam direktori ini berisi setup dan fungsi khusus untuk database PostgreSQL di Supabase.

## Menjalankan File SQL

1. Buka [Supabase Dashboard](https://app.supabase.io)
2. Pilih project Anda
3. Buka SQL Editor
4. Copy-paste isi file SQL atau upload file SQL
5. Jalankan query

## File SQL

### `weather_data_constraints.sql`

File ini menambahkan:
1. **Unique constraint** pada kolom `timestamp` untuk mencegah duplikasi data
2. **Index** pada kolom `timestamp` untuk mempercepat pencarian
3. **Fungsi `remove_weather_data_duplicates()`** untuk membersihkan data duplikat yang mungkin sudah ada
4. **Fungsi `check_weather_data_exists()`** untuk efisiensi pengecekan data

## Menjalankan Fungsi SQL

### Membersihkan Data Duplikat

```sql
SELECT remove_weather_data_duplicates();
```

Fungsi ini akan mengembalikan jumlah baris yang dihapus.

### Memeriksa Keberadaan Data

```sql
SELECT check_weather_data_exists('2023-07-01T12:00:00Z');
```

Fungsi ini akan mengembalikan `true` jika data dengan timestamp tersebut sudah ada, atau `false` jika belum.

## Implementasi Upsert Pattern

Aplikasi AWS Monitoring menggunakan pola upsert untuk mencegah duplikasi data saat menerima data dari MQTT:

```js
// Menggunakan .upsert() dengan onConflict dan ignoreDuplicates
await supabase
  .from('weather_data')
  .upsert([{ ... data ... }], { 
    onConflict: 'timestamp',
    ignoreDuplicates: true 
  })
```

Ini akan:
1. Menyisipkan data baru jika timestamp belum ada
2. Mengabaikan penyisipan jika timestamp sudah ada

## Troubleshooting Koneksi MQTT

Jika koneksi MQTT sering terputus:

1. Jalankan SQL untuk membersihkan data duplikat yang mungkin ada
2. Pastikan unique constraint pada kolom timestamp aktif
3. Pastikan aplikasi berjalan dengan QoS 1 (bukan QoS 2)
4. Jika masalah berlanjut, periksa koneksi internet atau server MQTT 