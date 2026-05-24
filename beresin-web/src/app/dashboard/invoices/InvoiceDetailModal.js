"use client";

import { useState, useEffect } from "react";
import { FiXCircle, FiEdit2, FiFileText, FiPlus, FiTrash2, FiSave, FiPaperclip, FiImage, FiCornerDownRight } from "react-icons/fi";
// IMPORT KONEKSI CORE FIRESTORE ASLI LU (2 LEVEL KE ATAS KARENA DI FOLDER YANG SAMA SEPERTI PAGE.JS)
import { db } from "../../lib/client";
import { updateDoc, doc } from "firebase/firestore";

export default function InvoiceDetailModal({
  invoice,
  onClose,
  onRefresh,
  onUpdateInvoice,
  handleVerifyPayment,
  formatRupiah
}) {
  // State Khusus Kustomisasi Item Nota di dalam Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [isSubmittingMutation, setIsSubmittingMutation] = useState(false);

  // Sync ulang rincian billing itemized setiap kali objek invoice eksternal berubah
  useEffect(() => {
    if (invoice) {
      // BACKWARD COMPATIBILITY GUARD: Jika data transaksi lama di Firestore belum memiliki field array 'items'
      const externalCostSum = invoice.externalProcurements?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0;
      const baseServicePrice = (invoice.amount || 0) - externalCostSum;

      const defaultItemsManifest = invoice.items || [
        { 
          name: "Biaya Operasional & Jasa Perbaikan Utama", 
          price: baseServicePrice > 0 ? baseServicePrice : invoice.amount 
        }
      ];
      
      setEditableItems(defaultItemsManifest);
    } else {
      setIsEditing(false);
      setEditableItems([]);
    }
  }, [invoice]);

  // Handler menyisipkan baris input item baru kustom
  const handleAddNewBillingItem = () => {
    setEditableItems([...editableItems, { name: "", price: 0 }]);
  };

  // Handler menghapus baris item spesifik berdasarkan target indeks array
  const handleRemoveBillingItem = (indexTarget) => {
    if (editableItems.length === 1) {
      alert("Minimal harus ada 1 item tagihan di dalam invoice agar sah lek!");
      return;
    }
    setEditableItems(editableItems.filter((_, idx) => idx !== indexTarget));
  };

  // Handler melacak input perubahan nama item atau tarif angka kustom
  const handleItemDataChange = (indexTarget, fieldTarget, newValue) => {
    const backupArray = [...editableItems];
    if (fieldTarget === "price") {
      // Kunci Finansial: Paksa input numerik menjadi bulat Integer murni (int)
      backupArray[indexTarget][fieldTarget] = Math.round(Number(newValue)) || 0;
    } else {
      backupArray[indexTarget][fieldTarget] = newValue;
    }
    setEditableItems(backupArray);
  };

  // RUMUS LIVE AGREGASI KALKULATOR DI LAYAR MODAL
  const externalCostSum = invoice?.externalProcurements?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0;
  const calculatedItemsTotal = editableItems.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalNewInvoiceAmount = calculatedItemsTotal + externalCostSum;

  // Handler mengirim payload pembaruan item pembukuan ke Firestore Server
  const handleCommitInvoiceUpgrades = async () => {
    const isNameInvalid = editableItems.some(item => !item.name.trim());
    if (isNameInvalid) {
      alert("Nama deskripsi tindakan jasa / barang tidak boleh kosong ya lek!");
      return;
    }

    try {
      setIsSubmittingMutation(true);
      console.log(`Firestore Mutator: Meng-update itemized data untuk dokumen ID [${invoice.docId}]...`);
      
      const targetDocRef = doc(db, "invoices", invoice.docId);

      // Jalankan update parsial langsung ke cloud server NoSQL
      await updateDoc(targetDocRef, {
        items: editableItems,
        amount: totalNewInvoiceAmount // Override field total amount lama dengan hasil rumus live kalkulator
      });

      // Picu penarikan ulang list di parent page agar tabel besar ikut ter-refresh
      await onRefresh();

      // Perbarui state target di parent modal agar UI berubah lurus tanpa kedip
      onUpdateInvoice({
        ...invoice,
        items: editableItems,
        amount: totalNewInvoiceAmount
      });

      setIsEditing(false);
      alert(`Berhasil melakukan penyesuaian kustom item pada nota ${invoice.id}!`);
    } catch (err) {
      console.error("Critical Mutation Failure - Gagal merubah struktur invoice:", err.message);
      alert(`Gagal menyimpan kustomisasi nota: ${err.message}`);
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Tombol Tutup Modal */}
        <button onClick={onClose} className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
          <FiXCircle size={20} />
        </button>
        
        {/* Header Modal Area */}
        <div className="mb-6 border-b border-slate-800 pb-4 flex items-center justify-between pr-8">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-blue-500">Berkas Faktur Finansial</span>
            <h3 className="text-base font-mono font-bold text-white mt-0.5">{invoice.id}</h3>
          </div>
          
          {/* Tombol Saklar Edit Mode Jasa Kustom */}
          {!invoice.isPaid && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${isEditing ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"}`}
            >
              <FiEdit2 size={12} /> {isEditing ? "Batal Kustom" : "Kustom Jasa/Nota"}
            </button>
          )}
        </div>

        {/* Grid Informasi Utama Pelanggan & Kendaraan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-6">
          <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-500">Nama Pemilik</span>
            <span className="font-semibold text-white">{invoice.customerName}</span>
          </div>
          <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-500">Plat Kendaraan</span>
            <span className="font-mono font-bold text-slate-300">{invoice.plateNumber}</span>
          </div>
          <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-500">Tanggal Terbit</span>
            <span className="text-slate-300">{invoice.date}</span>
          </div>
          <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-500">Metode Pembayaran</span>
            <span className="text-slate-300">{invoice.method || "Cash"}</span>
          </div>
        </div>

        {/* KELOMPOK ITEM A: BARIS RINCIAN BIAYA JASA LAYANAN BENGKEL */}
        <div className="space-y-3 mb-6 text-left">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiFileText className="text-blue-500" /> Rincian Itemized Layanan Jasa Bengkel
            </h4>
            
            {isEditing && (
              <button
                type="button"
                onClick={handleAddNewBillingItem}
                className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <FiPlus size={14} /> Tambah Item Jasa
              </button>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 space-y-2.5">
            {editableItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40">
                {isEditing ? (
                  /* RENDERING MODE EDIT (Tampil Input Node Semuanya) */
                  <>
                    <input
                      type="text"
                      value={item.name}
                      required
                      onChange={(e) => handleItemDataChange(idx, "name", e.target.value)}
                      placeholder="Contoh: Ongkos Kustom Las Knalpot"
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="relative flex items-center w-28">
                      <span className="absolute left-2.5 text-[10px] font-bold text-slate-600">Rp</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemDataChange(idx, "price", e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-400 font-mono font-bold outline-none text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBillingItem(idx)}
                      className="text-slate-600 hover:text-rose-400 p-1 transition cursor-pointer"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </>
                ) : (
                  /* RENDERING MODE PREVIEW (Teks Bersih Estetik) */
                  <div className="w-full flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-medium flex items-center gap-1.5">
                      <FiCornerDownRight className="text-slate-700" size={12} /> {item.name}
                    </span>
                    <span className="font-mono font-bold text-slate-300">{formatRupiah(item.price || 0)}</span>
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex justify-between items-center px-2 pt-1 text-[11px] border-t border-slate-900 text-slate-500 font-medium">
              <span>Subtotal Biaya Jasa Kustom</span>
              <span className="font-mono">{formatRupiah(calculatedItemsTotal)}</span>
            </div>
          </div>
        </div>

        {/* KELOMPOK ITEM B: ARSIP NOTA BELANJA LUAR MEKANIK (REIMBURSEMENT) */}
        <div className="space-y-3 mb-6 text-left">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiPaperclip className="text-blue-500" /> Lampiran Pengadaan Suku Cadang Luar (Reimbursement)
          </h4>
          
          {!invoice.externalProcurements || invoice.externalProcurements.length === 0 ? (
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-600">Seluruh sparepart murni dibeli sendiri oleh pelanggan atau menggunakan jasa servis murni.</p>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800/60 rounded-xl overflow-hidden shadow-inner">
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
                  {invoice.externalProcurements.map((proc, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20 transition">
                      <td className="px-4 py-3 font-medium text-slate-200">{proc.partName}</td>
                      <td className="px-4 py-3 text-slate-400">{proc.supplierStore}</td>
                      <td className="px-4 py-3 font-mono text-white">{formatRupiah(proc.cost || 0)}</td>
                      <td className="px-4 py-3 text-center">
                        <a 
                          href={proc.receiptPhotoUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 rounded transition font-medium"
                        >
                          <FiImage size={12} /> Nota
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Total Kas Billing Akumulasi Akhir */}
        <div className="flex justify-between bg-slate-950 p-4 rounded-xl border border-slate-800/60 items-center mb-6 text-xs">
          <div className="text-left">
            <span className="text-slate-500 font-medium text-sm block">Total Akumulasi Tagihan Konsumen</span>
            {isEditing && <span className="text-[10px] text-blue-400 font-medium">*Menampilkan kalkulasi live rumus di layar</span>}
          </div>
          <span className="text-base font-bold font-mono text-emerald-400">
            {formatRupiah(isEditing ? totalNewInvoiceAmount : invoice.amount || 0)}
          </span>
        </div>

        {/* Footer Modal Action Bar Area */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Faktur Saat Ini</p>
            <p className={`font-bold mt-0.5 ${invoice.isPaid ? "text-emerald-400" : "text-amber-500"}`}>
              {invoice.isPaid ? "LUNAS (TERVERIFIKASI)" : "MENUNGGU SETTLEMENT"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              /* Aksi Saat Mode Kustomisasi Aktif */
              <button
                type="button"
                disabled={isSubmittingMutation}
                onClick={handleCommitInvoiceUpgrades}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-blue-600/10 flex items-center gap-1 disabled:bg-slate-800 disabled:text-slate-500"
              >
                <FiSave size={14} /> {isSubmittingMutation ? "Syncing..." : "Simpan Perubahan"}
              </button>
            ) : (
              /* Aksi Otorisasi Standar */
              !invoice.isPaid && (
                <button 
                  onClick={() => handleVerifyPayment(invoice.docId, invoice.id)} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-red-600/10"
                >
                  Otorisasi Lunas
                </button>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}