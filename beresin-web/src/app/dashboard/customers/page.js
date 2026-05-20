"use client";

import { useState, useEffect } from "react";
import { FiUsers, FiPlus, FiX, FiPhone, FiSmartphone, FiUserCheck, FiChevronRight, FiClock, FiFileText, FiUser } from "react-icons/fi";
import { db } from "../../lib/client";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

export default function CustomersManagement() {
  // State Utama Basis Data Live dari Firestore
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);

  // State Indikator Loading Bertingkat
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Pelacak Interaksi Aktif (Selection Pointer)
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // State Kontrol UI Form Modal Guest
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  // EFFECT & FETCHING LOGIC TINGKAT 1: MEMBACA LIVE DATA PELANGGAN
  useEffect(() => {
    fetchCustomersFromFirestore();
  }, []);

  /**
   * @description Utility internal untuk mengonversi objek Timestamp Firebase ({seconds, nanoseconds}) 
   * menjadi string tanggal terformat Indonesia yang aman dirender oleh React child node.
   */
  const formatFirestoreDate = (rawDate) => {
    if (!rawDate) return "-";
    
    // Jika data dari firestore berupa Object Timestamp asli ({seconds, nanoseconds})
    if (typeof rawDate === "object" && "seconds" in rawDate) {
      return new Date(rawDate.seconds * 1000).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }
    
    // Jika sudah berupa string biasa, langsung kembalikan nilainya
    return String(rawDate);
  };

  const fetchCustomersFromFirestore = async () => {
    try {
      setIsLoadingCustomers(true);
      console.log("Firestore CRM: Menarik entri dokumen dari koleksi 'customers'...");
      
      const customersRef = collection(db, "customers");
      const querySnapshot = await getDocs(customersRef);
      
      const liveCustomersList = querySnapshot.docs.map(docSnapshot => {
        const rawData = docSnapshot.data();
        return {
          docId: docSnapshot.id,
          ...rawData,
          // TAMENG PENGAMAN: Konversi field joinedDate jika tipenya objek timestamp
          joinedDate: formatFirestoreDate(rawData.joinedDate)
        };
      });

      setCustomers(liveCustomersList);
      console.log("Firestore CRM: Sinkronisasi database pelanggan sukses.");
    } catch (err) {
      console.error("Critical CRM Error - Gagal memuat data pelanggan:", err.message);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // FETCHING LOGIC TINGKAT 2: QUERY RELASIONAL 1-TO-N (MOBIL PELANGGAN)
  const fetchVehiclesForCustomer = async (customerDocId) => {
    try {
      setIsLoadingVehicles(true);
      setVehicles([]);
      console.log(`Firestore CRM: Melakukan query ke koleksi 'vehicles' di mana customerId == ${customerDocId}...`);
      
      const vehiclesRef = collection(db, "vehicles");
      const q = query(vehiclesRef, where("customerId", "==", customerDocId));
      const querySnapshot = await getDocs(q);
      
      const fetchedVehiclesList = querySnapshot.docs.map(docSnapshot => ({
        docId: docSnapshot.id,
        ...docSnapshot.data()
      }));

      setVehicles(fetchedVehiclesList);
      console.log(`Firestore CRM: Berhasil memuat ${fetchedVehiclesList.length} unit kendaraan relasional.`);
    } catch (err) {
      console.error("Relational Query Failure - Gagal menarik data mobil:", err.message);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // FETCHING LOGIC TINGKAT 3: QUERY LIFECYCLE HISTORI SERVIS (TICKET & INVOICES)
  const fetchHistoryForVehicle = async (vehicleDocId) => {
    try {
      setIsLoadingHistory(true);
      setServiceHistory([]);
      console.log(`Firestore CRM: Menarik log serviceTickets di mana vehicleId == ${vehicleDocId}...`);
      
      const ticketsRef = collection(db, "serviceTickets");
      const q = query(ticketsRef, where("vehicleId", "==", vehicleDocId));
      const querySnapshot = await getDocs(q);
      
      const fetchedHistoryList = querySnapshot.docs.map(docSnapshot => {
        const rawData = docSnapshot.data();
        return {
          docId: docSnapshot.id,
          ...rawData,
          // TAMENG PENGAMAN 2: Konversi field date di tiket servis jika tipenya objek timestamp
          date: formatFirestoreDate(rawData.date)
        };
      });

      setServiceHistory(fetchedHistoryList);
      console.log(`Firestore CRM: Lifecycle history loaded with ${fetchedHistoryList.length} service records.`);
    } catch (err) {
      console.error("Relational Query Failure - Gagal menarik riwayat tiket:", err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCreateGuestCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formData.phone.length < 10) {
        throw new Error("Nomor identifikasi WhatsApp tidak memenuhi standar panjang karakter.");
      }

      console.log("Firestore CRM: Mengirim payload Guest baru ke klaster cloud...");
      const customersCollectionRef = collection(db, "customers");

      const todayFormatted = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      await addDoc(customersCollectionRef, {
        name: formData.name,
        phone: formData.phone,
        type: "Guest",
        joinedDate: todayFormatted,
        totalVehicles: 0
      });

      await fetchCustomersFromFirestore();

      setIsModalOpen(false);
      setFormData({ name: "", phone: "" });
      alert("Profil pelanggan walk-in berhasil didaftarkan ke cloud database!");
    } catch (err) {
      console.error("CRM Engine Error - Gagal membuat data guest:", err.message);
      alert(`Pendaftaran gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (value) => {
    if (value === 0) return "Free (Paket Garansi)";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Pusat Informasi Pelanggan (CRM)</h2>
          <p className="text-sm text-slate-400 mt-1">Manajemen basis data pemilik kendaraan, segmentasi akun aplikasi, serta pelacakan aset mobil.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-lg shadow-blue-600/10 text-sm"
        >
          <FiPlus size={18} /> Catat Pelanggan Walk-In
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Kolom Kiri: Tabel Database Pelanggan */}
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
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-xs animate-pulse">
                      Menghubungkan ke Pusat Data CRM Cloud Firestore...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-xs">
                      Belum ada database pelanggan yang tersimpan di cloud server.
                    </td>
                  </tr>
                ) : (
                  customers.map((cust) => (
                    <tr 
                      key={cust.docId} 
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setSelectedVehicle(null);
                        setServiceHistory([]);
                        fetchVehiclesForCustomer(cust.docId);
                      }}
                      className={`hover:bg-slate-800/30 transition duration-150 cursor-pointer ${selectedCustomer?.docId === cust.docId ? "bg-blue-600/10" : ""}`}
                    >
                      <td className="px-6 py-4 font-medium text-white">{cust.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{cust.phone}</td>
                      <td className="px-6 py-4">
                        {cust.type === "Registered" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <FiSmartphone size={10} /> App User
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <FiPhone size={10} /> Guest (Walk-in)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{cust.joinedDate}</td>
                      <td className="px-6 py-4 text-center font-bold font-mono text-white">{cust.totalVehicles || 0}</td>
                      <td className="px-4 py-4 text-slate-500 text-right"><FiChevronRight size={16} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Aset Kendaraan */}
        {selectedCustomer && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-fade-in lg:col-span-1 relative">
            <button 
              onClick={() => {
                setSelectedCustomer(null);
                setSelectedVehicle(null);
                setVehicles([]);
                setServiceHistory([]);
              }}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">Profil Kepemilikan</span>
              <h3 className="text-lg font-bold text-white mt-1">{selectedCustomer.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCustomer.phone}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Kendaraan Terdaftar ({vehicles.length})</h4>
              
              {isLoadingVehicles ? (
                <p className="text-xs text-slate-500 text-center py-4 animate-pulse">Menarik data aset mobil dari cloud...</p>
              ) : vehicles.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
                  <p className="text-xs text-slate-600">Belum ada aset kendaraan yang ditautkan ke ID pelanggan ini.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {vehicles.map((vehicle) => (
                    <div 
                      key={vehicle.docId} 
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        fetchHistoryForVehicle(vehicle.docId);
                      }}
                      className={`bg-slate-950 border p-4 rounded-xl space-y-3 shadow-inner transition cursor-pointer hover:border-blue-500/50 ${selectedVehicle?.docId === vehicle.docId ? "border-blue-500 ring-1 ring-blue-500/30" : "border-slate-800"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-slate-800 border border-slate-700 text-white font-mono font-bold px-2.5 py-1 rounded text-xs tracking-wider">
                          {vehicle.plateNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                          {vehicle.transmission}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Tahun Produksi: {vehicle.year}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-blue-400 font-medium hover:underline">Klik untuk riwayat servis →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* SECTION TIMELINE HISTORI SERVIS */}
      {selectedVehicle && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in text-left">
          
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiClock className="text-blue-500" /> Histori Perawatan Kendaraan: <span className="text-blue-400 font-mono">{selectedVehicle.plateNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Rekam jejak pengerjaan montir otomotif lapangan bersumber langsung dari live serviceTickets cloud database.</p>
            </div>
            <button 
              onClick={() => setSelectedVehicle(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          {isLoadingHistory ? (
            <p className="text-xs text-slate-500 text-center py-6 animate-pulse">Mengunduh berkas rekam medik mesin mobil...</p>
          ) : serviceHistory.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">
              Belum ada riwayat pengerjaan / service ticket terarsip untuk unit kendaraan ini.
            </div>
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
                      <div>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {history.status || "Completed"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 space-y-1">
                        <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Pelacakan Odometer</p>
                        <p className="text-slate-300 font-medium font-mono text-sm">
                          {(history.kmCheckIn || 0).toLocaleString()} KM <span className="text-slate-600 font-normal text-xs">Masuk</span>
                        </p>
                        <p className="text-slate-400 font-medium font-mono text-xs">
                          {(history.kmService || 0).toLocaleString()} KM <span className="text-slate-600 font-normal text-[11px]">Selesai</span>
                        </p>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 space-y-1 flex flex-col justify-center">
                        <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <FiUser size={10} /> Mekanik Bertugas
                        </p>
                        <p className="text-white font-semibold text-sm mt-0.5">{history.mechanicName || "Teknisi Lapangan"}</p>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/40 space-y-1 flex flex-col justify-center md:col-span-2">
                        <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <FiFileText size={10} /> Total Nominal Invoice Tagihan
                        </p>
                        <p className="text-emerald-400 font-bold font-mono text-base mt-0.5">
                          {formatRupiah(history.invoiceAmount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50 space-y-1">
                      <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Tindakan & Deskripsi Perbaikan Komponen</p>
                      <p className="text-slate-200 text-sm leading-relaxed mt-1">{history.tasks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* MODAL PENDAFTARAN MANUAL PELANGGAN GUEST */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
              <FiX size={20} />
            </button>
            <div className="mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center"><FiUserCheck size={20} /></div>
              <div>
                <h3 className="text-base font-bold text-white">Catat Pelanggan Walk-In</h3>
                <p className="text-xs text-slate-400 mt-0.5">Memasukkan entri database manual untuk pelanggan non-aplikasi.</p>
              </div>
            </div>
            <form onSubmit={handleCreateGuestCustomer} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Nama Lengkap Pelanggan</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: Bambang Pamungkas" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Nomor WhatsApp Aktif (Primary Key ID)</label>
                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Contoh: 0856xxxxxxxx" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm font-mono" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-200 mt-6 shadow-lg shadow-blue-600/10 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-sm flex items-center justify-center">
                {isSubmitting ? "Committing Document to NoSQL..." : "Simpan Profil Pelanggan"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}