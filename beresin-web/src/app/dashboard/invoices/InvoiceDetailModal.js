"use client";

import { useState, useEffect } from "react";
import { FiXCircle, FiEdit2, FiFileText, FiPlus, FiTrash2, FiSave, FiPaperclip, FiImage, FiCornerDownRight, FiSend, FiCheck } from "react-icons/fi";
import { db } from "../../lib/client";
import { updateDoc, doc } from "firebase/firestore";

export default function InvoiceDetailModal({
  invoice,
  onClose,
  onRefresh,
  onUpdateInvoice,
  onTriggerActionModal,
  formatRupiah
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [isSubmittingMutation, setIsSubmittingMutation] = useState(false);

  const getSafeImageUrl = (url) => {
    if (!url) return "";
    return url.replace("i.ibb.co", "i.ibb.co.com");
  };

  useEffect(() => {
    if (invoice) {
      const externalCostSum = invoice.externalProcurements?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0;
      const baseServicePrice = (invoice.amount || 0) - externalCostSum;

      const defaultItemsManifest = invoice.items || [
        { 
          name: "Biaya Jasa Perbaikan & Operasional Utama Bengkel", 
          price: baseServicePrice > 0 ? baseServicePrice : 0 
        }
      ];
      setEditableItems(defaultItemsManifest);
    } else {
      setIsEditing(false);
      setEditableItems([]);
    }
  }, [invoice]);

  const handleAddNewBillingItem = () => {
    setEditableItems([...editableItems, { name: "", price: 0 }]);
  };

  const handleRemoveBillingItem = (indexTarget) => {
    if (editableItems.length === 1) {
      alert("Minimal harus ada 1 item tindakan layanan di dalam invoice!");
      return;
    }
    setEditableItems(editableItems.filter((_, idx) => idx !== indexTarget));
  };

  const handleItemDataChange = (indexTarget, fieldTarget, newValue) => {
    const backupArray = [...editableItems];
    if (fieldTarget === "price") {
      backupArray[indexTarget][fieldTarget] = Math.round(Number(newValue)) || 0;
    } else {
      backupArray[indexTarget][fieldTarget] = newValue;
    }
    setEditableItems(backupArray);
  };

  const externalCostSum = invoice?.externalProcurements?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0;
  const calculatedItemsTotal = editableItems.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalNewInvoiceAmount = calculatedItemsTotal + externalCostSum;

  const handleCommitInvoiceUpgrades = async () => {
    const isNameInvalid = editableItems.some(item => !item.name.trim());
    if (isNameInvalid) {
      alert("Nama deskripsi tindakan jasa tidak boleh kosong!");
      return;
    }

    try {
      setIsSubmittingMutation(true);
      const targetCollection = invoice.isTicket ? "serviceTickets" : "invoices";
      const targetDocRef = doc(db, targetCollection, invoice.docId);

      const updatePayload = {
        items: editableItems,
      };

      if (invoice.isTicket) {
        updatePayload.invoiceAmount = totalNewInvoiceAmount;
      } else {
        updatePayload.amount = totalNewInvoiceAmount;
      }

      await updateDoc(targetDocRef, updatePayload);
      await onRefresh();

      onUpdateInvoice({
        ...invoice,
        items: editableItems,
        amount: totalNewInvoiceAmount
      });

      setIsEditing(false);
      alert(`Berhasil melakukan penyesuaian tarif jasa kustom pada nota ${invoice.id}!`);
    } catch (err) {
      alert(`Gagal menyimpan kustomisasi nota: ${err.message}`);
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto text-left">
        
        <button onClick={onClose} className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
          <FiXCircle size={20} />
        </button>
        
        <div className="mb-6 border-b border-slate-800 pb-4 flex items-center justify-between pr-8">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-blue-500">Berkas Faktur Finansial</span>
            <h3 className="text-base font-mono font-bold text-white mt-0.5">{invoice.id}</h3>
          </div>
          
          {/* Menu Kustomisasi Jasa hanya terbuka jika Statusnya belum bayar */}
          {!invoice.isPaid && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${isEditing ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"}`}
            >
              <FiEdit2 size={12} /> {isEditing ? "Batal Kustom" : "Kustom Jasa/Nota"}
            </button>
          )}
        </div>

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
            <span className="text-slate-300 truncate max-w-[140px]">{invoice.method || "Cash"}</span>
          </div>
        </div>

        <div className="space-y-3 mb-6 text-left">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiFileText className="text-blue-500" /> Rincian Itemized Layanan Jasa Bengkel
            </h4>
            
            {isEditing && (
              <button type="button" onClick={handleAddNewBillingItem} className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer">
                <FiPlus size={14} /> Tambah Item Jasa
              </button>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 space-y-2.5">
            {editableItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40">
                {isEditing ? (
                  <>
                    <input type="text" value={item.name} required onChange={(e) => handleItemDataChange(idx, "name", e.target.value)} placeholder="Contoh: Ongkos Bongkar Set Kaki Depan" className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-blue-500" />
                    <div className="relative flex items-center w-28">
                      <span className="absolute left-2.5 text-[10px] font-bold text-slate-600">Rp</span>
                      <input type="number" value={item.price} onChange={(e) => handleItemDataChange(idx, "price", e.target.value)} className="w-full pl-7 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-400 font-mono font-bold outline-none text-right" />
                    </div>
                    <button type="button" onClick={() => handleRemoveBillingItem(idx)} className="text-slate-600 hover:text-rose-400 p-1 transition cursor-pointer"><FiTrash2 size={14} /></button>
                  </>
                ) : (
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
              <span>Subtotal Nominal Jasa Layanan</span>
              <span className="font-mono">{formatRupiah(calculatedItemsTotal)}</span>
            </div>
          </div>
        </div>

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
                        <a href={getSafeImageUrl(proc.receiptPhotoUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 rounded transition font-medium">
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

        <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/60 mb-6 text-xs">
          <div className="text-left">
            <span className="text-slate-500 font-medium text-sm block">Total Akumulasi Tagihan Keseluruhan</span>
            {isEditing && <span className="text-[10px] text-blue-400 font-medium">*Menampilkan kalkulasi live rumus di layar</span>}
          </div>
          <span className="text-base font-bold font-mono text-emerald-400">
            {formatRupiah(isEditing ? totalNewInvoiceAmount : invoice.amount || 0)}
          </span>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Transaksi Faktur</p>
            <p className={`font-bold mt-0.5 ${invoice.isPaid ? "text-emerald-400" : !invoice.billSent ? "text-purple-400" : "text-amber-500"}`}>
              {invoice.isPaid ? "LUNAS (MUTASI SELESAI)" : !invoice.billSent ? "MENUNGGU KIRIM TAGIHAN" : "MENUNGGU SETTLEMENT"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              <button type="button" disabled={isSubmittingMutation} onClick={handleCommitInvoiceUpgrades} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-blue-600/10 flex items-center gap-1 disabled:bg-slate-800">
                <FiSave size={14} /> {isSubmittingMutation ? "Syncing..." : "Simpan Perubahan"}
              </button>
            ) : (
              // DELEGASI LOGIKA MODAL PIPELINE BERTAHAP KE COMPONENT UTAMA
              !invoice.isPaid && (
                !invoice.billSent ? (
                  <button onClick={() => { onClose(); onTriggerActionModal("send_bill", invoice); }} className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"><FiSend size={12}/> Kirim Tagihan</button>
                ) : (
                  <button onClick={() => { onClose(); onTriggerActionModal("authorize_paid", invoice); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"><FiCheck size={12}/> Otorisasi Lunas</button>
                )
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}