"use client";

import { useState } from "react";
import { FiX, FiFilePlus, FiCamera, FiCheckCircle } from "react-icons/fi";
// IMPORT KONEKSI DATABASE FIRESTORE ASLI LU (2 LEVEL KE ATAS)
import { db } from "../../lib/client";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

export default function AddTicketModal({ isOpen, onClose, onRefresh }) {
  // STATE UI: Mengontrol langkah/flow di dalam modal
  const [ticketFlowType, setTicketFlowType] = useState(null); // 'guest' atau 'qr_scan'
  const [scanStep, setScanStep] = useState("input"); // 'input' atau 'form_fill'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Payload Form Data Guest Walk-In (Manual isi lengkap)
  const [guestFormData, setGuestFormData] = useState({
    customerName: "",
    customerPhone: "",
    plateNumber: "",
    brand: "",
    modelType: "",
    year: "",
    color: "",
    engineType: "Bensin",
    transmission: "Automatic",
    kmCheckIn: "",
    tasks: "",
    photoUrl: ""
  });

  // State Payload Form Data Registered via QR Scan
  const [scannedCarId, setScannedCarId] = useState("");
  const [isFetchingQrData, setIsFetchingQrData] = useState(false);
  const [scannedCarDetails, setScannedCarDetails] = useState(null);
  const [registeredTicketData, setRegisteredTicketData] = useState({
    kmCheckIn: "",
    tasks: "",
    photoUrl: ""
  });

  if (!isOpen) return null;

  // PROCESSOR 1: Menangani pencarian data mobil berdasarkan Hash ID QR Code (carId)
  const handleProcessQrCodeScan = async (e) => {
    e.preventDefault();
    if (!scannedCarId.trim()) return;

    try {
      setIsFetchingQrData(true);
      console.log(`Cloud Scanner: Melakukan kueri dokumen mobil untuk hash ID [${scannedCarId}]...`);
      
      const carDocRef = doc(db, "cars", scannedCarId.trim());
      const carSnapshot = await getDoc(carDocRef);

      if (!carSnapshot.exists()) {
        throw new Error("QR Code tidak valid atau berkas mobil tidak ditemukan di database server.");
      }

      const carData = carSnapshot.data();
      setScannedCarDetails({
        carId: carSnapshot.id,
        brand: carData.brand || "Merek Kustom",
        type: carData.type || carData.model || "Tipe Unit",
        plate: carData.plate || carData.plateNumber || "AD 0000 XX",
        year: carData.year || "-",
        color: carData.color || "Kustom",
        engineType: carData.engineType || "Bensin",
        customerUid: carData.customerUid || carData.customerId || ""
      });

      setScanStep("form_fill");
    } catch (err) {
      alert(`Scanner Error: ${err.message}`);
    } finally {
      setIsFetchingQrData(false);
    }
  };

  // PROCESSOR 2: Submit data tiket untuk Guest Walk-In (Manual)
  const handleSubmitGuestWalkInTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ticketsRef = collection(db, "serviceTickets");
      const timestampId = `SRV-${Date.now()}`;
      const photoArray = guestFormData.photoUrl.trim() ? [guestFormData.photoUrl.trim()] : [];

      const payload = {
        ticketId: timestampId,
        customerUid: `guest_${guestFormData.customerPhone}`,
        mechanicId: "",
        mechanicName: "",
        status: "waiting",
        tasks: guestFormData.tasks,
        kmCheckIn: Math.round(Number(guestFormData.kmCheckIn)) || 0,
        kmService: 0,
        invoiceAmount: 0,
        complaintPhotoUrls: photoArray,
        externalProcurements: [],
        createdAt: new Date(),
        date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        carDetails: {
          carId: "",
          brand: guestFormData.brand,
          type: guestFormData.modelType,
          plate: guestFormData.plateNumber,
          year: guestFormData.year,
          color: guestFormData.color || "-",
          engineType: guestFormData.engineType
        }
      };

      await addDoc(ticketsRef, payload);
      alert(`Sukses menerbitkan tiket antrean Guest ${timestampId}!`);
      
      handleLocalResetAndClose();
      await onRefresh();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // PROCESSOR 3: Submit data tiket untuk Registered via QR Scan
  const handleSubmitRegisteredQrTicket = async (e) => {
    e.preventDefault();
    if (!scannedCarDetails) return;
    setIsSubmitting(true);

    try {
      const ticketsRef = collection(db, "serviceTickets");
      const timestampId = `SRV-${Date.now()}`;
      const photoArray = registeredTicketData.photoUrl.trim() ? [registeredTicketData.photoUrl.trim()] : [];

      const payload = {
        ticketId: timestampId,
        customerUid: scannedCarDetails.customerUid,
        mechanicId: "",
        mechanicName: "",
        status: "waiting",
        tasks: registeredTicketData.tasks,
        kmCheckIn: Math.round(Number(registeredTicketData.kmCheckIn)) || 0,
        kmService: 0,
        invoiceAmount: 0,
        complaintPhotoUrls: photoArray,
        externalProcurements: [],
        createdAt: new Date(),
        date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        carDetails: {
          carId: scannedCarDetails.carId,
          brand: scannedCarDetails.brand,
          type: scannedCarDetails.type,
          plate: scannedCarDetails.plate,
          year: scannedCarDetails.year,
          color: scannedCarDetails.color,
          engineType: scannedCarDetails.engineType
        }
      };

      await addDoc(ticketsRef, payload);
      alert(`Sukses mengarsip tiket Walk-In Registered ${timestampId}!`);
      
      handleLocalResetAndClose();
      await onRefresh();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalResetAndClose = () => {
    setTicketFlowType(null);
    setScanStep("input");
    setScannedCarId("");
    setScannedCarDetails(null);
    setGuestFormData({
      customerName: "", customerPhone: "", plateNumber: "", brand: "", modelType: "",
      year: "", color: "", engineType: "Bensin", transmission: "Automatic", kmCheckIn: "", tasks: "", photoUrl: ""
    });
    setRegisteredTicketData({ kmCheckIn: "", tasks: "", photoUrl: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl max-h-[92vh] overflow-y-auto">
        
        <button onClick={handleLocalResetAndClose} className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
          <FiX size={20} />
        </button>

        {/* PANEL 1: SELEKSI SEGMEN UTAMAA */}
        {ticketFlowType === null && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Registrasi Kedatangan Antrean (Walk-In)</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Pilih klasifikasi jenis akun pendaftaran konsumen untuk mempercepat alur kerja loket kasir.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div onClick={() => setTicketFlowType("guest")} className="bg-slate-950 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 text-left cursor-pointer transition group hover:bg-blue-600/5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-black transition">
                  <FiFilePlus size={20} />
                </div>
                <h4 className="text-sm font-bold text-white">Guest Walk-In (Isi Manual)</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Untuk pelanggan offline yang belum terdaftar atau tidak membawa HP. Seluruh formulir spesifikasi mobil wajib diisi manual.</p>
              </div>

              <div onClick={() => setTicketFlowType("qr_scan")} className="bg-slate-950 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 text-left cursor-pointer transition group hover:bg-blue-600/5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:bg-purple-500 group-hover:text-black transition">
                  <FiCamera size={20} />
                </div>
                <h4 className="text-sm font-bold text-white">Scan QR Code (Pelanggan App)</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Untuk konsumen yang sudah punya akun di HP Android. Cukup scan kode matriks mobil untuk tarik spesifikasi aset secara otomatis.</p>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: FORM GUEST MANUAL */}
        {ticketFlowType === "guest" && (
          <form onSubmit={handleSubmitGuestWalkInTicket} className="space-y-4 text-left">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Faktur Antrean Guest Walk-In</h3>
              <p className="text-xs text-slate-400 mt-0.5">Membuat lembar kerja antrean mekanik dengan pengisian spesifikasi mobil manual.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Nama Lengkap Konsumen</label>
                <input type="text" required value={guestFormData.customerName} onChange={(e) => setGuestFormData({...guestFormData, customerName: e.target.value})} placeholder="Contoh: Joko" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Nomor WhatsApp Aktif</label>
                <input type="tel" required value={guestFormData.customerPhone} onChange={(e) => setGuestFormData({...guestFormData, customerPhone: e.target.value})} placeholder="Contoh: 0812xxxxxxxx" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Nomor Pelat</label>
                <input type="text" required value={guestFormData.plateNumber} onChange={(e) => setGuestFormData({...guestFormData, plateNumber: e.target.value.toUpperCase()})} placeholder="Contoh: AD 9999 GL" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold tracking-wide outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Merek Pabrikan</label>
                <input type="text" required value={guestFormData.brand} onChange={(e) => setGuestFormData({...guestFormData, brand: e.target.value})} placeholder="Contoh: Toyota" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Tipe / Model Unit</label>
                <input type="text" required value={guestFormData.modelType} onChange={(e) => setGuestFormData({...guestFormData, modelType: e.target.value})} placeholder="Contoh: Avanza" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Tahun Perakitan</label>
                <input type="number" required value={guestFormData.year} onChange={(e) => setGuestFormData({...guestFormData, year: e.target.value})} placeholder="Contoh: 2024" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Pilihan Transmisi</label>
                <select value={guestFormData.transmission} onChange={(e) => setGuestFormData({...guestFormData, transmission: e.target.value})} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none">
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Odometer KM Masuk</label>
                <input type="number" required value={guestFormData.kmCheckIn} onChange={(e) => setGuestFormData({...guestFormData, kmCheckIn: e.target.value})} placeholder="Contoh: 45000" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-400">Deskripsi Keluhan & Tindakan Perbaikan</label>
              <textarea required rows={3} value={guestFormData.tasks} onChange={(e) => setGuestFormData({...guestFormData, tasks: e.target.value})} placeholder="Ketik rincian kerusakan..." className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed" />
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-400">URL Foto Lampiran (Opsional)</label>
              <input type="url" value={guestFormData.photoUrl} onChange={(e) => setGuestFormData({...guestFormData, photoUrl: e.target.value})} placeholder="https://i.ibb.co/example.jpg" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none" />
            </div>

            <div className="flex gap-3 pt-4 text-xs">
              <button type="button" onClick={() => setTicketFlowType(null)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl hover:text-white transition cursor-pointer">Kembali</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg disabled:bg-slate-800 transition cursor-pointer">
                {isSubmitting ? "Syncing..." : "Terbitkan Tiket Antrean"}
              </button>
            </div>
          </form>
        )}

        {/* PANEL 3: SCANNER RADAR MONITOR */}
        {ticketFlowType === "qr_scan" && scanStep === "input" && (
          <div className="space-y-6 py-2">
            <div className="border-b border-slate-800 pb-3 text-left">
              <h3 className="text-base font-bold text-white">Digital Boarding Pass QR Scanner</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pindai kode matriks digital dari aplikasi pelanggan untuk otentikasi data mobil aman.</p>
            </div>

            <div className="relative w-full max-w-sm aspect-square bg-slate-950 border-2 border-slate-800 rounded-3xl mx-auto flex flex-col items-center justify-center overflow-hidden shadow-inner group">
              <div className="absolute inset-x-0 h-0.5 bg-rose-500/80 shadow-[0_0_12px_#f43f5e] animate-bounce top-0"></div>
              <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-purple-500 rounded-tl"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-purple-500 rounded-tr"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-purple-500 rounded-bl"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-purple-500 rounded-br"></div>
              <div className="text-slate-700 group-hover:text-purple-500 transition duration-300 animate-pulse mb-2"><FiCamera size={48} /></div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Webcam Stream Active</p>
            </div>

            <form onSubmit={handleProcessQrCodeScan} className="space-y-4 max-w-sm mx-auto text-left text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-purple-400">Hasil Tangkapan Kamera String (Hash carId)</label>
                <div className="flex gap-2">
                  <input type="text" required value={scannedCarId} onChange={(e) => setScannedCarId(e.target.value)} placeholder="Paste hash ID mobil di sini..." className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:ring-1 focus:ring-purple-500 transition" />
                  <button type="submit" disabled={isFetchingQrData} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 rounded-xl transition cursor-pointer min-w-[80px]">
                    {isFetchingQrData ? "Reading..." : "Kueri"}
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => setTicketFlowType(null)} className="w-full py-2.5 bg-slate-950 border border-slate-800 text-slate-500 font-medium rounded-xl hover:text-white transition cursor-pointer">Kembali</button>
            </form>
          </div>
        )}

        {/* PANEL 4: AUTO-POPULATE FORMULIR */}
        {ticketFlowType === "qr_scan" && scanStep === "form_fill" && scannedCarDetails && (
          <form onSubmit={handleSubmitRegisteredQrTicket} className="space-y-4 text-left animate-fade-in">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-emerald-400 flex items-center gap-1.5"><FiCheckCircle /> Otentikasi QR Berhasil</h3>
                <p className="text-xs text-slate-400 mt-0.5">Spesifikasi aset mobil otomatis ditarik dari satelit cloud server.</p>
              </div>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20 px-2.5 py-0.5 rounded-full">App User Locked</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div><p className="text-[10px] text-slate-500 font-semibold uppercase">Nomor Pelat</p><p className="font-mono font-bold text-white text-sm mt-0.5">{scannedCarDetails.plate}</p></div>
              <div><p className="text-[10px] text-slate-500 font-semibold uppercase">Merek</p><p className="font-semibold text-slate-200 mt-0.5">{scannedCarDetails.brand}</p></div>
              <div><p className="text-[10px] text-slate-500 font-semibold uppercase">Model / Tipe</p><p className="font-semibold text-slate-200 mt-0.5">{scannedCarDetails.type}</p></div>
              <div><p className="text-[10px] text-slate-500 font-semibold uppercase">Tahun</p><p className="font-mono text-slate-200 mt-0.5">{scannedCarDetails.year}</p></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Odometer KM Masuk</label>
                <input type="number" required value={registeredTicketData.kmCheckIn} onChange={(e) => setRegisteredTicketData({...registeredTicketData, kmCheckIn: e.target.value})} placeholder="Contoh: 12000" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-slate-400">URL Bukti Foto Keluhan (Opsional)</label>
                <input type="url" value={registeredTicketData.photoUrl} onChange={(e) => setRegisteredTicketData({...registeredTicketData, photoUrl: e.target.value})} placeholder="https://i.ibb.co/example.png" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none" />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-400">Deskripsi Keluhan Hasil Wawancara Konsumen</label>
              <textarea required rows={3} value={registeredTicketData.tasks} onChange={(e) => setRegisteredTicketData({...registeredTicketData, tasks: e.target.value})} placeholder="Ketik rincian keluhan..." className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed" />
            </div>

            <div className="flex gap-3 pt-4 text-xs">
              <button type="button" onClick={() => setScanStep("input")} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl hover:text-white transition cursor-pointer">Ulangi Scan</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg disabled:bg-slate-800 transition cursor-pointer">
                {isSubmitting ? "Syncing..." : "Terbitkan Tiket Antrean (App User)"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}