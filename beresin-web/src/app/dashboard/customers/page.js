"use client";

import { useState } from "react";
import { FiUsers, FiPlus, FiX, FiPhone, FiSmartphone, FiUserCheck, FiChevronRight, FiCheckCircle, FiClock, FiFileText, FiUser, FiTrendingUp } from "react-icons/fi";

export default function CustomersManagement() {
  // Mock State Database Pelanggan (Simulasi data gabungan dari collection/users role customer & guest)
  const [customers, setCustomers] = useState([
    { id: "cust_01", name: "Galuh Ihsan", phone: "081222333444", type: "Registered", joinedDate: "12 Jan 2026", totalVehicles: 2 },
    { id: "cust_02", name: "Bambang Pamungkas", phone: "085677778888", type: "Guest", joinedDate: "18 Feb 2026", totalVehicles: 1 },
    { id: "cust_03", name: "Dewi Lestari", phone: "089511112222", type: "Registered", joinedDate: "05 Mar 2026", totalVehicles: 1 },
  ]);

  // Mock Database Relational Kendaraan (Denormalisasi dari collection/vehicles berdasarkan relasi 1-to-N)
  const [vehiclesDatabase] = useState({
    cust_01: [
      { id: "vhc_101", plateNumber: "AD 2345 GL", brand: "Toyota", model: "Avanza Veloz", year: "2022", transmission: "Automatic" },
      { id: "vhc_102", plateNumber: "AD 9999 IH", brand: "Honda", model: "Civic Turbo", year: "2023", transmission: "Manual" }
    ],
    cust_02: [
      { id: "vhc_201", plateNumber: "B 1234 ABC", brand: "Mitsubishi", model: "Pajero Sport", year: "2021", transmission: "Automatic" }
    ],
    cust_03: [
      { id: "vhc_301", plateNumber: "K 8888 AA", brand: "Suzuki", model: "Ertiga Hybrid", year: "2024", transmission: "Automatic" }
    ]
  });

  // ===================================================================================
  // STATE & DATA BARU: LIFECYCLE RIWAYAT PENGERJAAN KENDARAAN (serviceTickets & invoices)
  // ===================================================================================
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Basis data log servis terdenormalisasi bersumber dari relasi sub-collection progressLogs & invoices
  const [serviceHistoryDatabase] = useState({
    vhc_101: [
      {
        ticketId: "TKT-20260410-011",
        date: "10 Apr 2026",
        mechanicName: "Budi Santoso",
        kmCheckIn: 45200,
        kmService: 45210, // Selisih KM mencerminkan proses test-drive oleh mekanik
        tasks: "Ganti Oli Mesin Shell Helix Ultra 5W-40, Penggantian Filter Oli, General Tune-Up",
        invoiceAmount: 685000,
        status: "Lunas"
      },
      {
        ticketId: "TKT-20251105-004",
        date: "05 Nov 2025",
        mechanicName: "Agus Setiawan",
        kmCheckIn: 38100,
        kmService: 38105,
        tasks: "Penggantian Kampas Rem Depan (Brembo), Bleeding Minyak Rem Cairan Dot 4",
        invoiceAmount: 1450000,
        status: "Lunas"
      }
    ],
    vhc_102: [
      {
        ticketId: "TKT-20260512-019",
        date: "12 Mei 2026",
        mechanicName: "Budi Santoso",
        kmCheckIn: 12400,
        kmService: 12415,
        tasks: "Kalibrasi ECU Stage 1 Remap, Penggantian Aki Amaron Pro 55M",
        invoiceAmount: 3800000,
        status: "Lunas"
      }
    ],
    vhc_201: [
      {
        ticketId: "TKT-20260502-002",
        date: "02 Mei 2026",
        mechanicName: "Agus Setiawan",
        kmCheckIn: 62000,
        kmService: 62008,
        tasks: "Service AC Berkala Sistem Evaporator, Refill Freon R134a, Penggantian Filter Kabin Carbon",
        invoiceAmount: 950000,
        status: "Lunas"
      }
    ],
    vhc_301: [
      {
        ticketId: "TKT-20260514-015",
        date: "14 Mei 2026",
        mechanicName: "Heri Prasetyo",
        kmCheckIn: 5100,
        kmService: 5102,
        tasks: "Service Berkala Khusus 5.000 KM (Free Jasa Paket Pembelian), Rotasi Roda 4 Sisi",
        invoiceAmount: 0, // Rp 0 mencerminkan garansi ATPM resmi
        status: "Lunas"
      }
    ]
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  /**
   * @description Menangani proses registrasi manual untuk pelanggan walk-in (Tipe: Guest).
   * Nomor WhatsApp bertindak sebagai Primary Key pembeda di ekosistem NoSQL.
   * @param {Event} e - Objek event form submission
   * @returns {Promise<void>}
   */
  const handleCreateGuestCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // VALIDASI SISI KLIEN (Sanitisasi input nomor telepon mikro)
      if (formData.phone.length < 10) {
        throw new Error("Nomor identifikasi WhatsApp tidak memenuhi standar panjang karakter.");
      }

      console.log("Memproses payload pendaftaran Guest ke Firestore Cloud...");

      // Simulasi delay rest API network request
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newGuest = {
        id: `cust_${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        type: "Guest", // Paksa bertindak sebagai Guest karena didaftarkan kasir/owner manual
        joinedDate: "Hari Ini",
        totalVehicles: 0
      };

      setCustomers([newGuest, ...customers]);
      setIsModalOpen(false);
      setFormData({ name: "", phone: "" }); // Flush form state

      console.log("Entri data pelanggan Guest sukses di-commit ke NoSQL database.");
    } catch (err) {
      console.error("CRM Engine Error - Gagal membuat data guest:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * @description Helper utility untuk memformat angka desimal ke standar IDR Currency.
   * @param {number} value - Angka finansial mentah
   * @returns {string} Terformat Rp XX.XXX.XXX
   */
  const formatRupiah = (value) => {
    if (value === 0) return "Free (Paket Garansi)";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(value);
  };

  // Mengambil daftar array mobil spesifik dari database relasi berdasarkan pelanggan terpilih
  const currentVehicles = selectedCustomer ? vehiclesDatabase[selectedCustomer.id] || [] : [];
  
  // Mengambil riwayat servis spesifik berdasarkan kendaraan aktif yang dipilih oleh admin
  const currentVehicleHistory = selectedVehicle ? serviceHistoryDatabase[selectedVehicle.id] || [] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Pusat Informasi Pelanggan (CRM)</h2>
          <p className="text-sm text-slate-400 mt-1">Manajemen basis data pemilik kendaraan, segmentasi akun aplikasi, serta pelacakan aset mobil.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-lg shadow-blue-600/10 text-sm"
        >
          <FiPlus size={18} /> Catat Pelanggan Walk-In
        </button>
      </div>

      {/* Main Grid Layout (Table Left, Detail Right if selected) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Kolom Kiri: Tabel Database Pelanggan */}
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${selectedCustomer ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Nama Pelanggan</th>
                  <th className="px-6 py-4">Nomor WhatsApp</th>
                  <th className="px-6 py-4">Tipe Akun</th>
                  <th className="px-6 py-4">Terdaftar Sejak</th>
                  <th className="px-6 py-4 text-center">Jumlah Mobil</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {customers.map((cust) => (
                  <tr 
                    key={cust.id} 
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setSelectedVehicle(null); // Reset detail mobil setiap kali ganti pelanggan
                    }}
                    className={`hover:bg-slate-800/30 transition duration-150 cursor-pointer ${selectedCustomer?.id === cust.id ? "bg-blue-600/10" : ""}`}
                  >
                    <td className="px-6 py-4 font-medium text-white">{cust.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{cust.phone}</td>
                    <td className="px-6 py-4">
                      {cust.type === "Registered" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <FiSmartphone size={10} /> App User
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <FiPhone size={10} /> Guest (Walk-in)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{cust.joinedDate}</td>
                    <td className="px-6 py-4 text-center font-bold font-mono text-white">{cust.totalVehicles}</td>
                    <td className="px-4 py-4 text-slate-500 text-right">
                      <FiChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Aset Kendaraan (1-to-N Mapping Viewer) */}
        {selectedCustomer && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-fade-in lg:col-span-1 relative">
            <button 
              onClick={() => {
                setSelectedCustomer(null);
                setSelectedVehicle(null);
              }}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">Profil Kepemilikan</span>
              <h3 className="text-lg font-bold text-white mt-1">{selectedCustomer.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCustomer.phone}</p>
            </div>

            {/* List Garasi Mobil Pelanggan */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Kendaraan Terdaftar ({currentVehicles.length})</h4>
              
              {currentVehicles.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
                  <p className="text-xs text-slate-600">Belum ada aset kendaraan yang ditautkan ke akun ini.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {currentVehicles.map((vehicle) => (
                    <div 
                      key={vehicle.id} 
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`bg-slate-950 border p-4 rounded-xl space-y-3 shadow-inner transition cursor-pointer hover:border-blue-500/50 ${selectedVehicle?.id === vehicle.id ? "border-blue-500 ring-1 ring-blue-500/30" : "border-slate-800"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-slate-800 border border-slate-700 text-white font-mono font-bold px-2.5 py-1 rounded text-xs tracking-wider">
                          {vehicle.plateNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                          {vehicle.transmission}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Tahun Produksi: {vehicle.year}</p>
                      </div>
                      
                      {/* Petunjuk Aksi Klik */}
                      <div className="text-right">
                        <span className="text-[11px] text-blue-400 font-medium hover:underline">Klik untuk riwayat servis →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* =================================================================================== */}
      {/* SECTION BARU: RENDER TIMELINE RIWAYAT PENGERJAAN DETIL MOBIL TERPILIH                 */}
      {/* =================================================================================== */}
      {selectedVehicle && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in text-left">
          
          {/* Header Section */}
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiClock className="text-blue-500" /> Histori Perawatan Kendaraan: <span className="text-blue-400 font-mono">{selectedVehicle.plateNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Rekam rekam jejak pengerjaan mekanik otomotif lapangan beserta odometer KM check-in bengkel.</p>
            </div>
            <button 
              onClick={() => setSelectedVehicle(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Timeline Wrapper */}
          {currentVehicleHistory.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">
              Belum ada riwayat pengerjaan / service Ticket terarsip untuk unit kendaraan ini.
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-y-1 before:left-4 sm:before:left-6 before:w-0.5 before:bg-slate-800">
              {currentVehicleHistory.map((history, index) => (
                <div key={history.ticketId} className="relative pl-10 sm:pl-14 animate-fade-in">
                  
                  {/* Penanda Bulatan Node Timeline */}
                  <div className="absolute left-2 sm:left-4 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500 z-10 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                  
                  {/* Konten Box Card Riwayat */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
                    
                    {/* Baris Atas: Metadata Tiket */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-slate-200">{history.ticketId}</span>
                        <span className="text-xs text-slate-500">|</span>
                        <span className="text-xs text-slate-400 font-medium">{history.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {history.status}
                        </span>
                      </div>
                    </div>

                    {/* Baris Tengah: Komponen Grid Informasi Detil */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      
                      {/* Kolom 1: Data Odometer KM */}
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 space-y-1">
                        <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Pelacakan Odometer</p>
                        <p className="text-slate-300 font-medium font-mono text-sm">
                          {history.kmCheckIn.toLocaleString()} KM <span className="text-slate-600 font-normal text-xs">Masuk</span>
                        </p>
                        <p className="text-slate-400 font-medium font-mono text-xs">
                          {history.kmService.toLocaleString()} KM <span className="text-slate-600 font-normal text-[11px]">Selesai</span>
                        </p>
                      </div>

                      {/* Kolom 2: Penanggung Jawab Mekanik */}
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 space-y-1 flex flex-col justify-center">
                        <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <FiUser size={10} /> Mekanik Bertugas
                        </p>
                        <p className="text-white font-semibold text-sm mt-0.5">{history.mechanicName}</p>
                      </div>

                      {/* Kolom 3: Finansial Tagihan */}
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 space-y-1 flex flex-col justify-center md:col-span-2">
                        <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <FiFileText size={10} /> Total Nominal Invoice
                        </p>
                        <p className="text-emerald-400 font-bold font-mono text-base mt-0.5">
                          {formatRupiah(history.invoiceAmount)}
                        </p>
                      </div>

                    </div>

                    {/* Baris Bawah: Deskripsi Jasa Perbaikan / Sparepart */}
                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50 space-y-1">
                      <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Tindakan & Deskripsi Perbaikan Komponen</p>
                      <p className="text-slate-200 text-sm leading-relaxed mt-1">{history.tasks}</p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* MODAL PENDAFTARAN MANUAL PELANGGAN GUEST */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <FiX size={20} />
            </button>

            <div className="mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                <FiUserCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Catat Pelanggan Walk-In</h3>
                <p className="text-xs text-slate-400 mt-0.5">Memasukkan entri database manual untuk pelanggan non-aplikasi.</p>
              </div>
            </div>

            <form onSubmit={handleCreateGuestCustomer} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Nama Lengkap Pelanggan</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Bambang Pamungkas"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Nomor WhatsApp Aktif (Primary Key ID)</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 0856xxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-200 mt-6 shadow-lg shadow-blue-600/10 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-sm flex items-center justify-center"
              >
                {isSubmitting ? "Committing Document to NoSQL..." : "Simpan Profil Pelanggan"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}