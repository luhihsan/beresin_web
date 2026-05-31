// src/app/dashboard/customers/CarHistoryDetail.js
import React from "react";

export default function CarHistoryDetail({ ticket }) {
  // ELIMINASI TOTAL info duplikat (ID Tiket, Mekanik, KM, Keluhan, & Foto Keluhan) karena sudah ada di layout atas.
  // Komponen ini sekarang fokus hanya memunculkan rincian sparepart yang belum ada.
  if (!ticket || !ticket.externalProcurements || ticket.externalProcurements.length === 0) return null;

  return (
    <div className="pt-4 space-y-2 border-t border-slate-900 mt-4 animate-fade-in text-left">
      {/* Label Keterangan Tambahan */}
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        Rincian Suku Cadang & Nota Belanja Mekanik ({ticket.externalProcurements.length})
      </p>
      
      {/* Container List - Menggunakan Skema Dark Slate UI Bengkel */}
      <div className="bg-slate-900/40 rounded-xl border border-slate-800/60 divide-y divide-slate-800/40 overflow-hidden">
        {ticket.externalProcurements.map((proc, index) => (
          <div key={index} className="p-3.5 flex items-center justify-between text-xs sm:text-sm hover:bg-slate-800/20 transition duration-150">
            
            {/* Info Kiri: Nama Part & Nama Toko */}
            <div className="space-y-1">
              <span className="font-semibold text-slate-200 block">{proc.partName}</span>
              <div className="text-slate-500 text-[11px]">
                <span>Toko / Supplier: <strong className="text-slate-400">{proc.supplierStore || "-"}</strong></span>
              </div>
            </div>
            
            {/* Info Kanan: Biaya Real & Link Berkas Nota Lapangan */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-emerald-400 font-bold text-sm sm:text-base">
                Rp {proc.cost?.toLocaleString("id-ID") || "0"}
              </span>
              
              {proc.receiptPhotoUrl ? (
                <a 
                  href={proc.receiptPhotoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 px-2.5 py-1.5 rounded-xl border border-blue-500/20 transition text-xs shadow-lg shadow-blue-500/5"
                >
                  Lihat Nota ↗
                </a>
              ) : (
                <span className="text-slate-600 italic text-xs px-2.5 py-1 bg-slate-950/30 rounded-lg border border-slate-900">
                  Tanpa Nota
                </span>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}