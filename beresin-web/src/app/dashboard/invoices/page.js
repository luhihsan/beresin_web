"use client";

import { useState, useEffect } from "react";
import { FiFileText, FiDollarSign, FiCreditCard, FiCheckCircle, FiXCircle, FiDownload, FiSearch, FiEye, FiFilter, FiSend, FiCheck } from "react-icons/fi";
import { exportInvoicesToCSV } from "../../utils/exportHelper";
import { db } from "../../lib/client";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import InvoiceDetailModal from "./InvoiceDetailModal";

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // State untuk Modal Konfirmasi Aksi Finansial Berlapais
  const [actionConfirmation, setActionConfirmation] = useState(null); // { type: 'send_bill' | 'authorize_paid', data: invoice }

  useEffect(() => {
    fetchInvoicesFromFirestore();
  }, []);

  useEffect(() => {
    if (invoices.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetInvoiceCustomId = urlParams.get("open");

      if (targetInvoiceCustomId) {
        const matchedInvoice = invoices.find(inv => inv.id === targetInvoiceCustomId);
        if (matchedInvoice) {
          setSelectedInvoice(matchedInvoice);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    }
  }, [invoices]);

  const formatFirestoreDate = (rawDate) => {
    if (!rawDate) return "-";
    if (typeof rawDate === "object" && "seconds" in rawDate) {
      return new Date(rawDate.seconds * 1000).toLocaleDateString("id-ID", {
        day: "2-digit", month: "short", year: "numeric"
      });
    }
    return String(rawDate);
  };

  const fetchInvoicesFromFirestore = async () => {
    try {
      setIsLoadingData(true);
      
      const invoicesRef = collection(db, "invoices");
      const ticketsRef = collection(db, "serviceTickets");
      const customersRef = collection(db, "customers");
      const usersRef = collection(db, "users");
      
      const qTicketsCompleted = query(ticketsRef, where("status", "==", "completed"));

      const [invoicesSnapshot, ticketsSnapshot, customersSnapshot, usersSnapshot] = await Promise.all([
        getDocs(invoicesRef),
        getDocs(qTicketsCompleted),
        getDocs(customersRef),
        getDocs(usersRef)
      ]);
      
      const masterNameMap = new Map();
      customersSnapshot.docs.forEach(d => { if (d.data().name) masterNameMap.set(d.id, d.data().name); });
      usersSnapshot.docs.forEach(d => { if (d.data().name) masterNameMap.set(d.id, d.data().name); });

      const manualInvoicesList = invoicesSnapshot.docs.map(docSnapshot => {
        const rawData = docSnapshot.data();
        return {
          docId: docSnapshot.id,
          isTicket: false,
          billSent: true, // Manual invoice otomatis terhitung sudah terkirim
          ...rawData,
          date: formatFirestoreDate(rawData.date)
        };
      });

      const ticketInvoicesList = ticketsSnapshot.docs.map(docSnapshot => {
        const rawData = docSnapshot.data();
        const uid = rawData.customerUid || "";
        let finalCustomerName = rawData.customerName || "Pelanggan Tamu";
        
        if (masterNameMap.has(uid)) {
          finalCustomerName = masterNameMap.get(uid);
        } else if (uid.startsWith("guest_")) {
          const cleanPhoneKey = uid.replace("guest_", "");
          if (masterNameMap.has(cleanPhoneKey)) {
            finalCustomerName = masterNameMap.get(cleanPhoneKey);
          }
        }

        return {
          docId: docSnapshot.id,
          isTicket: true, 
          id: rawData.ticketId || `INV-${docSnapshot.id.substring(0, 5)}`,
          customerName: finalCustomerName,
          plateNumber: rawData.carDetails?.plate || rawData.plateNumber || "-",
          date: formatFirestoreDate(rawData.createdAt),
          amount: rawData.invoiceAmount || 0,
          method: rawData.paymentMethod || "Belum Memilih (COD/QRIS)", 
          isPaid: rawData.isPaid || false,
          billSent: rawData.billSent || false, // Mengambil status pengiriman tagihan dari Firestore
          ...rawData 
        };
      });

      const combinedLedger = [...manualInvoicesList, ...ticketInvoicesList];
      setInvoices(combinedLedger);
    } catch (err) {
      console.error("Critical Accounting Error:", err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 1. PROSES EKSEKUSI KIRIM TAGIHAN
  const executeSendBill = async (targetInvoice) => {
    try {
      const targetCollection = targetInvoice.isTicket ? "serviceTickets" : "invoices";
      const targetDocRef = doc(db, targetCollection, targetInvoice.docId);
      
      await updateDoc(targetDocRef, { billSent: true });
      await fetchInvoicesFromFirestore();
      
      setActionConfirmation(null);
      if (selectedInvoice && selectedInvoice.docId === targetInvoice.docId) {
        setSelectedInvoice({ ...selectedInvoice, billSent: true });
      }
      alert(`Sukses! Tagihan faktur ${targetInvoice.id} resmi dikirim ke perangkat pelanggan.`);
    } catch (err) {
      alert(`Gagal mengirimkan tagihan: ${err.message}`);
    }
  };

  // 2. PROSES EKSEKUSI OTORISASI LUNAS
  const executeVerifyPayment = async (targetInvoice) => {
    try {
      const targetCollection = targetInvoice.isTicket ? "serviceTickets" : "invoices";
      const targetDocRef = doc(db, targetCollection, targetInvoice.docId);
      
      await updateDoc(targetDocRef, { isPaid: true });
      await fetchInvoicesFromFirestore();

      setActionConfirmation(null);
      if (selectedInvoice && selectedInvoice.docId === targetInvoice.docId) {
        setSelectedInvoice({ ...selectedInvoice, isPaid: true });
      }
      alert(`Invoice ${targetInvoice.id} berhasil diverifikasi LUNAS!`);
    } catch (err) {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kas Masuk (Lunas)</p>
            <h3 className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">{isLoadingData ? "Rp ..." : formatRupiah(totalRevenue)}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20"><FiDollarSign size={20} /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Piutang Menunggu (Pending)</p>
            <h3 className="text-2xl font-bold text-amber-500 font-mono tracking-tight">{isLoadingData ? "Rp ..." : formatRupiah(pendingRevenue)}</h3>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20"><FiCreditCard size={20} /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between sm:col-span-2 lg:col-span-1 shadow-xl">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Nilai Faktur Terbit</p>
            <h3 className="text-2xl font-bold text-white font-mono tracking-tight">{isLoadingData ? "Rp ..." : formatRupiah(totalRevenue + pendingRevenue)}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20"><FiFileText size={20} /></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800/80 shadow-md">
        <div className="relative w-full md:max-w-md flex items-center">
          <FiSearch className="absolute left-4 text-slate-600" size={18} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari ID Invoice, nama pelanggan, atau plat nomor..." className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button onClick={() => setStatusFilter("all")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${statusFilter === "all" ? "bg-blue-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`}>Semua Faktur</button>
          <button onClick={() => setStatusFilter("paid")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${statusFilter === "paid" ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`}><FiCheckCircle size={12} /> Lunas</button>
          <button onClick={() => setStatusFilter("unpaid")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${statusFilter === "unpaid" ? "bg-amber-600 text-white" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`}><FiXCircle size={12} /> Belum Bayar</button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
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
                    <td className="px-6 py-4">
                      <span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono font-bold text-xs tracking-wider text-slate-300">{inv.plateNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{inv.date}</td>
                    <td className="px-6 py-4 font-mono font-bold text-white">{formatRupiah(inv.amount || 0)}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[120px]">{inv.method}</td>
                    <td className="px-6 py-4 text-center">
                      {inv.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Lunas</span>
                      ) : !inv.billSent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Menunggu Tagihan</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Menunggu Bayar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                      <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer" title="Lihat Rincian Faktur & Nota Belanja"><FiEye size={14} /></button>
                      
                      {/* LOGIKA PERUBAHAN TOMBOL BERTAHAP */}
                      {!inv.isPaid && (
                        !inv.billSent ? (
                          <button onClick={() => setActionConfirmation({ type: "send_bill", invoice: inv })} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-600 hover:text-white transition cursor-pointer flex items-center gap-0.5"><FiSend size={11}/> Kirim</button>
                        ) : (
                          <button onClick={() => setActionConfirmation({ type: "authorize_paid", invoice: inv })} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition cursor-pointer flex items-center gap-0.5"><FiCheck size={11}/> Set Lunas</button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRefresh={fetchInvoicesFromFirestore}
          onUpdateInvoice={(updatedInvoice) => setSelectedInvoice(updatedInvoice)}
          onTriggerActionModal={(type, inv) => setActionConfirmation({ type, invoice: inv })}
          formatRupiah={formatRupiah}
        />
      )}

      {/* --- RENDER MODAL KONFIRMASI TINDAKAN BERLAPIS (NEW SUB-MODAL) --- */}
      {actionConfirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in text-xs sm:text-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-4 text-left">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                {actionConfirmation.type === "send_bill" ? (
                  <><FiSend className="text-purple-400" /> Konfirmasi Pengiriman Lembar Tagihan</>
                ) : (
                  <><FiCheckCircle className="text-emerald-400" /> Otorisasi Settlement Pelunasan</>
                )}
              </h4>
              <p className="text-xs text-slate-400 mt-1">Harap tinjau kembali ringkasan rincian itemized faktur di bawah sebelum memproses instruksi cloud.</p>
            </div>

            {/* Invoice Brief Details */}
            <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500">ID Invoice</span>
                <span className="font-mono font-bold text-slate-300">{actionConfirmation.invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan</span>
                <span className="font-semibold text-white">{actionConfirmation.invoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelat Nomor</span>
                <span className="font-mono font-bold text-slate-300">{actionConfirmation.invoice.plateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Pembayaran</span>
                <span className="text-slate-400 italic">{actionConfirmation.invoice.method || "Cash / COD"}</span>
              </div>
              <div className="flex justify-between border-t border-slate-900 pt-2 text-sm">
                <span className="text-slate-400 font-medium">Total Akumulasi Nominal</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(actionConfirmation.invoice.amount || 0)}</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs pt-2">
              <button onClick={() => setActionConfirmation(null)} className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl hover:text-white transition cursor-pointer">Batalkan Aksi</button>
              {actionConfirmation.type === "send_bill" ? (
                <button onClick={() => executeSendBill(actionConfirmation.invoice)} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer">Kirim Sekarang</button>
              ) : (
                <button onClick={() => executeVerifyPayment(actionConfirmation.invoice)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer">Verifikasi Lunas</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}