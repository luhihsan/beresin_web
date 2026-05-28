"use client";

import { useState, useEffect } from "react";
import { FiActivity, FiClock, FiTrendingUp, FiUser, FiCheck, FiUserPlus, FiX } from "react-icons/fi";
// IMPORT KONEKSI CORE FIRESTORE ASLI LU
import { db } from "../lib/client";
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, getDocs } from "firebase/firestore";

export default function DashboardOverview() {
  // State Utama untuk Agregasi Metrik Finansial & Operasional Lapangan
  const [metrics, setMetrics] = useState({ todayCars: 0, waitingQueue: 0, monthlyRevenue: 0 });
  const [liveTickets, setLiveTickets] = useState([]);
  const [mechanics, setMechanics] = useState([]); // Menampung daftar montir aktif
  const [isLoading, setIsLoading] = useState(true);

  // STATE UI: Mengontrol modal pop-up penugasan mekanik
  const [selectedTicketForMechanic, setSelectedTicketForMechanic] = useState(null);

  useEffect(() => {
    console.log("Firestore Real-time: Membuka jalur onSnapshot stream listener...");

    const ticketsCollectionRef = collection(db, "serviceTickets");
    const invoicesCollectionRef = collection(db, "invoices");

    const ticketsQuery = query(ticketsCollectionRef, orderBy("createdAt", "desc"));
    const invoicesQuery = query(invoicesCollectionRef, where("isPaid", "==", true));

    // TAMENG PENGAMAN MEKANIK: Ambil semua role mekanik, lalu filter isActive secara fleksibel di memory
    const fetchActiveMechanics = async () => {
      try {
        const usersRef = collection(db, "users");
        const qMech = query(usersRef, where("role", "==", "mechanic"));
        const snap = await getDocs(qMech);
        const list = snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(m => m.isActive !== false);
        setMechanics(list);
      } catch (err) {
        console.error("Gagal memuat master data mekanik:", err.message);
      }
    };
    fetchActiveMechanics();

    // SINKRONISASI TIKET OPERASIONAL BENGKEL LINTAS PLATFORM
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      try {
        const allTickets = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));

        const todayString = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

        const todayCarsCount = allTickets.filter(ticket => {
          const ticketDate = ticket.date || (ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "");
          return ticketDate === todayString;
        }).length;

        const waitingCount = allTickets.filter(ticket => ticket.status === "waiting" || ticket.status === "pending").length;
        const activeQueueList = allTickets.filter(ticket => ticket.status === "pending" || ticket.status === "waiting" || ticket.status === "processing");

        setLiveTickets(activeQueueList);
        setMetrics(prev => ({ ...prev, todayCars: todayCarsCount, waitingQueue: waitingCount }));
      } catch (err) {
        console.error("Stream parsing error (Tickets):", err.message);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Firestore Stream Rejected (Tickets):", error.message);
    });

    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      try {
        const paidInvoices = snapshot.docs.map(doc => doc.data());
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const revenueSum = paidInvoices.reduce((acc, inv) => {
          const invDate = inv.createdAt?.seconds ? new Date(inv.createdAt.seconds * 1000) : new Date();
          if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
            return acc + (inv.amount || 0);
          }
          return acc + (inv.amount || 0);
        }, 0);

        setMetrics(prev => ({ ...prev, monthlyRevenue: revenueSum }));
      } catch (err) {
        console.error("Stream parsing error (Invoices):", err.message);
      }
    });

    return () => {
      unsubscribeTickets();
      unsubscribeInvoices();
    };
  }, []);

  // FITUR AKSIONER A: ACC TIKET ANTRIAN MASUK DARI PENDING KE WAITING
  const handleVerifyAndApproveQueue = async (ticketDocId) => {
    try {
      console.log(`Firestore Mutation: Mengubah status tiket [${ticketDocId}] menjadi waiting...`);
      const targetDocRef = doc(db, "serviceTickets", ticketDocId);
      await updateDoc(targetDocRef, { status: "waiting" });
      alert("Tiket booking berhasil di-ACC masuk antrean utama bengkel!");
    } catch (err) {
      alert(`Gagal ACC tiket: ${err.message}`);
    }
  };

  // FITUR AKSIONER B: SUBMIT DELEGASI MEKANIK LAPANGAN
  const handleAssignMechanicToCar = async (mechanicUid) => {
    if (!selectedTicketForMechanic) return;
    
    const targetMechanicObj = mechanics.find(m => m.uid === mechanicUid);
    if (!targetMechanicObj) return;

    try {
      console.log(`Firestore Mutation: Mendelegasikan mekanik [${targetMechanicObj.name}] ke tiket...`);
      const targetDocRef = doc(db, "serviceTickets", selectedTicketForMechanic.docId);
      
      // Update status otomatis beralih ke 'processing' (Mekanik Mulai Kerja)
      await updateDoc(targetDocRef, {
        mechanicId: mechanicUid,
        mechanicName: targetMechanicObj.name,
        status: "processing"
      });

      setSelectedTicketForMechanic(null);
      alert(`Mekanik ${targetMechanicObj.name} resmi ditugaskan ke unit kendaraan!`);
    } catch (err) {
      alert(`Gagal menugaskan mekanik: ${err.message}`);
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Ringkasan Operasional</h2>
        <p className="text-sm text-slate-400 mt-1">Pantau performa lapangan dan statistik bengkel hari ini secara real-time.</p>
      </div>

      {/* Grid Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Mobil Masuk Hari Ini</p>
            <h3 className="text-3xl font-bold text-white tracking-tight font-mono">
              {isLoading ? "..." : metrics.todayCars} <span className="text-xs font-normal text-slate-500 tracking-normal font-sans">Unit</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shadow-lg"><FiActivity size={22} /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Antrean & Booking Baru</p>
            <h3 className="text-3xl font-bold text-amber-500 tracking-tight font-mono">
              {isLoading ? "..." : metrics.waitingQueue} <span className="text-xs font-normal text-slate-500 tracking-normal font-sans">Kendaraan</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shadow-lg"><FiClock size={22} /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl sm:col-span-2 lg:col-span-1">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Estimasi Pendapatan</p>
            <h3 className="text-2xl font-bold text-emerald-500 tracking-tight font-mono">{isLoading ? "Rp ..." : formatRupiah(metrics.monthlyRevenue)}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shadow-lg"><FiTrendingUp size={22} /></div>
        </div>
      </div>

      {/* Live Status Monitor */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h4 className="text-base font-semibold text-white">Live Status Monitor</h4>
          <p className="text-xs text-slate-500 mt-0.5">Sinkronisasi langsung dengan pergerakan montir otomotif di kolong mobil.</p>
        </div>
        
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">Membuka gerbang sinkronisasi live data stream...</div>
        ) : liveTickets.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-slate-400">Belum ada antrean aktif saat ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3">ID Tiket</th>
                  <th className="px-5 py-3">No. Pelat Kendaraan</th>
                  <th className="px-5 py-3">Unit Mobil / Tindakan</th>
                  <th className="px-5 py-3">Mekanik Bertugas</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Aksi Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-400 font-medium">
                {liveTickets.map((ticket) => (
                  <tr key={ticket.docId} className="hover:bg-slate-800/30 transition duration-150">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-200">{ticket.ticketId}</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-slate-900 border border-slate-800 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px] tracking-wide">
                        {ticket.carDetails?.plate || ticket.plateNumber || "AD 1234 XX"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-200">
                      {ticket.carDetails ? `${ticket.carDetails.brand} ${ticket.carDetails.type}` : "Walk-In Manual"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <FiUser className="text-slate-600" /> {ticket.mechanicName || <span className="text-slate-600 italic">Belum Ada</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {ticket.status === "pending" ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">Booking Baru</span>
                      ) : ticket.status === "processing" ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">Servis Berjalan</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Dalam Antrean</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center flex items-center justify-center gap-2">
                      {ticket.status === "pending" && (
                        <button
                          onClick={() => handleVerifyAndApproveQueue(ticket.docId)}
                          className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wide text-[10px] transition cursor-pointer flex items-center gap-0.5"
                        >
                          <FiCheck /> ACC
                        </button>
                      )}
                      {ticket.status !== "processing" && (
                        <button
                          onClick={() => setSelectedTicketForMechanic(ticket)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-bold text-[10px] border border-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <FiUserPlus /> Assign Montir
                        </button>
                      )}
                      {ticket.status === "processing" && <span className="text-[11px] text-slate-600 italic">Mekanik Lapangan Kerja</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL JENDELA PILIHAN MEKANIK ACTIVE */}
      {selectedTicketForMechanic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
            <button onClick={() => setSelectedTicketForMechanic(null)} className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"><FiX size={18} /></button>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Delegasi Tugas Mekanik</h3>
            <p className="text-xs text-slate-500 mb-4">Pilih teknisi untuk menangani unit kendaraan <span className="text-white font-mono font-bold">{selectedTicketForMechanic.carDetails?.plate || selectedTicketForMechanic.plateNumber}</span></p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {mechanics.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">Tidak ada akun mekanik aktif yang terdeteksi di server cloud.</p>
              ) : (
                mechanics.map((mech) => (
                  <div
                    key={mech.uid}
                    onClick={() => handleAssignMechanicToCar(mech.uid)}
                    className="p-3 bg-slate-950 hover:bg-blue-600/10 border border-slate-800 hover:border-blue-500/40 rounded-xl flex items-center justify-between cursor-pointer transition text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{mech.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{mech.email}</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Pilih →</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}