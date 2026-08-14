# Zidental Clinic — Daily Checklist

Aplikasi **Daily Checklist / Task Management** untuk operasional klinik.
Dibangun dengan HTML, CSS, dan JavaScript murni — **tanpa proses build,
tanpa server custom**. Data tersimpan lokal di `localStorage` browser
untuk kecepatan, dan disinkronkan real-time lintas device lewat
**Firebase Firestore** (lihat bagian 7). Aplikasi siap langsung
di-host di **GitHub Pages**.

---

## 1. Struktur File

```
clinic-checklist/
│
├── index.html          # Struktur halaman & semua section (Dashboard, Checklist, dst)
├── style.css            # Semua styling (desain, warna, responsive)
├── script.js             # Semua logika aplikasi (data, render, interaksi)
├── firebase-sync.js      # Modul koneksi & sinkronisasi real-time ke Firestore
└── README.md             # Dokumen ini
```

Kelima file di atas **wajib** di-upload/hosting bersamaan (terutama
`firebase-sync.js` — kalau ketinggalan, aplikasi tetap jalan tapi
tanpa sync cloud, cuma localStorage per device). Tidak ada
`node_modules`, tidak ada `package.json`.

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
   Upload files** → drag & drop kelima file di atas → **Commit changes**.

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

## 6. Login, Access Control & Multi-Cabang

Aplikasi punya **layar login** dan setiap akun terikat ke **satu
cabang** (kecuali Super Admin, yang bisa lihat semua cabang). Staff
hanya melihat data cabangnya sendiri — checklist, dashboard, history,
reports, dan daftar akun di Access Control semuanya otomatis
terfilter sesuai cabang akun yang login.

**Akun demo bawaan:**

| Nama     | Role              | Cabang       | Username | Password   |
| -------- | ----------------- | ------------ | -------- | ---------- |
| Pak Zaki | Super Admin       | *Semua*      | owner    | owner123   |
| Dhimas   | Head of Clinic    | Karawaci     | dhimas   | admin123   |
| Meli     | Reception         | Karawaci     | meli     | meli123    |
| Widia    | Dental Assistant  | Karawaci     | widia    | widia123   |
| Rani     | Admin             | Karawaci     | rani     | rani123    |
| Fajar    | Head of Clinic    | Ciledug      | fajar    | fajar123   |
| Sinta    | Reception         | Ciledug      | sinta    | sinta123   |

**Tingkatan akses:**

- **Super Admin** — bisa lihat & kelola **semua cabang**. Muncul
  **Branch Switcher** di header untuk pindah-pindah "sedang melihat
  cabang mana". Bisa tambah/edit/hapus akun di cabang manapun, juga
  bisa membuat Super Admin lain.
- **Head of Clinic** — hanya bisa lihat & kelola **cabangnya sendiri**.
  Bisa tambah/edit/hapus akun staff (tidak bisa membuat Super Admin),
  dan tambah/edit/hapus task **khusus untuk cabangnya**.
- **Reception / Dental Assistant / Admin** — hanya melihat dashboard
  & checklist **cabangnya sendiri**, dan hanya task yang di-assign ke
  role mereka (atau "All Staff"). Tidak ada menu **Tasks** atau
  **Access Control**. Bisa ganti password sendiri lewat
  **Settings → Your Profile**.

**Contoh:** Widia (Dental Assistant, Karawaci) login → dashboard &
checklist dia cuma nampilin task Karawaci yang assigned ke Dental
Assistant. Fajar (Head of Clinic, Ciledug) login → dia kelola task &
akun staff Ciledug saja, tidak bisa lihat data Karawaci. Pak Zaki
(Super Admin) bisa switch antara Karawaci ↔ Ciledug ↔ cabang lain
kapan saja lewat dropdown di header.

**Penting — soal keamanan data:** sejak app ini terhubung ke
Firebase (lihat bagian 7), data **sudah sync real-time lintas
device**, tapi keamanan datanya bergantung pada **Firestore
Security Rules** yang Anda pasang di Firebase Console — bukan lagi
sekadar "yang penting UI-nya nyembunyiin menu". Wajib baca bagian 7
sebelum dipakai produksi, terutama soal mengganti *test mode* rules
(yang default terbuka untuk siapa saja) dengan rules yang benar.

---

## 7. Sinkronisasi Cloud (Firebase)

Mulai versi ini, aplikasi terhubung ke **Firebase Firestore** supaya
data **tersinkron otomatis lintas device secara real-time** — begitu
satu staff nambah/edit/hapus task atau akun, semua device lain yang
sedang membuka app langsung ter-update tanpa perlu refresh.

**File baru:** `firebase-sync.js` — modul terpisah yang menangani
koneksi ke Firestore. Wajib ikut di-upload/hosting bersama file
lainnya (`index.html` sudah otomatis memuatnya).

**Cara kerja singkat:**
- Setiap kali ada perubahan data (task, akun, dsb), aplikasi
  menyimpan ke `localStorage` (biar tetap instan/responsif) **dan**
  mendorong perubahan itu ke Firestore.
- Semua device yang sedang online otomatis "mendengarkan" perubahan
  dari Firestore lewat *realtime listener* — begitu ada update dari
  device lain, data & tampilan ikut ter-update otomatis.
- Kalau internet mati, aplikasi tetap bisa dipakai secara lokal
  (fallback ke `localStorage` saja) — begitu online lagi, otomatis
  sync lagi.

**⚠️ WAJIB: Amankan Firestore Security Rules**

Firestore secara default dibuat dalam **"test mode"**, yang artinya
**SIAPA SAJA di internet** yang tahu `projectId` Anda bisa
baca/tulis/hapus seluruh data klinik, dan mode ini **otomatis
terkunci total (tidak bisa diakses sama sekali) setelah 30 hari**
kalau tidak diganti. Sebelum dipakai produksi sungguhan:

1. Buka [Firebase Console](https://console.firebase.google.com) →
   pilih project → **Firestore Database → Rules**.
2. Ganti isi rules dengan versi yang membatasi akses (contoh dasar,
   sesuaikan lagi sesuai kebutuhan keamanan Anda):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /clinics/{clinicId}/data/{docId} {
         allow read, write: if true; // GANTI: minimal cek App Check
                                       // atau Firebase Auth di sini
       }
     }
   }
   ```

   Karena aplikasi ini belum memakai Firebase Authentication (login
   masih memakai sistem username/password kita sendiri, tersimpan di
   Firestore), rules Firestore **tidak bisa membedakan siapa yang
   login di dalam app** — itu murni diatur oleh JavaScript di
   browser. Untuk keamanan yang benar-benar kuat di level database
   (bukan cuma di level tampilan), pertimbangkan upgrade ke Firebase
   Authentication + rules berbasis `request.auth`, atau pasang
   **Firebase App Check** minimal supaya hanya app Anda yang bisa
   akses, bukan sembarang script dari internet.
3. Klik **Publish**.

**Batas gratis (Spark Plan):** Firestore gratis untuk sampai ~50.000
baca & ~20.000 tulis per hari — lebih dari cukup untuk klinik dengan
beberapa cabang dan belasan staff aktif.

---

## 8. Cara Mengganti Nama Klinik

1. Buka aplikasi, masuk ke halaman **Settings**.
2. Pada kartu **Clinic Settings**, ubah **Clinic Name**.
3. Klik **Save Clinic Settings**. Header otomatis memakai nama baru.

Nama klinik berlaku global untuk semua cabang. Cabang & role tiap
staff diatur lewat **Access Control** (lihat bagian 6), bukan lewat
Clinic Settings.

---

## 9. Cara Menambahkan Task

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

> Catatan: hanya role **Head of Clinic** dan **Super Admin** yang dapat
> menambah, mengedit, atau menghapus task — dan hanya untuk cabang yang
> sedang aktif/dilihat. Role lain (Reception, Dental Assistant, Admin)
> hanya dapat menyelesaikan/mereset task yang menjadi tanggung jawabnya.

---

## 10. Cara Reset Data

1. Buka halaman **Settings**.
2. Scroll ke kartu **Reset Demo Data**.
3. Klik **Reset Demo Data**, lalu konfirmasi.
4. Seluruh data di `localStorage` akan dihapus dan digantikan dengan
   data demo awal (akun & task template per cabang, plus 2 hari
   riwayat contoh untuk tiap cabang). Anda akan diarahkan kembali ke
   layar login.

---

## 11. Cara Kerja Data (ringkas)

Setiap perubahan data disimpan di **dua tempat sekaligus**:

1. **`localStorage` browser** (untuk kecepatan — app tetap responsif
   instan tanpa nunggu jaringan, dan tetap bisa dipakai offline).
2. **Firestore (cloud)** di bawah path `clinics/default/data/...` —
   inilah yang membuat semua device saling sinkron.

| Key (localStorage) | Dokumen di Firestore                | Isi |
| ------------------- | ------------------------------------ | --- |
| `task_templates`    | `clinics/default/data/task_templates` | Daftar task rutin (template) per cabang |
| `daily_records`      | `clinics/default/data/daily_records`  | Riwayat checklist per tanggal **+ cabang** (key gabungan `"2026-08-13__Karawaci"`), **immutable** untuk tanggal yang sudah lewat |
| `activity_logs`      | `clinics/default/data/activity_logs`  | Log tiap aktivitas (dibuat/diselesaikan/direset/diedit/dihapus), menyimpan cabang asalnya |
| `clinic_settings`    | `clinics/default/data/clinic_settings`| Nama klinik (berlaku global) |
| `clinic_users`       | `clinics/default/data/clinic_users`   | Daftar akun staff — nama, role, cabang, username, password |
| `clinic_session`     | *(tidak disync)*                      | Sesi login — sengaja hanya lokal per device, supaya login di 1 HP tidak otomatis login-kan HP lain |

Setiap kali tanggal berganti, aplikasi otomatis membuat **daily
snapshot** baru per cabang berisi salinan seluruh task template
cabang tsb dengan status `Pending`, tanpa mengubah data hari-hari
sebelumnya — snapshot ini juga otomatis tersync ke semua device.

Kalau device sedang offline, perubahan tetap tersimpan lokal dan
otomatis terkirim ke cloud begitu koneksi kembali. Kalau 2 device
mengubah data yang sama nyaris bersamaan saat sama-sama offline,
perubahan yang **terkirim ke cloud paling akhir yang menang**
(kebijakan *last-write-wins*) — bukan digabung otomatis.

---

## 12. Kompatibilitas

- ✅ Tidak butuh Node.js, npm, React, Vite, atau build tool apa pun.
- ✅ Sync data real-time lintas device via **Firebase Firestore**
  (lihat bagian 7) — sekali setup, gratis untuk skala klinik kecil.
- ✅ 100% siap dijalankan langsung dari `index.html` (tetap bisa
  offline, sync otomatis lagi saat online).
- ✅ 100% siap di-host di GitHub Pages — pastikan file
  `firebase-sync.js` ikut ter-upload.
- ✅ Responsive: desktop (sidebar), tablet, dan mobile (bottom
  navigation + hamburger menu).
