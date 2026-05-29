"use client";

import { useState, useEffect, useRef } from "react";
import { FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import { db } from "../../../lib/client";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

export default function QrScanTicketForm({ onCancel, onRefresh }) {
  // CRITICAL FIX: Penataan urutan inisialisasi State paling atas agar terhindar dari ReferenceError
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraError, setCameraError] = useState(null);
  const [scanStep, setScanStep] = useState("scan_mode"); 
  const [scannedCarId, setScannedCarId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carDetails, setCarDetails] = useState(null);
  const [ticketData, setTicketData] = useState({ kmCheckIn: "", tasks: "", photoUrl: "" });
  
  // REFERENSI HARDWARE POINTER LINTAS LIFECYCLE
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const loopRef = useRef(null);

  // KONTROL HIDUP-MATI DRIVER MEDIA KAMERA BROWSER
  useEffect(() => {
    if (scanStep === "scan_mode") {
      startCamera();
      loadScript();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [scanStep, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true);
        videoRef.current.play();
        loopRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      setCameraError("Sistem gagal mengakses fungsionalitas kamera. Pastikan hak akses diberikan pada pengaturan privasi browser Anda.");
    }
  };

  const loadScript = () => {
    if (window.jsQR) return;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_CURRENT_DATA && window.jsQR) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "dontInvert" });

        if (code && code.data) {
          setScannedCarId(code.data);
          fetchCarData(code.data);
          return;
        }
      }
    }
    loopRef.current = requestAnimationFrame(tick);
  };

  const stopCamera = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const fetchCarData = async (carId) => {
    try {
      setIsFetching(true);
      const snap = await getDoc(doc(db, "cars", carId.trim()));
      if (!snap.exists()) throw new Error("ID Kendaraan digital tidak ditemukan dalam sistem cloud database.");
      
      const data = snap.data();
      setCarDetails({
        carId: snap.id, brand: data.brand || "Merek Kustom", type: data.type || data.model || "Tipe Unit",
        plate: data.plate || data.plateNumber || "AD 0000 XX", year: data.year || "-",
        color: data.color || "-", engineType: data.engineType || "Bensin", customerUid: data.customerUid || data.customerId || ""
      });
      setScanStep("form_fill");
    } catch (err) {
      alert(`Validasi Gagal: ${err.message}`);
      setScannedCarId("");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!carDetails) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "serviceTickets"), {
        ticketId: `SRV-${Date.now()}`,
        customerUid: carDetails.customerUid,
        mechanicId: "", mechanicName: "", status: "waiting",
        tasks: ticketData.tasks,
        kmCheckIn: Number(ticketData.kmCheckIn) || 0,
        kmService: 0, invoiceAmount: 0,
        complaintPhotoUrls: ticketData.photoUrl.trim() ? [ticketData.photoUrl.trim()] : [],
        externalProcurements: [], createdAt: new Date(),
        date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        carDetails: { ...carDetails }
      });

      alert("Tiket boarding antrean pelanggan aplikasi berhasil terbit.");
      onCancel();
      await onRefresh();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {scanStep === "scan_mode" ? (
        <div className="space-y-6 py-2">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-base font-bold text-white">Pemindai Otentikasi Digital (QR Scanner)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pindai kode QR dari aplikasi HP pelanggan untuk memuat spesifikasi unit kendaraan otomatis.</p>
            </div>
            <button type="button" onClick={() => setFacingMode(p => p === "environment" ? "user" : "environment")} className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer">
              <FiRefreshCw size={12} /> <span>Lensa: {facingMode === "environment" ? "Belakang" : "Depan"}</span>
            </button>
          </div>

          <div className="relative w-full max-w-md aspect-video bg-slate-950 border-2 border-slate-800 rounded-3xl mx-auto flex flex-col items-center justify-center overflow-hidden shadow-2xl">
            {cameraError ? (
              <p className="text-xs text-rose-400 p-4 text-center">{cameraError}</p>
            ) : (
              <>
                <div className="absolute inset-x-0 h-0.5 bg-rose-500/80 shadow-[0_0_12px_#f43f5e] animate-bounce top-0 z-10"></div>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); fetchCarData(scannedCarId); }} className="space-y-4 max-w-md mx-auto text-left text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-purple-400">Input Manual Hash ID Kendaraan (Opsi Cadangan)</label>
              <div className="flex gap-2">
                <input type="text" required value={scannedCarId} onChange={(e) => setScannedCarId(e.target.value)} placeholder="Masukkan kode dokumen mobil..." className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none" />
                <button type="submit" disabled={isFetching} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 rounded-xl min-w-[80px]">{isFetching ? "Memuat..." : "Proses"}</button>
              </div>
            </div>
            <button type="button" onClick={onCancel} className="w-full py-2.5 bg-slate-950 border border-slate-800 text-slate-500 font-medium rounded-xl hover:text-white text-center">Kembali</button>
          </form>
        </div>
      ) : (
        carDetails && (
          <form onSubmit={handleSubmit} className="space-y-4 text-left animate-fade-in text-xs">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-emerald-400 flex items-center gap-1.5"><FiCheckCircle /> Validasi Berhasil</h3>
                <p className="text-xs text-slate-400 mt-0.5">Spesifikasi unit kendaraan otomatis sinkron dari database server.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div><p className="text-[10px] text-slate-500 font-semibold uppercase">Nomor Pelat</p><p className="font-mono font-bold text-white text-sm mt-0.5">{carDetails.plate}</p></div>
              <div><p className="text-[10px] text-slate-500 font-semibold uppercase">Merek</p><p className="font-semibold text-slate-200 mt-0.5">{carDetails.brand}</p></div>
              <div><p className="text-[10px] text-slate-500 font-semibold uppercase">Model / Tipe</p><p className="font-semibold text-slate-200 mt-0.5">{carDetails.type}</p></div>
              <div><p className="text-[10px] text-slate-500 font-semibold uppercase">Tahun</p><p className="font-mono text-slate-200 mt-0.5">{carDetails.year}</p></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400">Odometer Masuk (KM)</label>
                <input type="number" required value={ticketData.kmCheckIn} onChange={(e) => setTicketData({...ticketData, kmCheckIn: e.target.value})} placeholder="Contoh: 12000" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-slate-400">URL Gambar Tambahan (Opsional)</label>
                <input type="url" value={ticketData.photoUrl} onChange={(e) => setTicketData({...ticketData, photoUrl: e.target.value})} placeholder="https://i.ibb.co/example.png" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400">Deskripsi Keluhan Hasil Wawancara Pelanggan</label>
              <textarea required rows={3} value={ticketData.tasks} onChange={(e) => setTicketData({...ticketData, tasks: e.target.value})} placeholder="Ketik rincian gejala kerusakan mesin..." className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none resize-none leading-relaxed" />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setScanStep("scan_mode")} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl hover:text-white text-center">Ulangi Pemindaian</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition">{isSubmitting ? "Menyimpan..." : "Simpan Berkas Tiket"}</button>
            </div>
          </form>
        )
      )}
    </div>
  );
}