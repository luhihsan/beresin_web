# Beresin Web - Vehicle Service Management System

Beresin Web adalah aplikasi manajemen layanan perbaikan kendaraan yang dirancang untuk memudahkan pengelolaan antrian servis, data pelanggan, faktur, dan mekanik dalam satu platform terpadu.

## 📋 Daftar Isi

- [Deskripsi Project](#deskripsi-project)
- [Fitur Utama](#fitur-utama)
- [Stack Teknologi](#stack-teknologi)
- [Struktur Project](#struktur-project)
- [Instalasi & Setup](#instalasi--setup)
- [Panduan Penggunaan](#panduan-penggunaan)
- [Fitur Detail](#fitur-detail)

## 🎯 Deskripsi Project

Beresin Web adalah sistem manajemen terintegrasi untuk bengkel/workshop perbaikan kendaraan. Aplikasi ini membantu dalam:
- Mengelola antrian servis kendaraan
- Menangani data pelanggan (terdaftar dan tamu)
- Mengelola faktur dan pembayaran
- Mengelola data mekanik
- Tracking status perbaikan kendaraan
- Real-time monitoring dashboard

Aplikasi ini dibangun dengan teknologi modern dan menggunakan Firebase untuk backend, memastikan data tersinkronisasi real-time di semua perangkat.

## ✨ Fitur Utama

### 1. **Sistem Autentikasi**
   - Login dengan email dan password
   - Proteksi brute force attack (blokir setelah 5 percobaan gagal selama 5 menit)
   - Session management dengan Firebase Authentication
   - Toggle password visibility untuk kemudahan pengguna

### 2. **Dashboard Overview**
   - Metrik real-time: jumlah mobil yang dilayani hari ini, antrian tunggu, revenue bulanan
   - Live ticket stream yang menampilkan tiket terbaru
   - Monitoring mekanik yang tersedia
   - Sistem otomatisasi: tiket yang habis masa penawaran otomatis naik status
   - Approval & rejection system untuk ticket approval

### 3. **Manajemen Pelanggan (Customers)**
   - Dukungan dual customer: Registered (dari mobile app) dan Guest (legacy)
   - Pencarian dan filtering pelanggan
   - Riwayat layanan per pelanggan
   - Daftar kendaraan per pelanggan
   - Integrasi QR code scanner untuk quick service entry
   - Tambah ticket langsung dari halaman pelanggan

### 4. **Manajemen Faktur (Invoices)**
   - Daftar semua invoice dengan status (Paid/Unpaid)
   - Filter berdasarkan status pembayaran
   - Search invoice berdasarkan customer atau nomor invoice
   - Export invoice ke CSV untuk laporan
   - Detail invoice dengan breakdown biaya
   - Send invoice to customer
   - Authorization payment confirmation
   - Auto-generated invoice dari completed tickets

### 5. **Manajemen Mekanik**
   - Daftar mekanik yang tersedia
   - Assignment tiket ke mekanik
   - Tracking pekerjaan mekanik

### 6. **Manajemen Layanan**
   - Daftar jenis layanan/service yang tersedia
   - Configurasi layanan untuk assignment

### 7. **Manajemen Tiket Servis**
   - **Status Workflow**: waiting → waiting_offer → waiting → in_progress → completed
   - **Approval System**: Manager dapat approve/reject tiket
   - **Alternative Scheduling**: Penawaran waktu alternatif ketika bengkel penuh
   - **Auto Status Update**: Otomatis update status jika masa penawaran habis
   - **Ticket Detail View**: Informasi lengkap tiket dengan riwayat
   - Queue action modal untuk manage tiket

### 8. **Fitur Keamanan & Validasi**
   - Rate limiting untuk login attempts
   - Validasi input form
   - Error handling dengan user-friendly messages
   - Real-time error notifications

## 🛠️ Stack Teknologi

### Frontend
- **Next.js 16.2.6** - React framework untuk production
- **React 19.2.4** - UI library
- **React DOM 19.2.4** - React rendering
- **Tailwind CSS 4** - Utility-first CSS framework
- **PostCSS 4** - CSS processing

### Backend & Database
- **Firebase 12.13.0** - Authentication & Realtime Database
- **Firebase Admin 13.10.0** - Server-side Firebase management

### UI & Icons
- **React Icons 5.6.0** - Icon library (Feather, Bootstrap Glyphs, dll)
- **QR Code Support** - QR scanner untuk ticket entry

### Development Tools
- **ESLint 9** - Code quality & style
- **Babel React Compiler** - Optimasi React compilation
- **Next.js ESLint Config** - ESLint configuration untuk Next.js

## 📁 Struktur Project

```
beresin-web/
├── src/
│   └── app/
│       ├── globals.css           # Global styling
│       ├── layout.js             # Root layout
│       ├── page.js               # Login page
│       ├── lib/
│       │   └── client.js         # Firebase client config
│       ├── hooks/
│       │   └── useAuthLimit.js   # Auth rate limiting hook
│       ├── utils/
│       │   └── exportHelper.js   # CSV export utilities
│       ├── components/
│       │   └── ModalAlert.js     # Alert modal component
│       └── dashboard/
│           ├── layout.js         # Dashboard layout
│           ├── page.js           # Dashboard overview
│           ├── QueueActionModal.js
│           ├── TicketDetailModal.js
│           ├── customers/
│           │   ├── page.js       # Customers management
│           │   ├── AddTicketModal.js
│           │   └── components/
│           │       ├── GuestTicketForm.js
│           │       └── QrScanTicketForm.js
│           ├── invoices/
│           │   ├── page.js       # Invoices management
│           │   └── InvoiceDetailModal.js
│           ├── mechanics/
│           │   └── page.js       # Mechanics management
│           ├── services/
│           │   └── page.js       # Services management
│           └── settings/
│               └── page.js       # Settings page
├── public/                        # Static assets
├── package.json                   # Dependencies & scripts
├── next.config.mjs               # Next.js configuration
├── eslint.config.mjs             # ESLint configuration
├── postcss.config.mjs            # PostCSS configuration
├── jsconfig.json                 # JavaScript config
└── tailwind.config.js            # Tailwind CSS config
```

## 🚀 Instalasi & Setup

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Firebase project dengan credentials

### Installation Steps

1. **Clone repository**
```bash
git clone [repository-url]
cd beresin-web
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Firebase Configuration**
Buat file `.env.local` di root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Run development server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Build & Deployment
```bash
# Build untuk production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📖 Panduan Penggunaan

### Login
1. Masukkan email dan password Anda
2. Klik tombol Login
3. Jika login sukses, Anda akan diarahkan ke Dashboard
4. Sistem memiliki proteksi: 5 percobaan gagal akan blokir akses selama 5 menit

### Dashboard Overview
1. Lihat metrik real-time: Cars Today, Waiting Queue, Monthly Revenue
2. Monitor live tickets dan status
3. Approve atau reject tiket dari queue
4. Lihat detail tiket dengan klik icon

### Manajemen Pelanggan
1. Navigasi ke **Customers**
2. Cari pelanggan berdasarkan nama atau nomor telepon
3. Klik customer untuk lihat:
   - Data profil
   - Daftar kendaraan
   - Riwayat layanan
4. Tambah tiket baru atau lihat detail kendaraan

### Manajemen Faktur
1. Navigasi ke **Invoices**
2. Filter berdasarkan status (Paid/Unpaid)
3. Search invoice spesifik
4. Klik invoice untuk melihat detail
5. Lakukan aksi:
   - Send bill ke customer
   - Mark as paid
   - Download/Export
6. Export semua invoice ke CSV untuk laporan

### Manajemen Mekanik
1. Navigasi ke **Mechanics**
2. Lihat daftar mekanik
3. Assign tiket ke mekanik dari dashboard

### QR Code Scanner
- Feature tersedia di **Add Ticket Modal**
- Scan QR code kendaraan untuk quick entry
- Support untuk guest dan registered customers

## 🎨 Fitur Detail

### Real-Time Synchronization
- Semua data tersinkronisasi real-time menggunakan Firestore
- Updates otomatis di semua sessions tanpa refresh
- Live stream untuk tickets dan metrics

### Ticket Status Workflow
- **Waiting**: Tiket baru menunggu antrian
- **Waiting Offer**: Penawaran waktu alternatif diberikan
- **In Progress**: Perbaikan sedang berlangsung
- **Completed**: Perbaikan selesai
- Auto-promotion: Tiket di status waiting_offer otomatis naik ke waiting jika waktu habis

### Authorization System
- Multi-level approval untuk tiket
- Rejection system dengan notes
- Assignment ke mekanik
- Tracking approval history

### Export & Reporting
- Export invoices ke format CSV
- Formatted untuk Excel
- Includes all financial details

### Error Handling & UX
- User-friendly error messages
- Modal notifications untuk feedback
- Loading states untuk async operations
- Validation untuk semua input forms

## 📝 Notes

- Aplikasi menggunakan Next.js App Router (bukan Pages Router)
- Semua fungsi real-time menggunakan Firebase Firestore listeners
- Styling menggunakan Tailwind CSS utility-first approach
- Icons menggunakan React Icons library untuk konsistensi UI

## 🤝 Support

Untuk pertanyaan atau issues, hubungi tim development.

---

**Beresin Web v0.1.0** | Last Updated: 2024
