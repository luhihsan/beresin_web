"use client";

import { useState } from "react";
import { FiFileText, FiDollarSign, FiCreditCard, FiCheckCircle, FiXCircle, FiDownload, FiSearch, FiEye, FiFilter } from "react-icons/fi";
// IMPORT UTILITY EKSPOR LAPORAN YANG BARU KITA BUAT
import { exportInvoicesToCSV } from "../../utils/exportHelper";

export default function InvoicesManagement() {
  // Mock State Database Finansial (Simulasi data collection/invoices terisolasi dari serviceTickets)
  const [invoices, setInvoices] = useState([
    { id: "INV-20260520-001", customerName: "Galuh Ihsan", plateNumber: "AD 2345 GL", date: "20 Mei 2026", amount: 685000, method: "QRIS (Midtrans)", isPaid: true },
    { id: "INV-20260520-002", customerName: "Bambang Pamungkas", plateNumber: "B 1234 ABC", date: "20 Mei 2026", amount: 950000, method: "Cash", isPaid: false },
    { id: "INV-20260519-045", customerName: "Dewi Lestari", plateNumber: "K 8888 AA", date: "19 Mei 2026", amount: 3800000, method: "Transfer Bank", isPaid: true },
    { id: "INV-20260518-012", customerName: "Ahmad Subarjo", plateNumber: "AD 4412 KL", date: "18 Mei 2026", amount: 120000, method: "Cash", isPaid: true },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  /**
   * @description Melakukan verifikasi otorisasi pembayaran manual (Settlement).
   * Hanya akun berhak akses Owner/Kasir yang diizinkan merubah status finansial dokumen ini.
   * @param {string} id - Unique Invoice ID (Primary Key)
   */
  const handleVerifyPayment = (id) => {
    setInvoices(invoices.map(inv => 
      inv.id === id ? { ...inv, isPaid: true } : inv
    ));
    console.log(`Audit Trail Log - Settlement Sukses: Invoice [${id}] telah diverifikasi LUNAS oleh Owner.`);
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice({ ...selectedInvoice, isPaid: true });
    }
  };

  // Utility helper untuk formatting mata uang rupiah secara konsisten
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  // LOGIKA FILTERING & SEARCHING DATA (Computed State)
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || inv.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : statusFilter === "paid" ? inv.isPaid : !inv.isPaid;
    return matchesSearch && matchesStatus;
  });

  // AGREGASI METRIK KEUANGAN SECARA REAL-TIME
  const totalRevenue = invoices.filter(inv => inv.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  const pendingRevenue = invoices.filter(inv => !inv.isPaid).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Page Header Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manajemen Finansial & Invoices</h2>
          <p className="text-sm text-slate-400 mt-1">Sistem kontrol pembukuan transaksi, verifikasi payment gateway, serta ekspor berkas audit kepatuhan akuntansi.</p>
        </div>
        
        {/* ACTION CALL KELUAR KE HELPER MANDIRI */}
        <button
          onClick={() => exportInvoicesToCSV(filteredInvoices)} // Mengirim data terfilter biar unduhannya presisi sesuai layar
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-lg shadow-emerald-600/10 text-sm"
        >
          <FiDownload size={18} /> Ekspor Laporan Keuangan
        </button>
      </div>

      {/* Financial Statement Overview Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kas Masuk (Lunas)</p>
            <h3 className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">{formatRupiah(totalRevenue)}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <FiDollarSign size={20} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Piutang Menunggu (Pending)</p>
            <h3 className="text-2xl font-bold text-amber-500 font-mono tracking-tight">{formatRupiah(pendingRevenue)}</h3>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
            <FiCreditCard size={20} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Nilai Faktur Terbit</p>
            <h3 className="text-2xl font-bold text-white font-mono tracking-tight">{formatRupiah(totalRevenue + pendingRevenue)}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
            <FiFileText size={20} />
          </div>
        </div>
      </div>

      {/* Control Bar (Search & Filter Sytems) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800/80">
        <div className="relative w-full md:max-w-md flex items-center">
          <FiSearch className="absolute left-4 text-slate-600" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID Invoice, nama pelanggan, atau plat nomor..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline flex items-center gap-1">
            <FiFilter size={12} /> Filter:
          </span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${statusFilter === "all" ? "bg-blue-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`}
          >
            Semua Faktur
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${statusFilter === "paid" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`}
          >
            <FiCheckCircle size={12} /> Lunas
          </button>
          <button
            onClick={() => setStatusFilter("unpaid")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${statusFilter === "unpaid" ? "bg-amber-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`}
          >
            <FiXCircle size={12} /> Belum Bayar
          </button>
        </div>
      </div>

      {/* Main Ledger Table Layout */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">ID Invoice</th>
                <th className="px-6 py-4">Nama Pelanggan</th>
                <th className="px-6 py-4">No. Pelat Kendaraan</th>
                <th className="px-6 py-4">Tanggal Faktur</th>
                <th className="px-6 py-4">Total Tagihan</th>
                <th className="px-6 py-4">Metode Bayar</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi Otoritas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition duration-150">
                  <td className="px-6 py-4 font-mono font-bold text-slate-200">{inv.id}</td>
                  <td className="px-6 py-4 font-medium text-white">{inv.customerName}</td>
                  <td className="px-6 py-4"><span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono font-bold text-xs tracking-wider text-slate-300">{inv.plateNumber}</span></td>
                  <td className="px-6 py-4 text-slate-400">{inv.date}</td>
                  <td className="px-6 py-4 font-mono font-bold text-white">{formatRupiah(inv.amount)}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{inv.method}</td>
                  <td className="px-6 py-4 text-center">
                    {inv.isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Lunas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                        Belum Bayar
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                    >
                      <FiEye size={14} />
                    </button>
                    {!inv.isPaid && (
                      <button
                        onClick={() => handleVerifyPayment(inv.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                      >
                        Set Lunas
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OVERLAY: RINCIAN DETAIL INVOICE */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setSelectedInvoice(null)} className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
              <FiXCircle size={20} />
            </button>
            <div className="mb-6 border-b border-slate-800 pb-4">
              <span className="text-[10px] font-bold tracking-widest uppercase text-blue-500">Berkas Faktur Finansial</span>
              <h3 className="text-base font-mono font-bold text-white mt-0.5">{selectedInvoice.id}</h3>
            </div>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-500">Nama Pemilik</span>
                <span className="font-semibold text-white">{selectedInvoice.customerName}</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-500">Plat Kendaraan</span>
                <span className="font-mono font-bold text-slate-300">{selectedInvoice.plateNumber}</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-500">Tanggal Terbit</span>
                <span className="text-slate-300">{selectedInvoice.date}</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-500">Metode Pembayaran</span>
                <span className="text-slate-300">{selectedInvoice.method}</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-4 rounded-xl border border-slate-800/60 items-center">
                <span className="text-slate-500 font-medium text-sm">Total Tagihan</span>
                <span className="text-base font-bold font-mono text-emerald-400">{formatRupiah(selectedInvoice.amount)}</span>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Faktur Saat Ini</p>
                  <p className={`font-bold mt-0.5 ${selectedInvoice.isPaid ? "text-emerald-400" : "text-amber-500"}`}>{selectedInvoice.isPaid ? "LUNAS (TERVERIFIKASI)" : "MENUNGGU SETTLEMENT"}</p>
                </div>
                {!selectedInvoice.isPaid && (
                  <button onClick={() => handleVerifyPayment(selectedInvoice.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/10">Otorisasi Lunas</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}