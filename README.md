# KataKita

Prototipe aplikasi pembelajaran kosakata bahasa Inggris berbasis React + Vite.

Versi ini memakai alur level CEFR A1–C2 lalu tema di dalam setiap level. Data awal berisi 8 tema dan 160 kosakata, contoh kalimat dengan arti per kata, definisi bahasa Inggris dengan arti Indonesia yang dapat dibuka, suara browser, navigator materi 1–20, progres akun, serta empat mode latihan gratis: pilihan ganda, susun huruf, listening gambar, dan susun kalimat dengan drag-and-drop/tap.

## Menjalankan

```bash
npm install
npm run dev
```

## Build untuk Vercel

```bash
npm run build
```

Import folder ini ke Vercel. Build command: `npm run build`; output directory: `dist`.

## Akses dan progres

Seluruh materi dan empat mode latihan tersedia gratis tanpa login. Pengunjung dapat belajar dan berlatih, sedangkan progres dan nilai hanya disimpan setelah pengguna masuk atau mendaftar. Folder `supabase/` berisi fondasi autentikasi dan penyimpanan yang dapat dihubungkan ketika backend mulai dipasang.

## Backend materi

`supabase/schema.sql` sekarang menyediakan tabel `levels`, `themes`, dan `vocabulary` dengan kebijakan baca publik. `supabase/seed.sql` berisi seed dari materi awal aplikasi (160 kosakata) agar bisa diimpor ke Supabase. Materi A1–C2 yang lebih luas harus ditambahkan dari konten yang dibuat sendiri atau sumber yang memiliki lisensi; Cambridge EVP/Dictionary digunakan sebagai referensi level, bukan sumber yang boleh disalin massal.

Untuk memasukkan materi EVP yang Anda catat atau ekspor secara sah, siapkan CSV dengan kolom `level,theme,english,indonesian,definition,definition_id,example,example_translation`, lalu jalankan:

```bash
node scripts/import-evp.mjs data/evp.csv > supabase/evp-import.sql
```

Periksa SQL hasilnya sebelum menjalankan di Supabase. Jangan mengunggah file ekspor EVP ke repository publik.

## Autentikasi

Form masuk/daftar saat ini merupakan demo lokal agar seluruh alur UI dapat diuji. Sebelum produksi, hubungkan ke Supabase Auth dan aktifkan **Confirm email**. Validasi `type="email"` hanya memeriksa format; konfirmasi Supabase membuktikan pengguna dapat membuka inbox email tersebut.
