"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import GuestTicketForm from "./components/GuestTicketForm";
import QrScanTicketForm from "./components/QrScanTicketForm";

export default function AddTicketModal({ isOpen, onClose, onRefresh }) {
  const [ticketFlowType, setTicketFlowType] = useState(null); // 'guest' atau 'qr_scan'

  if (!isOpen) return null;

  const handleCloseAndReset = () => {
    setTicketFlowType(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl max-h-[92vh] overflow-y-auto">
        
        <button onClick={handleCloseAndReset} className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
          <FiX size={20} />
        </button>

        {/* ALUR AWAL: MENU PEMILIHAN METODE */}
        {ticketFlowType === null && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Registrasi Kedatangan Antrean Loket (Walk-In)</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Silakan tentukan jenis kepemilikan akun pendaftaran konsumen untuk memulai proses entry data.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div onClick={() => setTicketFlowType("guest")} className="bg-slate-950 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 text-left cursor-pointer transition group hover:bg-blue-600/5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-black transition font-bold">M</div>
                <h4 className="text-sm font-bold text-white">Guest Walk-In (Registrasi Manual)</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Pendaftaran untuk tipe pelanggan umum non-aplikasi. Entri data kendaraan diisi manual dan otomatis dicatat ke basis CRM.</p>
              </div>

              <div onClick={() => setTicketFlowType("qr_scan")} className="bg-slate-950 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 text-left cursor-pointer transition group hover:bg-blue-600/5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:bg-purple-500 group-hover:text-black transition font-bold">QR</div>
                <h4 className="text-sm font-bold text-white">Scan QR Code (Pelanggan Aplikasi)</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Gunakan pemindaian lensa kamera untuk memuat lembar kuesioner spesifikasi mobil secara otomatis dari profil pelanggan.</p>
              </div>
            </div>
          </div>
        )}

        {/* HUB SINKRONISASI SUB-FORMULIR MODULAR */}
        {ticketFlowType === "guest" && (
          <GuestTicketForm onCancel={() => setTicketFlowType(null)} onRefresh={onRefresh} />
        )}
        {ticketFlowType === "qr_scan" && (
          <QrScanTicketForm onCancel={() => setTicketFlowType(null)} onRefresh={onRefresh} />
        )}

      </div>
    </div>
  );
}