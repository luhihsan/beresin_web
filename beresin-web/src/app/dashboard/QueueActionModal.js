"use client";

import { useState } from "react";
import { FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function QueueActionModal({
  approveTicket,
  rejectTicket,
  assignTicket,
  mechanics,
  onClose,
  onConfirmApprove,
  onConfirmReject,
  onConfirmAssign
}) {
  // State untuk formulir Persetujuan (ACC)
  const [estimationValue, setEstimationValue] = useState("");
  const [estimationUnit, setEstimationUnit] = useState("Jam"); // Pilihan: 'Jam' atau 'Hari'

  // State untuk formulir Penolakan / Penawaran Jadwal Alternatif
  const [rejectionType, setRejectionType] = useState("total"); // Pilihan: 'total' atau 'offer'
  const [alternativeDateTime, setAlternativeDateTime] = useState("");

  if (!approveTicket && !rejectTicket && !assignTicket) return null;

  const handleLocalClose = () => {
    setEstimationValue("");
    setEstimationUnit("Jam");
    setRejectionType("total");
    setAlternativeDateTime("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      
      {/* 1. DIALOG KONFIRMASI PERSETUJUAN (ACC) + INPUT DURASI BILANGAN BULAT */}
      {approveTicket && (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onConfirmApprove(approveTicket, parseInt(estimationValue), estimationUnit);
            handleLocalClose();
          }} 
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl space-y-4 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-3">
            <FiCheckCircle size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Persetujuan Antrean Masuk</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Menyetujui antrean kendaraan dengan nomor registrasi pelat <span className="text-white font-mono font-bold">{approveTicket.carDetails?.plate || approveTicket.plateNumber || "-"}</span>.
          </p>
          
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-400">Estimasi Durasi Batas Waktu Pengerjaan Jasa</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                required 
                min="1"
                value={estimationValue} 
                onChange={(e) => setEstimationValue(e.target.value)} 
                placeholder="Contoh: 2" 
                className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono" 
              />
              <select
                value={estimationUnit}
                onChange={(e) => setEstimationUnit(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white outline-none text-xs focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
              >
                <option value="Jam">Jam</option>
                <option value="Hari">Hari</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500 italic">Data durasi akan dikonversi menjadi stempel waktu absolut (Timestamp) sebagai acuan hitung mundur di aplikasi mekanik.</p>
          </div>

          <div className="flex gap-3 pt-2 text-xs">
            <button type="button" onClick={handleLocalClose} className="flex-1 py-2 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl transition hover:text-white cursor-pointer">Batal</button>
            <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer">Konfirmasi ACC</button>
          </div>
        </form>
      )}

      {/* 2. DIALOG PENOLAKAN PERMANEN / PENAWARAN JADWAL ALTERNATIF TERPADU */}
      {rejectTicket && (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onConfirmReject(rejectTicket, rejectionType, alternativeDateTime);
            handleLocalClose();
          }} 
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl space-y-4 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-rose-400 border-b border-slate-800 pb-3">
            <FiAlertCircle size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Manajemen Penolakan Antrean</h3>
          </div>
          
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-400">Pilih Klasifikasi Tindakan Penolakan</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setRejectionType("total"); setAlternativeDateTime(""); }}
                className={`py-2 rounded-xl font-bold border transition text-center cursor-pointer ${rejectionType === "total" ? "bg-rose-600/10 text-rose-400 border-rose-500/40" : "bg-slate-950 border-slate-800 text-slate-500"}`}
              >
                Tolak Permanen
              </button>
              <button
                type="button"
                onClick={() => setRejectionType("offer")}
                className={`py-2 rounded-xl font-bold border transition text-center cursor-pointer ${rejectionType === "offer" ? "bg-purple-600/10 text-purple-400 border-purple-500/40" : "bg-slate-950 border-slate-800 text-slate-500"}`}
              >
                Tawarkan Penjadwalan
              </button>
            </div>
          </div>

          {rejectionType === "total" ? (
            <p className="text-xs text-slate-400 leading-relaxed py-1">
              Tiket antrean <span className="text-white font-mono font-bold">{rejectTicket.ticketId}</span> akan dibatalkan secara permanen dari sistem operasional bengkel dan aplikasi konsumen.
            </p>
          ) : (
            <div className="space-y-2 text-xs animate-fade-in">
              <label className="font-semibold text-slate-400">Tentukan Jadwal & Jam Reservasi Alternatif</label>
              <input 
                type="datetime-local" 
                required 
                value={alternativeDateTime} 
                onChange={(e) => setAlternativeDateTime(e.target.value)} 
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-purple-500 text-xs font-mono cursor-pointer" 
              />
              <p className="text-[10px] text-slate-500 italic">Konsumen akan menerima notifikasi penawaran ini di aplikasi mereka untuk disetujui atau dibatalkan.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 text-xs">
            <button type="button" onClick={handleLocalClose} className="flex-1 py-2 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl transition hover:text-white cursor-pointer">Batal</button>
            <button 
              type="submit" 
              className={`flex-1 py-2 text-white font-bold rounded-xl shadow-lg transition cursor-pointer ${rejectionType === 'total' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-purple-600 hover:bg-purple-500'}`}
            >
              {rejectionType === "total" ? "Konfirmasi Tolak" : "Kirim Jadwal Alternatif"}
            </button>
          </div>
        </form>
      )}

      {/* 3. MODAL JENDELA DELEGASI TEKNISI (ASSIGN MEKANIK) + WORKLOAD TRACKER */}
      {assignTicket && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl space-y-4 animate-fade-in">
          <button onClick={handleLocalClose} className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
            <FiX size={18} />
          </button>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Penunjukan Teknisi Lapangan</h3>
          <p className="text-xs text-slate-500">Silakan pilih teknisi penanggung jawab berdasarkan beban kerja aktif saat ini:</p>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {mechanics.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">Tidak ada akun mekanik aktif terdeteksi.</p>
            ) : (
              mechanics.map((mech) => (
                <div
                  key={mech.uid}
                  onClick={() => {
                    onConfirmAssign(assignTicket, mech.uid);
                    handleLocalClose();
                  }}
                  className="p-3 bg-slate-950 hover:bg-blue-600/10 border border-slate-800 hover:border-blue-500/40 rounded-xl flex items-center justify-between cursor-pointer transition text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{mech.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{mech.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${mech.activeWorkload > 2 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : mech.activeWorkload > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {mech.activeWorkload} Kendaraan Aktif
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}