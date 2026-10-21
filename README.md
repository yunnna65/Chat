# ChatK

Prototipe antarmuka chat mobile-first berdasarkan PRD ChatK.

## Menjalankan

```bash
npm install
npm run dev
```

Buka URL lokal yang ditampilkan Next.js. `npm run build` menjalankan build production.

## Yang tersedia di demo

- Berpindah antara obrolan, kontak, dan status.
- Mengirim pesan lokal, membalas dengan swipe kanan di layar sentuh atau menu balas di desktop, dan melampirkan gambar, video, atau audio hingga 25 MB.
- Mengirim permintaan kontak demo dan membuat status teks/media yang hilang setelah 24 jam.
- Tema terang/gelap mengikuti preferensi perangkat dan tersimpan di browser.

Data percakapan demo hanya berada di memori sesi browser. Autentikasi Google, sinkronisasi real-time, enkripsi end-to-end, penyimpanan lintas perangkat, dan penghapusan server 15 hari belum aktif karena proyek Supabase belum dikonfigurasi. Jangan gunakan demo ini untuk mengirim data pribadi.