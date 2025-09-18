# 🎬 Panduan Website Streaming DramaYuk

Website streaming film sederhana yang menggunakan API DramaYuk untuk menonton drama dan film.

## 📋 Fitur Website

- **Halaman Beranda**: Menampilkan film-film terbaru
- **Pencarian Film**: Cari film berdasarkan judul
- **Video Player**: Putar episode film dengan kontrol lengkap
- **Responsive Design**: Tampilan yang bagus di desktop dan mobile

## 🚀 Cara Menjalankan Website

### 1. Install Dependencies
```bash
npm install
```

### 2. Jalankan Server
```bash
npm start
```

### 3. Buka Browser
Akses website di: `http://localhost:3001`

## 📁 Struktur Project

```
├── frontend/           # File website (HTML, CSS, JS)
│   ├── index.html     # Halaman utama
│   ├── style.css      # Styling website
│   └── script.js      # Logika frontend
├── backend/           # Server backend
│   ├── server.js      # Server utama
│   └── api/           # API endpoints
│       ├── latest.js  # API film terbaru
│       ├── search.js  # API pencarian
│       └── stream.js  # API streaming
├── get-token.js       # Fungsi untuk mendapatkan token
└── package.json       # Konfigurasi project
```

## 🎯 Cara Menggunakan Website

### 1. Melihat Film Terbaru
- Buka website di browser
- Film terbaru akan otomatis tampil di halaman beranda
- Klik pada poster film untuk mulai menonton

### 2. Mencari Film
- Klik menu "Cari Film" di header
- Ketik judul film yang ingin dicari
- Klik tombol "Cari" atau tekan Enter
- Hasil pencarian akan tampil di bawah

### 3. Menonton Film
- Klik pada poster film yang ingin ditonton
- Modal video player akan terbuka
- Pilih episode yang ingin ditonton dari dropdown
- Klik tombol "Putar" untuk mulai streaming
- Gunakan kontrol video untuk pause, volume, dll.

## 🔧 Kustomisasi

### Mengubah Tampilan
Edit file `frontend/style.css` untuk mengubah:
- Warna tema website
- Layout dan spacing
- Font dan ukuran teks
- Animasi dan efek hover

### Menambah Fitur
Edit file `frontend/script.js` untuk menambah:
- Fitur bookmark/favorit
- Rating dan review
- Kategori film
- History tontonan

### Mengubah API
Edit file di folder `backend/api/` untuk:
- Menambah parameter pencarian
- Mengubah format data
- Menambah endpoint baru

## 🐛 Troubleshooting

### Website Tidak Bisa Diakses
- Pastikan server berjalan dengan `npm start`
- Cek apakah port 3001 tidak digunakan aplikasi lain
- Lihat pesan error di terminal

### Film Tidak Muncul
- Cek koneksi internet
- Pastikan API DramaYuk dapat diakses
- Lihat console browser (F12) untuk error

### Video Tidak Bisa Diputar
- Cek apakah link streaming valid
- Pastikan browser mendukung format video
- Coba refresh halaman

## 📝 Tips untuk Pemula

1. **Belajar HTML/CSS/JavaScript**: Website ini menggunakan teknologi web dasar
2. **Pahami API**: Pelajari cara kerja API di file `get-token.js` dan folder `backend/api/`
3. **Gunakan Developer Tools**: Tekan F12 di browser untuk debug
4. **Backup Code**: Simpan perubahan code Anda secara berkala
5. **Eksperimen**: Coba ubah warna, layout, atau tambah fitur baru

## 🎨 Ide Pengembangan

- Tambah sistem login/register
- Buat playlist film favorit
- Tambah komentar dan rating
- Buat mode dark/light theme
- Tambah notifikasi film baru
- Buat aplikasi mobile dengan React Native

## ⚠️ Catatan Penting

- Website ini hanya untuk pembelajaran
- Pastikan menggunakan API sesuai terms of service
- Jangan lupa backup data penting
- Test website di berbagai browser dan device

Selamat belajar dan berkreasi! 🚀