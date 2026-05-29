"use client";

import { useState, useRef } from "react";
import { FiUpload, FiCamera, FiTrash2 } from "react-icons/fi";
// IMPORT UTILLITY CORE FIREBASE CLUSTER ASLI LU
import { db } from "../../../lib/client";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";

export default function GuestTicketForm({ onCancel, onRefresh }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef(null);
  const [brandSelection, setBrandSelection] = useState("");
  const [customBrandName, setCustomBrandName] = useState("");

  // Daftar Master Data Industri Otomotif Indonesia
  const popularBrands = [
    "Toyota", "Honda", "Daihatsu", "Suzuki", "Mitsubishi", 
    "Nissan", "Hyundai", "Wuling", "Mazda", "Other"
  ];

  // State Form Payload Hasil Sinkronisasi Komprehensif Lintas Platform
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    plateNumber: "",
    modelType: "",
    year: "",
    color: "",
    engineType: "Bensin",
    transmission: "Automatic",
    kmCheckIn: "",
    tasks: ""
  });

  // HTML5 CANVAS INTERCEPTOR: Mengompresi Citra Menjadi JPEG Ringan Menghindari Limitasi Firestore
  const compressImage = (srcBase64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = srcBase64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
    });
  };

  // HANDLER A: Otorisasi Izin Akses Perangkat Kamera Browser
  const toggleCamera = async (activate) => {
    if (activate) {
      try {
        setIsCameraActive(true);
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" }, 
          audio: false 
        });
        setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
      } catch (err) {
        alert("Sistem gagal mengakses perangkat kamera. Pastikan izin akses diberikan.");
        setIsCameraActive(false);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      setIsCameraActive(false);
    }
  };

  // HANDLER B: Mengambil Frame Snapshot Gambar dari Video Stream
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

  // HANDLER C: Membaca File Gambar dari Direktori Galeri Lokal
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

  // CORE SUBMIT PROCESSOR: Sinkronisasi Tiga Koleksi Data Secara Bersamaan
  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalBrand = brandSelection === "Other" ? customBrandName.trim() : brandSelection;
    if (!finalBrand) return alert("Mohon tentukan merek kendaraan terlebih dahulu.");

    setIsSubmitting(true);
    try {
      const phone = formData.customerPhone.trim();
      const uniqueCustomerUid = `guest_${phone}`;
      const timestampId = `SRV-${Date.now()}`;

      // LANGKAH 1: Amankan data profil ke koleksi 'customers' agar terarsip di CRM Table
      const customerDocRef = doc(db, "customers", phone);
      await setDoc(customerDocRef, {
        name: formData.customerName,
        phone: phone,
        type: "Guest",
        joinedDate: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        totalVehicles: 1 // Inisialisasi awal, akan dihitung secara live dinamis oleh Set aggregator
      }, { merge: true });

      // LANGKAH 2: Daftarkan aset fisik unit kendaraan ke koleksi 'vehicles'
      const vehicleRef = await addDoc(collection(db, "vehicles"), {
        customerId: phone, // Menjadi Foreign Key relasional pengikat data
        customerUid: uniqueCustomerUid,
        plateNumber: formData.plateNumber.toUpperCase(),
        brand: finalBrand,
        model: formData.modelType,
        year: formData.year,
        transmission: formData.transmission,
        color: formData.color,
        engineType: formData.engineType
      });

      // LANGKAH 3: Terbitkan berkas lembar kerja utama ke koleksi 'serviceTickets'
      await addDoc(collection(db, "serviceTickets"), {
        ticketId: timestampId,
        customerUid: uniqueCustomerUid,
        mechanicId: "",
        mechanicName: "",
        status: "waiting", // Otomatis masuk antrean utama beranda admin
        tasks: formData.tasks,
        kmCheckIn: Number(formData.kmCheckIn) || 0,
        kmService: 0,
        invoiceAmount: 0,
        complaintPhotoUrls: photoPreview ? [photoPreview] : [],
        externalProcurements: [],
        createdAt: new Date(),
        date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        carDetails: {
          carId: vehicleRef.id, // Mengunci ID Dokumen spesifik kendaraan hasil penulisan Langkah 2
          brand: finalBrand,
          type: formData.modelType,
          plate: formData.plateNumber.toUpperCase(),
          year: formData.year,
          color: formData.color,
          engineType: formData.engineType,
          transmission: formData.transmission
        }
      });

      alert("Proses sinkronisasi berhasil. Data tiket antrean dan rekam profil pelanggan telah disimpan.");
      onCancel();
      await onRefresh();
    } catch (err) {
      alert(`Gagal memproses transaksi data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      
      {/* Header Form */}
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white">Registrasi Kedatangan Tamu (Guest Walk-In)</h3>
        <p className="text-xs text-slate-400 mt-0.5">Pendaftaran manual untuk pelanggan non-aplikasi. Seluruh parameter terintegrasi otomatis ke sistem CRM.</p>
      </div>

      {/* Cluster Data Identitas Pelanggan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-400">Nama Lengkap Pelanggan</label>
          <input type="text" required value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} placeholder="Masukkan nama sesuai kartu identitas" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-400">Nomor Kontak WhatsApp (Primary Key CRM)</label>
          <input type="tel" required value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} placeholder="Contoh: 08123456789" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      {/* Cluster Spesifikasi Teknis Kendaraan (Replika Layout Aplikasi) */}
      <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2">Spesifikasi Unit Kendaraan Masuk</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Dropdown Pemilihan Merek */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Merek Kendaraan</label>
            <select required value={brandSelection} onChange={(e) => { setBrandSelection(e.target.value); if (e.target.value !== "Other") setCustomBrandName(""); }} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
              <option value="" disabled>-- Pilih Pabrikan Kendaraan --</option>
              {popularBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            
            {/* Input Manual Kondisional Khusus Opsi Other */}
            {brandSelection === "Other" && (
              <input type="text" required value={customBrandName} onChange={(e) => setCustomBrandName(e.target.value)} placeholder="Masukkan merek kustom (Contoh: Chery / Jaecoo)" className="w-full px-3 py-2.5 bg-slate-950 border border-purple-500/40 rounded-xl text-white outline-none focus:ring-1 focus:ring-purple-500 mt-2 animate-fade-in placeholder:text-slate-700" />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Tipe / Model Seri</label>
            <input type="text" required value={formData.modelType} onChange={(e) => setFormData({...formData, modelType: e.target.value})} placeholder="Contoh: Avanza Veloz / Omoda 5" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Jenis Bahan Bakar / Sumber Penggerak</label>
            <select value={formData.engineType} onChange={(e) => setFormData({...formData, engineType: e.target.value})} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer">
              <option value="Bensin">Bensin (Gasoline)</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid (HEV)</option>
              <option value="Listrik">Listrik Murni (Battery EV)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Sistem Transmisi Penggerak (Gearbox)</label>
            <select value={formData.transmission} onChange={(e) => setFormData({...formData, transmission: e.target.value})} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer">
              <option value="Automatic">Automatic Transmission (A/T)</option>
              <option value="Manual">Manual Transmission (M/T)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Nomor Registrasi Polisi (Pelat Nomor)</label>
            <input type="text" required value={formData.plateNumber} onChange={(e) => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})} placeholder="Contoh: AD 5748 ALC" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold tracking-wider outline-none" />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Tahun Perakitan Unit</label>
            <input type="number" required value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} placeholder="Contoh: 2024" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none" />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Warna Cat Fisik Kendaraan</label>
            <input type="text" required value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} placeholder="Contoh: Abu-abu Metalik" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-400">Odometer Masuk Aktual (KM)</label>
            <input type="number" required value={formData.kmCheckIn} onChange={(e) => setFormData({...formData, kmCheckIn: e.target.value})} placeholder="Contoh: 45200" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold outline-none" />
          </div>
        </div>
      </div>

      {/* Deskripsi Keluhan Kerja */}
      <div className="space-y-1.5 text-xs">
        <label className="font-semibold text-slate-400">Deskripsi Keluhan & Gejala Malfungsi Mekanis</label>
        <textarea required rows={3} value={formData.tasks} onChange={(e) => setFormData({...formData, tasks: e.target.value})} placeholder="Tulis rincian kerusakan atau diagnosa awal penanganan..." className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none resize-none leading-relaxed" />
      </div>

      {/* Modul Kamera & Unggah Gambar */}
      <div className="space-y-2 text-xs">
        <label className="font-semibold text-slate-400">Lampiran Dokumentasi Visual Kerusakan Komponen</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex gap-2">
              <label className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition text-center text-slate-400 hover:text-white">
                <FiUpload size={16} className="mb-1" />
                <span>Unggah File Dokumen</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <button type="button" onClick={() => toggleCamera(!isCameraActive)} className={`flex-1 border rounded-xl p-3 flex flex-col items-center justify-center transition text-center cursor-pointer ${isCameraActive ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <FiCamera size={16} className="mb-1" />
                <span>{isCameraActive ? "Nonaktifkan Lensa" : "Aktifkan Kamera"}</span>
              </button>
            </div>

            {isCameraActive && (
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-slate-700 shadow-inner">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <button type="button" onClick={captureSnapshot} className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-full text-[11px] shadow-lg cursor-pointer">Tangkap Citra Foto</button>
              </div>
            )}
          </div>

          {/* Preview Box Citra Terkompres */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-center min-h-[100px]">
            {photoPreview ? (
              <div className="relative w-full max-w-[180px] aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                <img src={photoPreview} alt="Pratinjau" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setPhotoPreview("")} className="absolute top-2 right-2 p-1 bg-slate-950/80 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"><FiTrash2 size={12} /></button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 italic text-center">Belum ada lampiran visual berkas fisik yang tersimpan.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tombol Aksi Kendali */}
      <div className="flex gap-3 pt-4 text-xs">
        <button type="button" onClick={onCancel} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl hover:text-white transition cursor-pointer">Kembali</button>
        <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer disabled:bg-slate-800 disabled:text-slate-500">
          {isSubmitting ? "Sinkronisasi Cloud..." : "Terbitkan Berkas Antrean"}
        </button>
      </div>

    </form>
  );
}