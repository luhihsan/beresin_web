"use client";

import { useState } from "react";
import { FiSliders, FiClock, FiCpu, FiCheckCircle, FiUser, FiSmartphone, FiMapPin } from "react-icons/fi";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile"); // profile, operational, integration
  const [isSaving, setIsSaving] = useState(false);

  // Mock Core State untuk Konfigurasi Sistem Bengkel
  const [profileConfig, setProfileConfig] = useState({ name: "Beresin Garasi", phone: "08123456789", address: "Jl. Pemuda No. 45, Klaten, Jawa Tengah" });
  const [operationalConfig, setOperationalConfig] = useState({ openTime: "08:00", closeTime: "17:00", maxQueuePerDay: 15, regularHolidays: "Minggu" });
  const [integrationConfig, setIntegrationConfig] = useState({ isMidtransSandbox: true, midtransClientKey: "SB-Mid-Client-Xyz123", isWhatsAppBotConnected: true });

  /**
   * @description Menangani proses update commit data pengaturan ke Firestore.
   * @param {Event} e - Objek event form submission
   */
  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      console.log(`Mengirim pembaharuan sub-config [${activeTab}] ke Firebase Cloud Firestore...`);
      
      // Simulasi delay rest API network request
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      console.log("Global System Settings Registry updated successfully.");
      alert("Pengaturan sistem berhasil diperbarui dan disinkronkan ke seluruh platform.");
    } catch (err) {
      console.error("Critical System Alert - Gagal menyimpan konfigurasi:", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Page Header Area */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Konfigurasi Sistem Utama</h2>
        <p className="text-sm text-slate-400 mt-1">Sinkronisasikan identitas bengkel, parameter operasional aplikasi Android, serta kredensial API gateway pihak ketiga.</p>
      </div>

      {/* Tab Navigation Controls */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b-2 ${activeTab === "profile" ? "border-blue-500 text-white bg-blue-600/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <FiUser size={14} /> Profil Bengkel
        </button>
        <button
          onClick={() => setActiveTab("operational")}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b-2 ${activeTab === "operational" ? "border-blue-500 text-white bg-blue-600/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <FiClock size={14} /> Aturan Booking Android
        </button>
        <button
          onClick={() => setActiveTab("integration")}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b-2 ${activeTab === "integration" ? "border-blue-500 text-white bg-blue-600/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <FiCpu size={14} /> Integrasi & API Bot
        </button>
      </div>

      {/* Main Form Box Wrapper */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl">
        <form onSubmit={handleUpdateConfig} className="space-y-5">
          
          {/* TAB 1: RENDERING PROFIL BENGKEL */}
          {activeTab === "profile" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nama Resmi Bengkel (Header Nota)</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={profileConfig.name}
                    onChange={(e) => setProfileConfig({ ...profileConfig, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">No. WhatsApp Gateway Bengkel</label>
                <div className="relative flex items-center">
                  <input
                    type="tel"
                    required
                    value={profileConfig.phone}
                    onChange={(e) => setProfileConfig({ ...profileConfig, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Alamat Fisik Bengkel</label>
                <textarea
                  required
                  rows={3}
                  value={profileConfig.address}
                  onChange={(e) => setProfileConfig({ ...profileConfig, address: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: RENDERING ATURAN BOOKING ANDROID */}
          {activeTab === "operational" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Jam Buka Bengkel</label>
                  <input
                    type="time"
                    required
                    value={operationalConfig.openTime}
                    onChange={(e) => setOperationalConfig({ ...operationalConfig, openTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Jam Tutup Bengkel</label>
                  <input
                    type="time"
                    required
                    value={operationalConfig.closeTime}
                    onChange={(e) => setOperationalConfig({ ...operationalConfig, closeTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Hari Libur Mingguan (Blokir Jadwal App)</label>
                <select
                  value={operationalConfig.regularHolidays}
                  onChange={(e) => setOperationalConfig({ ...operationalConfig, regularHolidays: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                >
                  <option value="Tidak Ada">Tidak Ada (Buka Setiap Hari)</option>
                  <option value="Minggu">Minggu</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Batas Kuota Antrean Maksimal / Hari</label>
                <input
                  type="number"
                  required
                  value={operationalConfig.maxQueuePerDay}
                  onChange={(e) => setOperationalConfig({ ...operationalConfig, maxQueuePerDay: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <p className="text-[11px] text-slate-500">Mencegah terjadinya overload slot pendaftaran pada aplikasi Android sisi pelanggan.</p>
              </div>
            </div>
          )}

          {/* TAB 3: RENDERING INTEGRATION & API BOT */}
          {activeTab === "integration" && (
            <div className="space-y-4 animate-fade-in">
              
              {/* WhatsApp Connection State Badge */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-300">Status Server WhatsApp Node.js Bot</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Menghubungkan trigger otomatis notifikasi invoice dan status perbaikan.</p>
                </div>
                {integrationConfig.isWhatsAppBotConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Disconnected
                  </span>
                )}
              </div>

              {/* Payment Gateway Configurations */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">Midtrans Environment Mode</label>
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIntegrationConfig({ ...integrationConfig, isMidtransSandbox: true })}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition ${integrationConfig.isMidtransSandbox ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-500"}`}
                    >
                      Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntegrationConfig({ ...integrationConfig, isMidtransSandbox: false })}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition ${!integrationConfig.isMidtransSandbox ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500"}`}
                    >
                      Production
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Midtrans Client Key Kredensial</label>
                  <input
                    type="text"
                    required
                    value={integrationConfig.midtransClientKey}
                    onChange={(e) => setIntegrationConfig({ ...integrationConfig, midtransClientKey: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Form Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase transition shadow-lg shadow-blue-600/10 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? "Saving Registry Changes..." : "Simpan Perubahan"}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}