// src/app/dashboard/TicketDetailModal.js
import React from "react";

export default function TicketDetailModal({ ticket, onClose }) {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              {ticket.status}
            </span>
            <h3 className="text-xl font-bold text-gray-900 mt-2">Detail Tiket: {ticket.ticketId}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-semibold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Data Kendaraan */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Informasi Kendaraan</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg text-sm">
              <div><span className="text-gray-500 block">Brand / Tipe</span><strong className="text-gray-800">{ticket.carDetails?.brand || "-"} / {ticket.carDetails?.type || "-"}</strong></div>
              <div><span className="text-gray-500 block">Nomor Polisi</span><strong className="text-gray-800">{ticket.carDetails?.plate || "-"}</strong></div>
              <div><span className="text-gray-500 block">Warna</span><strong className="text-gray-800">{ticket.carDetails?.color || "-"}</strong></div>
              <div><span className="text-gray-500 block">Tipe Mesin</span><strong className="text-gray-800">{ticket.carDetails?.engineType || "-"}</strong></div>
              <div><span className="text-gray-500 block">Tahun</span><strong className="text-gray-800">{ticket.carDetails?.year || "-"}</strong></div>
              <div><span className="text-gray-500 block">KM Masuk</span><strong className="text-gray-800">{ticket.kmCheckIn || "0"} KM</strong></div>
            </div>
          </div>

          {/* Keluhan & Foto dari Pelanggan */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Keluhan Utama (Tasks)</h4>
            <p className="text-gray-800 bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-sm mb-4">
              {ticket.tasks || "Tidak ada deskripsi tertulis."}
            </p>

            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Foto Keluhan Pelanggan ({ticket.complaintPhotoUrls?.length || 0})</h4>
            {ticket.complaintPhotoUrls && ticket.complaintPhotoUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ticket.complaintPhotoUrls.map((url, idx) => (
                  <a href={url} target="_blank" rel="noopener noreferrer" key={idx} className="group relative block aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt={`Keluhan ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-[10px] px-1.5 py-0.5 rounded">Lihat Asli ↗</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Pelanggan tidak melampirkan foto keluhan.</p>
            )}
          </div>

          {/* Data Teknisi & Pengadaan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Penanggung Jawab</h4>
              <div className="text-sm">
                <p className="text-gray-700">Nama Mekanik: <strong className="text-gray-900">{ticket.mechanicName || "Belum Ditugaskan"}</strong></p>
                <p className="text-xs text-gray-400 mt-0.5">ID: {ticket.mechanicId || "-"}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Estimasi Web Admin</h4>
              <p className="text-sm text-gray-700">
                {ticket.estimationValue ? `${ticket.estimationValue} ${ticket.estimationUnit}` : "Belum di-estimasi"}
              </p>
            </div>
          </div>

          {/* Riwayat Sparepart / External Procurement */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Pengadaan Part & Nota Belanja</h4>
            {ticket.externalProcurements && ticket.externalProcurements.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                      <th className="p-3">Nama Barang</th>
                      <th className="p-3">Supplier/Toko</th>
                      <th className="p-3">Biaya</th>
                      <th className="p-3">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {ticket.externalProcurements.map((proc, index) => (
                      <tr key={index}>
                        <td className="p-3 font-medium">{proc.partName}</td>
                        <td className="p-3">{proc.supplierStore}</td>
                        <td className="p-3">Rp {proc.cost?.toLocaleString("id-ID")}</td>
                        <td className="p-3">
                          {proc.receiptPhotoUrl ? (
                            <a href={proc.receiptPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold text-xs">
                              Buka Nota ↗
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Tidak ada foto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Belum ada input pengadaan sparepart dari mekanik.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors">
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
}