"use client";

import { useState, useEffect } from "react";
import { FiFileText, FiDollarSign, FiCreditCard, FiCheckCircle, FiXCircle, FiDownload, FiSearch, FiEye, FiFilter, FiPaperclip, FiImage } from "react-icons/fi";
// IMPORT UTILITY EKSPOR LAPORAN
import { exportInvoicesToCSV } from "../../utils/exportHelper";
// IMPORT KONEKSI DATABASE FIRESTORE ASLI LU
import { db } from "../../lib/client";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // EFFECT 1: MEMBACA LIVE DATA INVOICE DARI CLOUD
  useEffect(() => {
    fetchInvoicesFromFirestore();
  }, []);

  // ===================================================================================
  // EFFECT 2 BARU: DEEP LINKING INTERCEPTOR ENGINE (Auto-Open Modal Detil)
  // ===================================================================================
  useEffect(() => {
    // Jalankan intersepsi hanya jika data invoice dari firestore sudah sukses termuat penuh
    if (invoices.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetInvoiceCustomId = urlParams.get("open");

      if (targetInvoiceCustomId) {
        console.log(`Deep Link Detector: Menangkap instruksi auto-open untuk ID [${targetInvoiceCustomId}]`);
        
        // Cari objek invoice yang id custom-nya cocok (Contoh: INV-20260520-002)
        const matchedInvoice = invoices.find(inv => inv.id === targetInvoiceCustomId);
        
        if (matchedInvoice) {
          setSelectedInvoice(matchedInvoice); // Otomatis tembak modal detail terbuka
          
          // Bersihkan parameter ?open= di URL agar saat modal ditutup, browser kembali bersih
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    }
  }, [invoices]); // Re-run tracker setiap kali manifest data invoice diperbarui

  const formatFirestoreDate = (rawDate) => {
    if (!rawDate) return "-";
    if (typeof rawDate === "object" && "seconds" in rawDate) {
      return new Date(rawDate.seconds * 1000).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }
    return String(rawDate);
  };

  const fetchInvoicesFromFirestore = async () => {
    try {
      setIsLoadingData(true);
      console.log("Firestore Finance: Menarik entri dokumen pembukuan dari koleksi 'invoices'...");
      
      const invoicesRef = collection(db, "invoices");
      const querySnapshot = await getDocs(invoicesRef);
      
      const liveInvoicesList = querySnapshot.docs.map(docSnapshot => {
        const rawData = docSnapshot.data();
        return {
          docId: docSnapshot.id,
          ...rawData,
          date: formatFirestoreDate(rawData.date)
        };
      });

      setInvoices(liveInvoicesList);
      console.log("Firestore Finance: Sinkronisasi lembar ledger akuntansi sukses.");
    } catch (err) {
      console.error("Critical Accounting Error - Gagal memuat data finansial:", err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleVerifyPayment = async (docId, customInvoiceId) => {
    try {
      console.log(`Firestore Finance: Mengarsip settlement lunas untuk dokumen [${docId}]...`);
      const targetDocRef = doc(db, "invoices", docId);
      
      await updateDoc(targetDocRef, { isPaid: true });
      await fetchInvoicesFromFirestore();

      if (selectedInvoice && selectedInvoice.docId === docId) {
        setSelectedInvoice({ ...selectedInvoice, isPaid: true });
      }

      console.log(`Audit Trail Log - Settlement Sukses: Invoice [${customInvoiceId}] dinyatakan LUNAS.`);
      alert(`Invoice ${customInvoiceId} berhasil diverifikasi LUNAS!`);
    } catch (err) {
      console.error("Security/Network Failure - Otorisasi pelunasan gagal:", err.message);
      alert(`Gagal memproses pelunasan: ${err.message}`);
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const filteredInvoices = invoices.filter(inv => {
    const customerNameSafe = inv.customerName || "";
    const idSafe = inv.id || "";
    const plateNumberSafe = inv.plateNumber || "";

    const matchesSearch = customerNameSafe.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          idSafe.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          plateNumberSafe.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesStatus = statusFilter === "all" ? true : statusFilter === "paid" ? inv.isPaid : !inv.isPaid;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.filter(inv => inv.isPaid).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingRevenue = invoices.filter(inv => !inv.isPaid).reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Page Header Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manajemen Finansial & Invoices</h2>
          <p className="text-sm text-slate-400 mt-1">Sistem kontrol pembukuan transaksi, verifikasi payment gateway, serta ekspor berkas audit kepatuhan akuntansi.</p>
        </div>
        
        <button
          onClick={() => exportInvoicesToCSV(filteredInvoices)} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-lg shadow-emerald-600/10 text-sm"
        >
          <FiDownload size={18} /> Ekspor Laporan Keuangan
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kas Masuk (Lunas)</p>
            <h3 className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">{isLoadingData ? "Rp ..." : formatRupiah(totalRevenue)}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20"><FiDollarSign size={20} /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Piutang Menunggu (Pending)</p>
            <h3 className="text-2xl font-bold text-amber-500 font-mono tracking-tight">{isLoadingData ? "Rp ..." : formatRupiah(pendingRevenue)}</h3>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20"><FiCreditCard size={20} /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Nilai Faktur Terbit</p>
            <h3 className="text-2xl font-bold text-white font-mono tracking-tight">{isLoadingData ? "Rp ..." : formatRupiah(totalRevenue + pendingRevenue)}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20"><FiFileText size={20} /></div>
        </div>
      </div>

      {/* Control Bar (Search & Filter Systems) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800/80">
        <div className="relative w-full md:max-w-md flex items-center">
          <FiSearch className="absolute left-4 text-slate-600" size={18} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari ID Invoice, nama pelanggan, atau plat nomor..." className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline flex items-center gap-1"><FiFilter size={12} /> Filter:</span>
          <button onClick={() => setStatusFilter("all")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${statusFilter === "all" ? "bg-blue-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`}>Semua Faktur</button>
          <button onClick={() => setStatusFilter("paid")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${statusFilter === "paid" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`}><FiCheckCircle size={12} /> Lunas</button>
          <button onClick={() => setStatusFilter("unpaid")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${statusFilter === "unpaid" ? "bg-amber-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`}><FiXCircle size={12} /> Belum Bayar</button>
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
              {isLoadingData ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-500 text-xs animate-pulse">Mengunduh Berkas Ledger Keuangan dari Cloud Firestore...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-500 text-xs">Tidak ditemukan rekaman invoice faktur yang cocok dengan database.</td></tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.docId} className="hover:bg-slate-800/30 transition duration-150">
                    <td className="px-6 py-4 font-mono font-bold text-slate-200">{inv.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{inv.customerName}</td>
                    <td className="px-6 py-4"><span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono font-bold text-xs tracking-wider text-slate-300">{inv.plateNumber}</span></td>
                    <td className="px-6 py-4 text-slate-400">{inv.date}</td>
                    <td className="px-6 py-4 font-mono font-bold text-white">{formatRupiah(inv.amount || 0)}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{inv.method || "Cash"}</td>
                    <td className="px-6 py-4 text-center">
                      {inv.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Lunas</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Belum Bayar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                      <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer" title="Lihat Rincian Faktur & Nota Belanja"><FiEye size={14} /></button>
                      {!inv.isPaid && <button onClick={() => handleVerifyPayment(inv.docId, inv.id)} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition cursor-pointer">Set Lunas</button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OVERLAY: RINCIAN DETAIL INVOICE & REIMBURSEMENT NOTA LUAR */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedInvoice(null)} className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"><FiXCircle size={20} /></button>
            <div className="mb-6 border-b border-slate-800 pb-4"><span className="text-[10px] font-bold tracking-widest uppercase text-blue-500">Berkas Faktur Finansial</span><h3 className="text-base font-mono font-bold text-white mt-0.5">{selectedInvoice.id}</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-6">
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60"><span className="text-slate-500">Nama Pemilik</span><span className="font-semibold text-white">{selectedInvoice.customerName}</span></div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60"><span className="text-slate-500">Plat Kendaraan</span><span className="font-mono font-bold text-slate-300">{selectedInvoice.plateNumber}</span></div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60"><span className="text-slate-500">Tanggal Terbit</span><span className="text-slate-300">{selectedInvoice.date}</span></div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60"><span className="text-slate-500">Metode Pembayaran</span><span className="text-slate-300">{selectedInvoice.method || "Cash"}</span></div>
            </div>

            {/* TABLE SUB-KOMPONEN: LAPORAN REIMBURSEMENT NOTA BELANJA LUAR MEKANIK */}
            <div className="space-y-3 mb-6 text-left">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><FiPaperclip className="text-blue-500" /> Lampiran Pengadaan Suku Cadang Luar (Reimbursement)</h4>
              {!selectedInvoice.externalProcurements || selectedInvoice.externalProcurements.length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center"><p className="text-xs text-slate-600">Seluruh sparepart murni dibeli sendiri oleh pelanggan atau menggunakan jasa servis murni.</p></div>
              ) : (
                <div className="bg-slate-950 border border-slate-800/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-500 font-semibold uppercase">
                        <th className="px-4 py-2.5">Onderdil Luar</th>
                        <th className="px-4 py-2.5">Toko / Supplier</th>
                        <th className="px-4 py-2.5">Harga Beli</th>
                        <th className="px-4 py-2.5 text-center">Bukti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-400">
                      {selectedInvoice.externalProcurements.map((proc, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/20">
                          <td className="px-4 py-3 font-medium text-slate-200">{proc.partName}</td>
                          <td className="px-4 py-3 text-slate-400">{proc.supplierStore}</td>
                          <td className="px-4 py-3 font-mono text-white">{formatRupiah(proc.cost || 0)}</td>
                          <td className="px-4 py-3 text-center"><a href={proc.receiptPhotoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 rounded transition font-medium"><FiImage size={12} /> Nota</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-between bg-slate-950 p-4 rounded-xl border border-slate-800/60 items-center mb-6 text-xs"><span className="text-slate-500 font-medium text-sm">Total Akumulasi Tagihan Konsumen</span><span className="text-base font-bold font-mono text-emerald-400">{formatRupiah(selectedInvoice.amount || 0)}</span></div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Faktur Saat Ini</p><p className={`font-bold mt-0.5 ${selectedInvoice.isPaid ? "text-emerald-400" : "text-amber-500"}`}>{selectedInvoice.isPaid ? "LUNAS (TERVERIFIKASI)" : "MENUNGGU SETTLEMENT"}</p></div>
              {!selectedInvoice.isPaid && <button onClick={() => handleVerifyPayment(selectedInvoice.docId, selectedInvoice.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/10">Otorisasi Lunas</button>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}