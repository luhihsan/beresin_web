// src/app/dashboard/TicketDetailModal.js
import React from "react";

export default function TicketDetailModal({ ticket, onClose }) {
  if (!ticket) return null;

  // Fungsi khusus untuk mengamankan link ImgBB dari pemblokiran SSL ISP Indonesia
  const getSafeImageUrl = (url) => {
    if (!url) return "";
    return url.replace("i.ibb.co", "i.ibb.co.com");
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse";
      case "processing":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse";
      case "rejected":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "waiting_offer":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse";
      default:
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto text-left">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 rounded-t-3xl">
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getStatusBadgeClass(ticket?.status)}`}>
              {ticket?.status || "Completed"}
            </span>
            <h3 className="text-xl font-bold text-white mt-3 tracking-tight">Detail Tiket Operasional: <span className="font-mono text-blue-400">{ticket?.ticketId}</span></h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition cursor-pointer text-2xl font-semibold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Data Kendaraan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spesifikasi & Informasi Kendaraan</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl text-xs sm:text-sm">
              <div><span className="text-slate-500 block mb-0.5">Brand / Tipe</span><strong className="text-slate-200">{ticket?.carDetails?.brand || "-"} {ticket?.carDetails?.type || "-"}</strong></div>
              <div><span className="text-slate-500 block mb-0.5">Nomor Pelat</span><strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded text-xs">{ticket?.carDetails?.plate || "-"}</strong></div>
              <div><span className="text-slate-500 block mb-0.5">Warna Body</span><strong className="text-slate-200">{ticket?.carDetails?.color || "-"}</strong></div>
              <div><span className="text-slate-500 block mb-0.5">Tipe Mesin</span><strong className="text-slate-200">{ticket?.carDetails?.engineType || "-"}</strong></div>
              <div><span className="text-slate-500 block mb-0.5">Tahun Perakitan</span><strong className="text-slate-200">{ticket?.carDetails?.year || "-"}</strong></div>
              <div><span className="text-slate-500 block mb-0.5">Odometer KM Masuk</span><strong className="text-blue-400 font-mono font-bold">{(ticket?.kmCheckIn || 0).toLocaleString()} KM</strong></div>
            </div>
          </div>

          {/* Keluhan & Foto dari Pelanggan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tindakan Keluhan Utama</h4>
            <p className="text-slate-200 bg-slate-950/30 border border-slate-800/80 p-4 rounded-xl text-sm leading-relaxed">
              {ticket?.tasks || "Tidak ada deskripsi keluhan tertulis."}
            </p>

            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">Foto Lampiran Keluhan Pelanggan ({ticket?.complaintPhotoUrls?.length || 0})</h4>
            {ticket?.complaintPhotoUrls && ticket?.complaintPhotoUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ticket.complaintPhotoUrls.map((url, idx) => (
                  <a href={getSafeImageUrl(url)} target="_blank" rel="noopener noreferrer" key={idx} className="group relative block aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition duration-150">
                    <img src={getSafeImageUrl(url)} alt={`Keluhan ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                    <span className="absolute bottom-1.5 right-1.5 bg-slate-950/80 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-800">Buka Foto ↗</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">Pelanggan tidak melampirkan bukti foto keluhan.</p>
            )}
          </div>

          {/* Data Teknisi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-950/20 p-3.5 rounded-xl border border-slate-800/60">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mekanik Penanggung Jawab</h4>
              <p className="text-sm font-semibold text-slate-200">{ticket?.mechanicName || "Belum Didelegasikan"}</p>
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">UID: {ticket?.mechanicId || "-"}</p>
            </div>
            <div className="bg-slate-950/20 p-3.5 rounded-xl border border-slate-800/60">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Durasi Estimasi Pengerjaan</h4>
              <p className="text-sm font-semibold text-amber-400">
                {ticket?.estimationValue ? `${ticket?.estimationValue} ${ticket?.estimationUnit}` : "Belum ditentukan"}
              </p>
            </div>
          </div>

          {/* Riwayat Sparepart */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengadaan Sparepart & Nota Belanja Lapangan</h4>
            {ticket?.externalProcurements && ticket?.externalProcurements.length > 0 ? (
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs sm:text-sm bg-slate-950/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="p-3">Nama Barang</th>
                      <th className="p-3">Supplier/Toko</th>
                      <th className="p-3">Biaya Real</th>
                      <th className="p-3 text-center">Berkas Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {ticket.externalProcurements.map((proc, index) => (
                      <tr key={index} className="hover:bg-slate-900/20 transition duration-100">
                        <td className="p-3 font-semibold text-slate-200">{proc?.partName}</td>
                        <td className="p-3 text-slate-400">{proc?.supplierStore || "-"}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">Rp {proc?.cost?.toLocaleString("id-ID")}</td>
                        <td className="p-3 text-center">
                          {proc?.receiptPhotoUrl ? (
                            <a href={getSafeImageUrl(proc.receiptPhotoUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 transition text-[11px]">
                              Buka File ↗
                            </a>
                          ) : (
                            <span className="text-slate-600 italic text-[11px]">Tidak ada berkas</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">Mekanik belum melakukan input pengadaan suku cadang eksternal.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end rounded-b-3xl">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
          >
            Tutup Lembar Detail
          </button>
        </div>
      </div>
    </div>
  );
}