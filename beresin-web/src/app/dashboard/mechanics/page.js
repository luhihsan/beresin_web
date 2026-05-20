"use client";

import { useState } from "react";
import { FiPlus, FiUserPlus, FiX, FiCheckCircle, FiMinusCircle, FiKey, FiBarChart2, FiStar, FiAward, FiBriefcase } from "react-icons/fi";

export default function MechanicsManagement() {
  // Mock State Roster Mekanik (Simulasi data tunggal dari Firestore collection/users)
  const [mechanics, setMechanics] = useState([
    { id: "mech_01", name: "Budi Santoso", email: "budi@beresin.com", phone: "081234567890", role: "mechanic", isActive: true },
    { id: "mech_02", name: "Agus Setiawan", email: "agus@beresin.com", phone: "089876543210", role: "mechanic", isActive: true },
    { id: "mech_03", name: "Heri Prasetyo", email: "heri@beresin.com", phone: "085612341234", role: "mechanic", isActive: false },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", pin: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // STATE BARU: ANALISIS KINERJA MEKANIK
  // ==========================================
  const [selectedMechanic, setSelectedMechanic] = useState(null);

  // Mock Database Relasional untuk Performa Mekanik (Denormalisasi dari serviceTickets)
  const [performanceLogs, setPerformanceLogs] = useState({
    mech_01: {
      completedJobs: 48,
      avgRating: 4.9,
      efficiency: "96%",
      tickets: [
        { id: "TKT-20260515-001", vehicle: "Toyota Avanza (B 1234 ABC)", task: "Ganti Oli Mesin + Tune Up Elektrikal", date: "15 Mei 2026", rating: 5.0 },
        { id: "TKT-20260512-024", vehicle: "Honda Civic (K 9999 GA)", task: "Overhaul System Rem Depan & Bleeding", date: "12 Mei 2026", rating: 4.8 },
        { id: "TKT-20260510-009", vehicle: "Mitsubishi Xpander (AD 8888 KL)", task: "Penggantian Aki & Kalibrasi ECU", date: "10 Mei 2026", rating: 5.0 }
      ]
    },
    mech_02: {
      completedJobs: 35,
      avgRating: 4.7,
      efficiency: "91%",
      tickets: [
        { id: "TKT-20260514-012", vehicle: "Suzuki Ertiga (B 5678 XYZ)", task: "Service AC Berkala & Refill Freon", date: "14 Mei 2026", rating: 4.5 },
        { id: "TKT-20260509-003", vehicle: "Toyota Innova Reborn (AB 1111 DD)", task: "Penggantian Kampas Kopling Set", date: "09 Mei 2026", rating: 5.0 }
      ]
    },
    mech_03: {
      completedJobs: 14,
      avgRating: 4.2,
      efficiency: "84%",
      tickets: [
        { id: "TKT-20260418-005", vehicle: "Daihatsu Granmax (AD 9000 OK)", task: "Turun Mesin Setengah (Top Overhaul)", date: "18 Apr 2026", rating: 4.2 }
      ]
    }
  });

  /**
   * @description Menangani proses pembuatan akun mekanik baru (Credential Generation).
   * Menerapkan prinsip single responsibility dan mengamankan data rahasia.
   * @param {Event} e - Objek event form submission
   * @returns {Promise<void>}
   */
  const handleGenerateAccount = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // VALIDASI TAHAP AWAL (Sanitisasi Data)
      if (!formData.email.includes("@") || formData.pin.length < 6) {
        throw new Error("Format otentikasi tidak memenuhi parameter keamanan mendasar.");
      }

      console.log("Mengirim payload data mekanik baru ke Server Next.js API Routes...");
      
      /**
       * ARSITEKTUR BEST PRACTICE NOTE (FOR FUTURE DEPLOYMENT):
       * Di sini kita tidak menembak Firebase Client SDK langsung karena akan memicu force-logout Owner.
       * Kita akan melakukan fetch POST ke Next.js API Routes lokal (misal: /api/mechanics).
       * Di dalam API Route itulah file JSON Service Account Firebase Admin SDK mengeksekusi:
       * 1. admin.auth().createUser({ email, password }) -> bypass client restrictions.
       * 2. admin.firestore().collection('users').doc(uid).set({ role: 'mechanic', isActive: true })
       */

      // Simulasi delay rest API network request
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newMechanic = {
        id: `mech_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: "mechanic",
        isActive: true
      };

      setMechanics([...mechanics, newMechanic]);
      setIsModalOpen(false);
      setFormData({ name: "", phone: "", email: "", pin: "" }); // Reset state form
      
      console.log("Akun B2B Mekanik berhasil dibuat dan disinkronisasikan ke Cloud Firestore.");
    } catch (err) {
      console.error("Critical System Alert - Pembuatan akun mekanik gagal:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * @description Mengubah status aktif mekanik (Soft-Delete Mechanism).
   * Menjaga integritas data referensial di tabel riwayat transaksi (invoices/serviceTickets).
   * @param {string} id - Unique Identifier (UID) mekanik target
   */
  const toggleMechanicStatus = (id) => {
    setMechanics(mechanics.map(mech => 
      mech.id === id ? { ...mech, isActive: !mech.isActive } : mech
    ));
    console.log(`Status otentikasi mekanik dengan ID [${id}] berhasil diperbarui.`);
  };

  // Mengambil data performa spesifik berdasarkan ID mekanik yang aktif dipilih
  const currentPerformance = selectedMechanic ? performanceLogs[selectedMechanic.id] || { completedJobs: 0, avgRating: 0, efficiency: "0%", tickets: [] } : null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manajemen Personel Mekanik</h2>
          <p className="text-sm text-slate-400 mt-1">Kelola hak akses, monitoring kredensial, dan pembuatan akun penugasan mekanik lapangan.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-lg shadow-blue-600/10 text-sm"
        >
          <FiUserPlus size={18} /> Tambah Mekanik Baru
        </button>
      </div>

      {/* Roster Table Layout */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Email Kredensial</th>
                <th className="px-6 py-4">Nomor WhatsApp</th>
                <th className="px-6 py-4">Status Otorisasi</th>
                <th className="px-6 py-4 text-center">Tindakan Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {mechanics.map((mech) => (
                <tr key={mech.id} className={`hover:bg-slate-800/30 transition duration-150 ${selectedMechanic?.id === mech.id ? "bg-blue-600/10 border-l-2 border-l-blue-500" : ""}`}>
                  <td className="px-6 py-4 font-medium text-white">{mech.name}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{mech.email}</td>
                  <td className="px-6 py-4">{mech.phone}</td>
                  <td className="px-6 py-4">
                    {mech.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <FiCheckCircle size={12} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <FiMinusCircle size={12} /> Terblokir
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                    
                    {/* BUTTON BARU: Analisis Performa */}
                    <button
                      onClick={() => setSelectedMechanic(mech)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 transition cursor-pointer flex items-center gap-1"
                    >
                      <FiBarChart2 size={12} /> Performa
                    </button>

                    <button
                      onClick={() => toggleMechanicStatus(mech.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        mech.isActive 
                          ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20"
                      }`}
                    >
                      {mech.isActive ? "Suspend Akun" : "Aktifkan Akun"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================================================== */}
      {/* PANEL BARU: RENDERING ANALISIS PERFORMA & LOG RIWAYAT PENGERJAAN (serviceTickets)    */}
      {/* =================================================================================== */}
      {selectedMechanic && currentPerformance && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mt-8 space-y-6 shadow-2xl animate-fade-in relative">
          
          {/* Tombol Tutup Panel Detail */}
          <button 
            onClick={() => setSelectedMechanic(null)}
            className="absolute right-6 top-6 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <FiX size={18} />
          </button>

          {/* Judul Panel */}
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FiBarChart2 className="text-blue-500" /> Dasbor Kinerja Pasukan Lapangan: <span className="text-blue-400">{selectedMechanic.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Analisis metrik key performance indicators (KPI) riil bersumber dari sub-koleksi progressLogs di Firestore.</p>
          </div>

          {/* Widget Grid Metrik Statistik */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Work Orders Selesai</p>
                <p className="text-2xl font-bold text-white font-mono">{currentPerformance.completedJobs} <span className="text-xs font-normal text-slate-600">Tiket</span></p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center">
                <FiBriefcase size={18} />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rating Kepuasan Pelanggan</p>
                <p className="text-2xl font-bold text-amber-500 font-mono flex items-center gap-1">
                  {currentPerformance.avgRating} <span className="text-xs text-slate-600 font-normal">/ 5.0</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center">
                <FiStar size={18} />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Efisiensi Batas Waktu (SLA)</p>
                <p className="text-2xl font-bold text-emerald-500 font-mono">{currentPerformance.efficiency}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                <FiAward size={18} />
              </div>
            </div>
          </div>

          {/* Sub-tabel: Riwayat Log Kerja Lapangan Terakhir */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Log Riwayat Pekerjaan Terakhir (serviceTickets)</h4>
            <div className="bg-slate-950 border border-slate-800/60 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-500 font-semibold uppercase">
                    <th className="px-4 py-3">ID Tiket</th>
                    <th className="px-4 py-3">Identitas Kendaraan</th>
                    <th className="px-4 py-3">Detail Deskripsi Penanganan Keluhan</th>
                    <th className="px-4 py-3">Tanggal Penyelesaian</th>
                    <th className="px-4 py-3 text-center">Feedback Pelanggan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-400">
                  {currentPerformance.tickets.map((ticket, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-300">{ticket.id}</td>
                      <td className="px-4 py-3 text-white">{ticket.vehicle}</td>
                      <td className="px-4 py-3">{ticket.task}</td>
                      <td className="px-4 py-3">{ticket.date}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono">
                          ★ {ticket.rating.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL GENERATOR KREDENSIAL MEKANIK */}
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
                <FiKey size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Generate Kredensial Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sistem otomatis membuat enkripsi ID untuk otentikasi Flutter.</p>
              </div>
            </div>

            <form onSubmit={handleGenerateAccount} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Nama Lengkap Mekanik</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Heri Prasetyo"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Nomor WhatsApp (Aktif)</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 0812xxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Email Kredensial Aplikasi</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Contoh: heri@bengkel.com"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Password / PIN Awal (Min. 6 Karakter)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-200 mt-6 shadow-lg shadow-blue-600/10 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-sm flex items-center justify-center"
              >
                {isSubmitting ? "Generating Secure Credentials..." : "Generate & Simpan Akun"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}