"use client";

import { useState, useRef, useEffect } from "react";
import { FiUpload, FiCamera, FiTrash2 } from "react-icons/fi";
import { db } from "../../../lib/client";
import { collection, addDoc, doc, setDoc, getDocs, query, where } from "firebase/firestore";

export default function GuestTicketForm({ onCancel, onRefresh, customers = [] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [existingVehicles, setExistingVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  const [brandSelection, setBrandSelection] = useState("");
  const [customBrandName, setCustomBrandName] = useState("");

  const popularBrands = ["Toyota", "Honda", "Daihatsu", "Suzuki", "Mitsubishi", "Nissan", "Hyundai", "Wuling", "Mazda", "Other"];

  const [formData, setFormData] = useState({
    customerName: "", customerPhone: "", plateNumber: "", modelType: "",
    year: "", color: "", engineType: "Bensin", transmission: "Automatic",
    kmCheckIn: "", tasks: ""
  });

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleCustomerProfileSelect = async (phoneId) => {
    setSelectedCustomerId(phoneId);
    setSelectedVehicleId("");
    setExistingVehicles([]);
    
    if (!phoneId) {
      setFormData(prev => ({ ...prev, customerName: "", customerPhone: "" }));
      return;
    }

    const matchedCustomer = customers.find(c => c.phone === phoneId);
    if (matchedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerName: matchedCustomer.name,
        customerPhone: matchedCustomer.phone
      }));

      try {
        setIsLoadingVehicles(true);
        const vehiclesRef = collection(db, "vehicles");
        const q = query(vehiclesRef, where("customerId", "==", phoneId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
        setExistingVehicles(list);
      } catch (err) {
        console.error("Gagal memuat daftar kendaraan pelanggan:", err);
      } finally {
        setIsLoadingVehicles(false);
      }
    }
  };

  const handleVehicleSelect = (vDocId) => {
    setSelectedVehicleId(vDocId);
    if (!vDocId) return;

    const car = existingVehicles.find(v => v.docId === vDocId);
    if (car) {
      setFormData(prev => ({
        ...prev,
        plateNumber: car.plateNumber || "",
        modelType: car.model || "",
        year: car.year || "",
        color: car.color || "",
        engineType: car.engineType || "Bensin",
        transmission: car.transmission || "Automatic"
      }));

      if (popularBrands.includes(car.brand)) {
        setBrandSelection(car.brand);
        setCustomBrandName("");
      } else {
        setBrandSelection("Other");
        setCustomBrandName(car.brand || "");
      }
    }
  };

  const compressImage = (srcBase64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = srcBase64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 800; const maxHeight = 600;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
        else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
    });
  };

  const toggleCamera = async (activate) => {
    if (activate) {
      try {
        setIsCameraActive(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        streamRef.current = stream;
        setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
      } catch (err) {
        alert("Sistem gagal mengakses perangkat kamera.");
        setIsCameraActive(false);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
    }
  };

  const captureSnapshot = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const compressed = await compressImage(canvas.toDataURL("image/jpeg"));
      setPhotoPreview(compressed);
      toggleCamera(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const compressed = await compressImage(event.target.result);
        setPhotoPreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalBrand = brandSelection === "Other" ? customBrandName.trim() : brandSelection;
    if (!finalBrand) return alert("Mohon tentukan merek kendaraan terlebih dahulu.");

    setIsSubmitting(true);
    let uploadedImageUrl = "";

    try {
      if (photoPreview) {
        const base64RawString = photoPreview.split(",")[1] || photoPreview;
        const imgbbFormData = new FormData();
        imgbbFormData.append("image", base64RawString);

        const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
        if (!IMGBB_API_KEY) {
          throw new Error("API Key ImgBB tidak ditemukan di file .env.local");
        }
        
        console.log("Next.js Client: Mengunggah berkas kompresi foto keluhan ke awan ImgBB...");
        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: "POST",
          body: imgbbFormData,
        });

        const imgbbResult = await imgbbResponse.json();
        if (imgbbResult.success && imgbbResult.data?.url) {
          uploadedImageUrl = imgbbResult.data.url;
        } else {
          throw new Error(imgbbResult.error?.message || "Respons API ImgBB gagal.");
        }
      }

      const phone = formData.customerPhone.trim();
      const uniqueCustomerUid = `guest_${phone}`;
      const timestampId = `SRV-${Date.now()}`;
      
      const customerDocRef = doc(db, "customers", phone);
      await setDoc(customerDocRef, {
        name: formData.customerName,
        phone: phone,
        type: "Guest",
        joinedDate: new Date().toLocaleDateString("id-ID"),
        totalVehicles: 1 
      }, { merge: true });

      let activeVehicleDocId = selectedVehicleId;
      if (!activeVehicleDocId) {
        const newVehicleRef = await addDoc(collection(db, "vehicles"), {
          customerId: phone,
          plateNumber: formData.plateNumber.toUpperCase(),
          brand: finalBrand,
          model: formData.modelType,
          year: formData.year,
          transmission: formData.transmission,
          color: formData.color,
          engineType: formData.engineType
        });
        activeVehicleDocId = newVehicleRef.id;
      }

      // --- REKTIFIKASI UTAMA: UBAH STATUS MENJADI PENDING AGAR MASUK PROSES VERIFIKASI ---
      await addDoc(collection(db, "serviceTickets"), {
        ticketId: timestampId,
        customerUid: uniqueCustomerUid,
        mechanicId: "", mechanicName: "",
        status: "pending", // <-- Status diubah dari "waiting" menjadi "pending"
        tasks: formData.tasks,
        kmCheckIn: Number(formData.kmCheckIn) || 0,
        kmService: 0, invoiceAmount: 0,
        complaintPhotoUrls: uploadedImageUrl ? [uploadedImageUrl] : [],
        externalProcurements: [],
        createdAt: new Date(),
        date: new Date().toLocaleDateString("id-ID"),
        carDetails: {
          carId: activeVehicleDocId,
          brand: finalBrand, type: formData.modelType, plate: formData.plateNumber.toUpperCase(),
          year: formData.year, color: formData.color, engineType: formData.engineType, transmission: formData.transmission
        }
      });

      alert("Berkas pendaftaran antrean berhasil dikirim. Menunggu verifikasi loket.");
      onCancel();
      await onRefresh();
    } catch (err) { 
      alert(`Kegagalan transaksi data: ${err.message}`); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-blue-400">Gunakan Profil Pelanggan Tetap Terdaftar (Opsional)</label>
          <select 
            value={selectedCustomerId} 
            onChange={(e) => handleCustomerProfileSelect(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none cursor-pointer text-xs"
          >
            <option value="">-- Pilih Profil Pelanggan Tamu --</option>
            {customers.filter(c => c.type === "Guest").map(c => (
              <option key={c.phone} value={c.phone}>{c.name} ({c.phone})</option>
            ))}
          </select>
        </div>

        {existingVehicles.length > 0 && (
          <div className="space-y-1.5 text-xs animate-fade-in">
            <label className="font-semibold text-emerald-400">Pilih Aset Unit Kendaraan Terdaftar Milik Pelanggan</label>
            <select 
              value={selectedVehicleId} 
              onChange={(e) => handleVehicleSelect(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none cursor-pointer text-xs"
            >
              <option value="">-- Daftarkan Kendaraan Baru (Isi Formulir Manual) --</option>
              {existingVehicles.map(v => (
                <option key={v.docId} value={v.docId}>{v.plateNumber} - {v.brand} {v.model}</option>
              ))}
            </select>
          </div>
        )}
        {isLoadingVehicles && <p className="text-[11px] text-slate-500 animate-pulse">Menghubungkan ke basis data internal kendaraan...</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Nama Lengkap Pelanggan</label>
            <input type="text" required value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} placeholder="Nama Lengkap" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Nomor Telepon / WhatsApp</label>
            <input type="tel" required value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} placeholder="Nomor WhatsApp" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none" />
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2">Spesifikasi Unit Kendaraan Masuk</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400">Merek Kendaraan</label>
              <select required value={brandSelection} onChange={(e) => { setBrandSelection(e.target.value); if (e.target.value !== "Other") setCustomBrandName(""); }} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer">
                <option value="" disabled>-- Pilih Pabrikan Kendaraan --</option>
                {popularBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {brandSelection === "Other" && (
                <input type="text" required value={customBrandName} onChange={(e) => setCustomBrandName(e.target.value)} placeholder="Masukkan Merek Unit Kustom" className="w-full px-3 py-2.5 bg-slate-950 border border-purple-500/40 rounded-xl text-white outline-none mt-2" />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400">Tipe / Model Seri</label>
              <input type="text" required value={formData.modelType} onChange={(e) => setFormData({...formData, modelType: e.target.value})} placeholder="Contoh: Avanza Veloz" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400">Jenis Bahan Bakar</label>
              <select value={formData.engineType} onChange={(e) => setFormData({...formData, engineType: e.target.value})} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none">
                <option value="Bensin">Bensin (Gasoline)</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid (HEV)</option>
                <option value="Listrik">Listrik Murni (EV)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400">Sistem Transmisi Gearbox</label>
              <select value={formData.transmission} onChange={(e) => setFormData({...formData, transmission: e.target.value})} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none">
                <option value="Automatic">Automatic Transmission (A/T)</option>
                <option value="Manual">Manual Transmission (M/T)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400">Nomor Registrasi Polisi (Pelat)</label>
              <input type="text" required value={formData.plateNumber} onChange={(e) => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})} placeholder="Contoh: AD 5748 ALC" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold tracking-wider" />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400">Tahun Perakitan Pabrik</label>
              <input type="number" required value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} placeholder="Contoh: 2024" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400">Warna Cat Fisik Kendaraan</label>
              <input type="text" required value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} placeholder="Contoh: Abu-abu Metalik" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400">Odometer Aktual Kendaraan (KM)</label>
              <input type="number" required value={formData.kmCheckIn} onChange={(e) => setFormData({...formData, kmCheckIn: e.target.value})} placeholder="Contoh: 45200" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-slate-400">Deskripsi Keluhan & Gejala Malfungsi Mekanis</label>
          <textarea required rows={3} value={formData.tasks} onChange={(e) => setFormData({...formData, tasks: e.target.value})} placeholder="Tulis rincian kerusakan atau keluhan pelanggan..." className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none resize-none leading-relaxed" />
        </div>

        <div className="space-y-2 text-xs">
          <label className="font-semibold text-slate-400">Dokumentasi Visual Kondisi Fisik Komponen</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex gap-2">
                <label className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition text-center text-slate-400 hover:text-white">
                  <FiUpload size={16} className="mb-1" /> <span>Unggah dari Dokumen</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <button type="button" onClick={() => toggleCamera(!isCameraActive)} className={`flex-1 border rounded-xl p-3 flex flex-col items-center justify-center transition text-center cursor-pointer ${isCameraActive ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <FiCamera size={16} className="mb-1" /> <span>{isCameraActive ? "Nonaktifkan Kamera" : "Aktifkan Perangkat Kamera"}</span>
                </button>
              </div>
              {isCameraActive && (
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-slate-700 shadow-inner">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <button type="button" onClick={captureSnapshot} className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-full text-[11px] shadow-lg cursor-pointer">Tangkap Foto Kontrol</button>
                </div>
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-center min-h-[100px]">
              {photoPreview ? (
                <div className="relative w-full max-w-[180px] aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotoPreview("")} className="absolute top-2 right-2 p-1 bg-slate-950/80 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"><FiTrash2 size={12} /></button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-600 italic text-center">Belum ada berkas dokumentasi fisik yang dilampirkan.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 text-xs">
          <button type="button" onClick={onCancel} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl hover:text-white transition cursor-pointer">Batal</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer disabled:bg-slate-800">
            {isSubmitting ? "Sinkronisasi Cloud..." : "Terbitkan Berkas Antrean"}
          </button>
        </div>
      </form>
    </div>
  );
}