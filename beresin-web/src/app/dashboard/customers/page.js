"use client";

import { useState, useEffect } from "react";
import { FiUsers, FiPlus, FiX, FiPhone, FiSmartphone, FiUserCheck, FiChevronRight, FiClock, FiFileText, FiUser, FiImage } from "react-icons/fi";
// IMPORT KONEKSI CORE FIRESTORE ASLI LU
import { db } from "../../lib/client";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);

  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  useEffect(() => {
    fetchCustomersFromFirestore();
  }, []);

  const formatFirestoreDate = (rawDate) => {
    if (!rawDate) return "-";
    if (typeof rawDate === "object" && "seconds" in rawDate) {
      return new Date(rawDate.seconds * 1000).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    }
    return String(rawDate);
  };

  // ===================================================================================
  // CORE UPGRADE: LIVE AGGREGATION ENGINE (Menghitung Jumlah Mobil Secara Riil & Akurat)
  // ===================================================================================
  const fetchCustomersFromFirestore = async () => {
    try {
      setIsLoadingCustomers(true);
      console.log("Firestore CRM: Melakukan tarikan besar paralel lintas 4 koleksi utama...");
      
      const customersRef = collection(db, "customers");
      const usersRef = collection(db, "users");
      const vehiclesRef = collection(db, "vehicles");
      const carsRef = collection(db, "cars");
      
      const qUsersCustomer = query(usersRef, where("role", "==", "customer"));

      // Tarik semua data secara paralel (Pelanggan + Semua Mobil untuk dihitung secara live)
      const [snapLegacy, snapAndroidApp, snapVehicles, snapCars] = await Promise.all([
        getDocs(customersRef),
        getDocs(qUsersCustomer),
        getDocs(vehiclesRef),
        getDocs(carsRef)
      ]);

      const mergedMap = new Map();

      // 1. Ekstrak data walk-in manual dari kasir web admin lama
      snapLegacy.docs.forEach(docSnapshot => {
        const raw = docSnapshot.data();
        const phoneKey = raw.phone ? String(raw.phone).trim() : docSnapshot.id;
        mergedMap.set(phoneKey, {
          docId: docSnapshot.id,
          legacyCustomerId: docSnapshot.id,
          customerUid: raw.customerUid || "",
          ...raw,
          type: "Guest",
          joinedDate: formatFirestoreDate(raw.joinedDate || raw.createdAt),
          totalVehicles: 0 // Reset nilai statis lama, kita timpa pake hitungan live nanti
        });
      });

      // 2. Gabungkan dengan data registrasi pengguna Android App (koleksi users)
      snapAndroidApp.docs.forEach(docSnapshot => {
        const raw = docSnapshot.data();
        const phoneKey = raw.phone ? String(raw.phone).trim() : docSnapshot.id;
        
        if (mergedMap.has(phoneKey)) {
          const existing = mergedMap.get(phoneKey);
          mergedMap.set(phoneKey, {
            ...existing,
            ...raw,
            docId: docSnapshot.id, 
            customerUid: docSnapshot.id, 
            legacyCustomerId: existing.legacyCustomerId, // Amankan ID lama agar mobil kasir gak hilang
            type: "Registered"
          });
        } else {
          mergedMap.set(phoneKey, {
            docId: docSnapshot.id,
            customerUid: docSnapshot.id,
            legacyCustomerId: "",
            ...raw,
            type: "Registered",
            joinedDate: formatFirestoreDate(raw.createdAt || new Date()),
            totalVehicles: 0
          });
        }
      });

      const customerList = Array.from(mergedMap.values());

      // 3. PEMETAAN DIKARYAKAN: Buat index pencarian cepat dari seluruh ID ke rumpun nomor telepon (phoneKey)
      const idToPhoneKeyMap = new Map();
      customerList.forEach(cust => {
        const phoneKey = cust.phone ? String(cust.phone).trim() : cust.docId;
        if (cust.docId) idToPhoneKeyMap.set(String(cust.docId).trim(), phoneKey);
        if (cust.customerUid) idToPhoneKeyMap.set(String(cust.customerUid).trim(), phoneKey);
        if (cust.legacyCustomerId) idToPhoneKeyMap.set(String(cust.legacyCustomerId).trim(), phoneKey);
      });

      // 4. STRATEGI ANTI-DUPLIKAT: Gunakan instansiasi 'Set' untuk menampung ID unik dokumen mobil per orang
      const realVehicleTracker = new Map(); // key: phoneKey, value: Set of unique vehicle docIds

      const trackVehicleToOwner = (vehicleDocId, ownerId) => {
        if (!ownerId) return false;
        const phoneKey = idToPhoneKeyMap.get(String(ownerId).trim());
        if (phoneKey) {
          if (!realVehicleTracker.has(phoneKey)) {
            realVehicleTracker.set(phoneKey, new Set());
          }
          realVehicleTracker.get(phoneKey).add(vehicleDocId);
          return true;
        }
        return false;
      };

      // Pindai semua dokumen di koleksi 'vehicles' (Web)
      snapVehicles.docs.forEach(d => {
        const data = d.data();
        const matched = trackVehicleToOwner(d.id, data.customerId);
        if (!matched) trackVehicleToOwner(d.id, data.customerUid);
      });

      // Pindai semua dokumen di koleksi 'cars' (Android App)
      snapCars.docs.forEach(d => {
        const data = d.data();
        const matched = trackVehicleToOwner(d.id, data.customerUid);
        if (!matched) trackVehicleToOwner(d.id, data.customerId);
      });

      // 5. INJEKSI AKHIR: Hitung ukuran asli Set (.size) untuk mendapatkan jumlah mobil riil lapangan
      const finalizedCalculatedCustomers = customerList.map(cust => {
        const phoneKey = cust.phone ? String(cust.phone).trim() : cust.docId;
        const vehicleSet = realVehicleTracker.get(phoneKey);
        return {
          ...cust,
          totalVehicles: vehicleSet ? vehicleSet.size : 0 // Angka mutlak riil tanpa tebak-tebakan
        };
      });

      setCustomers(finalizedCalculatedCustomers);
      console.log("Firestore CRM Engine: Live calculation for totalVehicles parameter resolved successfully.");
    } catch (err) {
      console.error("Critical CRM Error - Gagal menyatukan hitungan mobil:", err.message);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // AMBIL MOBIL DARI DUA KOLEKSI ('vehicles' & 'cars') MENGGUNAKAN SELURUH KELOMPOK ID
  const mt_fetchVehiclesForCustomer = async (customer) => {
    try {
      setIsLoadingVehicles(true);
      setVehicles([]);
      
      if (!customer) return;

      const searchIds = new Set();
      if (customer.docId) searchIds.add(customer.docId);
      if (customer.customerUid) searchIds.add(customer.customerUid);
      if (customer.legacyCustomerId) searchIds.add(customer.legacyCustomerId);
      if (customer.uid) searchIds.add(customer.uid);

      const idList = Array.from(searchIds).filter(Boolean);
      if (idList.length === 0) return;

      console.log("Firestore CRM: Menarik unit mobil relasional berdasarkan kombinasi ID:", idList);
      
      const vehiclesRef = collection(db, "vehicles");
      const carsRef = collection(db, "cars");

      const promises = [];
      idList.forEach(id => {
        promises.push(getDocs(query(vehiclesRef, where("customerId", "==", id))));
        promises.push(getDocs(query(vehiclesRef, where("customerUid", "==", id))));
        promises.push(getDocs(query(carsRef, where("customerId", "==", id))));
        promises.push(getDocs(query(carsRef, where("customerUid", "==", id))));
      });

      const snapshots = await Promise.all(promises);
      const vehicleDeduplicatedMap = new Map();

      snapshots.forEach(snapshot => {
        snapshot.docs.forEach(d => {
          const data = d.data();
          vehicleDeduplicatedMap.set(d.id, { 
            docId: d.id, 
            ...data,
            plateNumber: data.plateNumber || data.plate || "-",
            model: data.model || data.type || "-"
          });
        });
      });

      setVehicles(Array.from(vehicleDeduplicatedMap.values()));
    } catch (err) {
      console.error("Gagal menarik data mobil relasional lintas platform:", err.message);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // SINKRONISASI TIKET RIWAYAT SERVIS GABUNGAN
  const fetchHistoryForVehicle = async (vehicleDocId) => {
    try {
      setIsLoadingHistory(true);
      setServiceHistory([]);
      
      const ticketsRef = collection(db, "serviceTickets");
      const qWebAdmin = query(ticketsRef, where("vehicleId", "==", vehicleDocId));
      const qAndroidApp = query(ticketsRef, where("carDetails.carId", "==", vehicleDocId));
      
      const [snapshotWeb, snapshotAndroid] = await Promise.all([getDocs(qWebAdmin), getDocs(qAndroidApp)]);
      const deduplicatedMap = new Map();

      snapshotWeb.docs.forEach(d => deduplicatedMap.set(d.id, { docId: d.id, ...d.data() }));
      snapshotAndroid.docs.forEach(d => deduplicatedMap.set(d.id, { docId: d.id, ...d.data() }));

      const fetchedHistoryList = Array.from(deduplicatedMap.values()).map(item => ({
        ...item,
        date: formatFirestoreDate(item.date || item.createdAt)
      }));

      fetchedHistoryList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setServiceHistory(fetchedHistoryList);
    } catch (err) {
      console.error("Gagal menarik riwayat tiket gabungan:", err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCreateGuestCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (formData.phone.length < 10) throw new Error("Nomor WhatsApp tidak standar.");
      const customersCollectionRef = collection(db, "customers");
      const todayFormatted = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

      await addDoc(customersCollectionRef, { name: formData.name, phone: formData.phone, type: "Guest", joinedDate: todayFormatted, totalVehicles: 0 });
      await fetchCustomersFromFirestore();
      setIsModalOpen(false);
      setFormData({ name: "", phone: "" });
      alert("Profil walk-in sukses terdaftar!");
    } catch (err) {
      alert(`Pendaftaran gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Pusat Informasi Pelanggan (CRM)</h2>
          <p className="text-sm text-slate-400 mt-1">Manajemen basis data pemilik kendaraan, segmentasi akun aplikasi, serta pelacakan aset mobil.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer text-sm shadow-lg shadow-blue-600/10"><FiPlus size={18} /> Catat Pelanggan Walk-In</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${selectedCustomer ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Nama Pelanggan</th>
                  <th className="px-6 py-4">Nomor WhatsApp</th>
                  <th className="px-6 py-4">Tipe Akun</th>
                  <th className="px-6 py-4">Terdaftar Sejak</th>
                  <th className="px-6 py-4 text-center">Jumlah Mobil</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {isLoadingCustomers ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-xs animate-pulse">Menghubungkan ke Pusat Data CRM Cloud Firestore...</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-xs">Belum ada database pelanggan yang tersimpan di server.</td></tr>
                ) : (
                  customers.map((cust) => (
                    <tr 
                      key={cust.docId} 
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setSelectedVehicle(null);
                        setServiceHistory([]);
                        mt_fetchVehiclesForCustomer(cust);
                      }}
                      className={`hover:bg-slate-800/30 transition duration-150 cursor-pointer ${selectedCustomer?.docId === cust.docId ? "bg-blue-600/10" : ""}`}
                    >
                      <td className="px-6 py-4 font-medium text-white">{cust.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{cust.phone || "Registrasi Google Auth"}</td>
                      <td className="px-6 py-4">
                        {cust.type === "Registered" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><FiSmartphone size={10} /> App User</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><FiPhone size={10} /> Guest (Walk-in)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{cust.joinedDate}</td>
                      
                      {/* AMANKAN OUTPUT: Tampilkan angka kalkulasi riil hasil scan Set, buang fallback tebakan kemarin */}
                      <td className="px-6 py-4 text-center font-bold font-mono text-white">{cust.totalVehicles}</td>
                      
                      <td className="px-4 py-4 text-slate-500 text-right"><FiChevronRight size={16} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedCustomer && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-fade-in lg:col-span-1 relative">
            <button onClick={() => { setSelectedCustomer(null); setSelectedVehicle(null); setVehicles([]); setServiceHistory([]); }} className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"><FiX size={16} /></button>
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">Profil Kepemilikan</span>
              <h3 className="text-lg font-bold text-white mt-1">{selectedCustomer.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCustomer.phone || "Registrasi Aplikasi"}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Kendaraan Terdaftar ({vehicles.length})</h4>
              {isLoadingVehicles ? (
                <p className="text-xs text-slate-500 text-center py-4 animate-pulse">Menarik data aset mobil dari cloud...</p>
              ) : vehicles.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center"><p className="text-xs text-slate-600">Belum ada aset kendaraan yang ditautkan ke ID pelanggan ini.</p></div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {vehicles.map((vehicle) => (
                    <div 
                      key={vehicle.docId} 
                      onClick={() => { setSelectedVehicle(vehicle); fetchHistoryForVehicle(vehicle.docId); }}
                      className={`bg-slate-950 border p-4 rounded-xl space-y-3 shadow-inner transition cursor-pointer hover:border-blue-500/50 ${selectedVehicle?.docId === vehicle.docId ? "border-blue-500 ring-1 ring-blue-500/30" : "border-slate-800"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-slate-800 border border-slate-700 text-white font-mono font-bold px-2.5 py-1 rounded text-xs tracking-wider">
                          {vehicle.plateNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{vehicle.transmission || "Automatic"}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Tahun Produksi: {vehicle.year || "-"}</p>
                      </div>
                      <div className="text-right"><span className="text-[11px] text-blue-400 font-medium hover:underline">Riwayat servis →</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TIMELINE RIWAYAT SERVIS */}
      {selectedVehicle && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in text-left">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FiClock className="text-blue-500" /> Histori Perawatan Kendaraan: <span className="text-blue-400 font-mono">{selectedVehicle.plateNumber}</span></h3>
            </div>
            <button onClick={() => setSelectedVehicle(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"><FiX size={18} /></button>
          </div>

          {isLoadingHistory ? (
            <p className="text-xs text-slate-500 text-center py-6 animate-pulse">Mengunduh berkas rekam medik mesin mobil...</p>
          ) : serviceHistory.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">Belum ada riwayat pengerjaan service ticket untuk unit kendaraan ini.</div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-y-1 before:left-4 sm:before:left-6 before:w-0.5 before:bg-slate-800">
              {serviceHistory.map((history) => (
                <div key={history.docId} className="relative pl-10 sm:pl-14 animate-fade-in">
                  <div className="absolute left-2 sm:left-4 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500 z-10 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-slate-200">{history.ticketId}</span>
                        <span className="text-xs text-slate-500">|</span>
                        <span className="text-xs text-slate-400 font-medium">{history.date || "No Date"}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${history.status === 'pending' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{history.status || "Completed"}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 space-y-1">
                        <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Odometer</p>
                        <p className="text-slate-300 font-medium font-mono text-sm">{(history.kmCheckIn || 0).toLocaleString()} KM Masuk</p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 space-y-1 flex flex-col justify-center">
                        <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Mekanik Bertugas</p>
                        <p className="text-white font-semibold text-sm mt-0.5">{history.mechanicName || "Belum Ditunjuk"}</p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 space-y-1 flex flex-col justify-center md:col-span-2">
                        <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Total Tagihan</p>
                        <p className="text-emerald-400 font-bold font-mono text-base mt-0.5">{history.invoiceAmount || 0}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50 space-y-1">
                      <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Tindakan Keluhan</p>
                      <p className="text-slate-200 text-sm leading-relaxed mt-1">{history.tasks}</p>
                    </div>

                    {history.complaintPhotoUrls && history.complaintPhotoUrls.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">Foto Lampiran Keluhan ({history.complaintPhotoUrls.length})</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {history.complaintPhotoUrls.map((url, imgIdx) => (
                            <a key={imgIdx} href={url} target="_blank" rel="noreferrer" className="group relative block aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition">
                              <img src={url} alt="Keluhan" className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}