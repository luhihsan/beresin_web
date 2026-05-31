// src/app/dashboard/customers/CarHistoryDetail.js
import React from "react";

export default function CarHistoryDetail({ ticket }) {
  if (!ticket) return null;

  return (
    <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-xs sm:text-sm text-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div>
          <span className="text-gray-400">ID Tiket:</span> <span className="font-mono font-bold text-gray-800">{ticket.ticketId}</span>
        </div>
        <div className="flex gap-4">
          <div><span className="text-gray-400">Mekanik:</span> <strong className="text-gray-800">{ticket.mechanicName || "-"}</strong></div>
          <div><span className="text-gray-400">KM:</span> <strong className="text-gray-800">{ticket.kmCheckIn || "0"} KM</strong></div>
        </div>
      </div>

      <div>
        <span className="text-gray-400 font-medium block mb-1">Keluhan Pelanggan & Tindakan Mekanik:</span>
        <p className="bg-white p-2.5 rounded border border-gray-200 text-gray-800 font-medium">
          {ticket.tasks || "Tidak ada keterangan keluhan."}
        </p>
      </div>

      {/* Foto Keluhan */}
      {ticket.complaintPhotoUrls && ticket.complaintPhotoUrls.length > 0 && (
        <div>
          <span className="text-gray-400 font-medium block mb-1">Bukti Foto Keluhan:</span>
          <div className="flex flex-wrap gap-2">
            {ticket.complaintPhotoUrls.map((url, i) => (
              <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="w-16 h-16 bg-gray-200 rounded border border-gray-300 overflow-hidden block relative group">
                <img src={url} alt="Keluhan" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <span className="text-white text-[9px] opacity-0 group-hover:opacity-100">↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Sparepart yang Pernah Dibeli */}
      {ticket.externalProcurements && ticket.externalProcurements.length > 0 && (
        <div className="pt-1">
          <span className="text-gray-400 font-medium block mb-1">Rincian Pembelian Part (Nota Mekanik):</span>
          <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {ticket.externalProcurements.map((proc, i) => (
              <div key={i} className="p-2 flex items-center justify-between text-xs hover:bg-gray-50">
                <div>
                  <span className="font-semibold text-gray-800">{proc.partName}</span>
                  <span className="text-gray-400 mx-1.5">•</span>
                  <span className="text-gray-500">Toko: {proc.supplierStore}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-700 font-bold">Rp {proc.cost?.toLocaleString("id-ID")}</span>
                  {proc.receiptPhotoUrl && (
                    <a href={proc.receiptPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold">
                      Nota ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}