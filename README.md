# Zidental Clinic — Daily Checklist

Aplikasi **Daily Checklist / Task Management** untuk operasional klinik.
Dibangun dengan HTML, CSS, dan JavaScript murni — **tanpa backend, tanpa
database server, tanpa proses build**. Semua data tersimpan di
`localStorage` browser, dan aplikasi siap langsung di-host di **GitHub
Pages**.

---

## 1. Struktur File

```
clinic-checklist/
│
├── index.html     # Struktur halaman & semua section (Dashboard, Checklist, dst)
├── style.css       # Semua styling (desain, warna, responsive)
├── script.js       # Semua logika aplikasi (data, render, interaksi)
└── README.md       # Dokumen ini
```

Tidak ada file lain yang dibutuhkan. Tidak ada `node_modules`, tidak ada
`package.json`.

---

## 2. Cara Menjalankan di Komputer

Karena aplikasi ini murni HTML/CSS/JS, cukup buka filenya:

1. Download / clone folder `clinic-checklist`.
2. Klik dua kali file **`index.html`**, atau buka lewat browser
   (Chrome, Edge, Safari, Firefox).
3. Aplikasi langsung berjalan — tidak perlu server, tidak perlu instalasi.

> Tips: beberapa browser membatasi fitur tertentu saat file dibuka lewat
> `file://`. Jika ada kendala, gunakan Live Server (lihat langkah di
> Visual Studio Code) atau langsung host di GitHub Pages.

---

## 3. Cara Membuka di Visual Studio Code

1. Buka Visual Studio Code.
2. Pilih **File → Open Folder…**, lalu pilih folder `clinic-checklist`.
3. Install extension **Live Server** (oleh Ritwick Dey) dari tab Extensions.
4. Klik kanan pada `index.html` → **Open with Live Server**.
5. Browser akan terbuka otomatis dan aplikasi berjalan dengan live-reload.

---

## 4. Cara Upload ke GitHub

1. Buat repository baru di GitHub, misalnya `clinic-checklist`.
2. Di folder project, jalankan di terminal:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: clinic daily checklist app"
   git branch -M main
   git remote add origin https://github.com/USERNAME/clinic-checklist.git
   git push -u origin main
   ```

   Ganti `USERNAME` dengan username GitHub Anda.

   Alternatif tanpa terminal: buka repository di GitHub → **Add file →
   Upload files** → drag & drop keempat file di atas → **Commit changes**.

---

## 5. Cara Mengaktifkan GitHub Pages

1. Buka repository di GitHub.
2. Masuk ke **Settings → Pages**.
3. Pada **Source**, pilih branch `main` dan folder `/ (root)`.
4. Klik **Save**.
5. Tunggu beberapa saat, GitHub akan memberikan URL seperti:

   ```
   https://USERNAME.github.io/clinic-checklist/
   ```

6. Buka URL tersebut — aplikasi checklist klinik sudah live dan bisa
   diakses dari HP maupun desktop.

---

## 6. Login & Access Control (Baru)

Aplikasi sekarang punya **layar login**. Setiap staff punya akun
(nama, role, username, password) dan hanya bisa melihat dashboard &
checklist sesuai role-nya.

**Akun demo bawaan:**

| Nama   | Role              | Username | Password   |
| ------ | ----------------- | -------- | ---------- |
| Dhimas | Head of Clinic    | dhimas   | admin123   |
| Meli   | Reception         | meli     | meli123    |
| Widia  | Dental Assistant  | widia    | widia123   |
| Rani   | Admin             | rani     | rani123    |

**Yang bisa dilakukan Head of Clinic saja:**
- Menambah, mengedit, atau menghapus akun staff (nama, role, username,
  password) lewat **Settings → Access Control**.
- Menambah/mengedit/menghapus task (halaman **Tasks**).
- Melihat semua task di Daily Checklist & Dashboard (semua role).

**Yang dilihat role lain (Reception, Dental Assistant, Admin):**
- Dashboard & Daily Checklist **hanya menampilkan task yang di-assign
  ke role mereka** (atau "All Staff").
- Tidak ada menu **Tasks** atau **Access Control** di sidebar mereka.
- Mereka hanya bisa menyelesaikan/reset task miliknya, dan mengganti
  password sendiri lewat **Settings → Your Profile**.

**Penting — batasan teknis:** karena aplikasi ini murni
client-side (tanpa server/database), sistem login ini bersifat untuk
**personalisasi & pemisahan tampilan per role**, bukan keamanan data
sungguhan — siapa pun yang membuka DevTools browser tetap bisa melihat
seluruh data di `localStorage`. Untuk keamanan multi-user yang
sesungguhnya (banyak device, data tidak bisa diakses lintas akun),
aplikasi perlu dikembangkan dengan backend + database sungguhan.

---

## 7. Cara Mengganti Nama Klinik & Cabang

1. Buka aplikasi, masuk ke halaman **Settings**.
2. Pada kartu **Clinic Settings**, ubah **Clinic Name** dan pilih
   **Branch**.
3. Klik **Save Clinic Settings**. Header dan seluruh halaman otomatis
   memakai nama/cabang yang baru.

Untuk mengganti nama & role staff yang sedang aktif (siapa yang sedang
memakai aplikasi), gunakan kartu **Your Profile** di halaman yang sama.

---

## 7. Cara Menambahkan Task

**Dari halaman Daily Checklist atau Tasks:**

1. Klik tombol **+ Add Task**.
2. Isi form: Task Name, Category, Priority, Assigned To, Due Time
   (opsional), dan centang **Required** bila wajib dikerjakan.
3. Klik **Add Task**.

Task baru langsung muncul di checklist hari ini dan akan otomatis
muncul lagi setiap hari berikutnya (karena tersimpan sebagai *task
template*).

Untuk **mengedit** atau **menghapus** task, klik ikon **•••** pada
task card di Daily Checklist, atau ikon pensil/tempat sampah di
halaman **Tasks**.

> Catatan: hanya role **Head of Clinic** yang dapat menambah, mengedit,
> atau menghapus task. Role lain (Reception, Dental Assistant, Admin)
> hanya dapat menyelesaikan/mereset task yang menjadi tanggung jawabnya.

---

## 8. Cara Reset Data

1. Buka halaman **Settings**.
2. Scroll ke kartu **Reset Demo Data**.
3. Klik **Reset Demo Data**, lalu konfirmasi.
4. Seluruh data di `localStorage` akan dihapus dan digantikan dengan
   data demo awal (24 task template + 2 hari riwayat contoh).

---

## 9. Cara Kerja Data (ringkas)

Semua data disimpan di `localStorage` browser dengan key berikut:

| Key                | Isi                                                        |
| ------------------- | ----------------------------------------------------------- |
| `task_templates`    | Daftar task rutin (template) yang dipakai untuk membangun checklist setiap hari |
| `daily_records`      | Riwayat checklist per tanggal (`{ "2026-08-13": {...} }`), bersifat **immutable** untuk tanggal yang sudah lewat |
| `activity_logs`      | Log setiap aktivitas (task dibuat, diselesaikan, direset, diedit, dihapus) |
| `clinic_settings`    | Nama klinik, cabang, dan profil user yang sedang aktif      |
| `clinic_users`       | Daftar staff untuk keperluan filter History & Staff Performance |

Setiap kali tanggal berganti, aplikasi otomatis membuat **daily
snapshot** baru berisi salinan seluruh task template dengan status
`Pending`, tanpa mengubah data hari-hari sebelumnya.

Karena semuanya tersimpan di browser (bukan server), data hanya
tersedia di perangkat/browser yang sama. Untuk penggunaan multi-staff
di banyak perangkat sekaligus, aplikasi ini perlu dikembangkan lebih
lanjut dengan backend/database — di luar cakupan versi ini.

---

## 10. Kompatibilitas

- ✅ Tidak butuh Node.js, npm, React, Vite, atau build tool apa pun.
- ✅ Tidak butuh database eksternal (Firebase/Supabase/dll).
- ✅ 100% siap dijalankan langsung dari `index.html`.
- ✅ 100% siap di-host di GitHub Pages.
- ✅ Responsive: desktop (sidebar), tablet, dan mobile (bottom
  navigation + hamburger menu).
