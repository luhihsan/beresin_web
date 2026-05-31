"use client";

import { useState, useEffect } from "react";
import { FiActivity, FiClock, FiTrendingUp, FiUser, FiCheck, FiUserPlus, FiX } from "react-icons/fi";
import { db } from "../lib/client";
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, getDocs } from "firebase/firestore";
import QueueActionModal from "./QueueActionModal";
import TicketDetailModal from "./TicketDetailModal";

export default function DashboardOverview() {
  const [metrics, setMetrics] = useState({ todayCars: 0, waitingQueue: 0, monthlyRevenue: 0 });
  const [liveTickets, setLiveTickets] = useState([]);
  const [mechanics, setMechanics] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [approveTicket, setApproveTicket] = useState(null);
  const [rejectTicket, setRejectTicket] = useState(null);
  const [assignTicket, setAssignTicket] = useState(null);
  const [selectedDetailTicket, setSelectedDetailTicket] = useState(null);

  useEffect(() => {
    console.log("Firestore Real-time: Membuka jalur onSnapshot stream listener...");

    const ticketsCollectionRef = collection(db, "serviceTickets");
    const invoicesCollectionRef = collection(db, "invoices");

    const ticketsQuery = query(ticketsCollectionRef, orderBy("createdAt", "desc"));
    const invoicesQuery = query(invoicesCollectionRef, where("isPaid", "==", true));

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

        const waitingCount = allTickets.filter(ticket => ticket.status === "waiting" || ticket.status === "pending" || ticket.status === "waiting_offer").length;
        
        // Memasukkan alur status transisi 'waiting_offer' ke monitor sistem kasir utama agar real-time terpantau
        const activeQueueList = allTickets.filter(ticket => 
          ticket.status === "pending" || ticket.status === "waiting" || ticket.status === "waiting_offer" || ticket.status === "processing" || ticket.status === "rejected"
        );

        setLiveTickets(activeQueueList);
        setMetrics(prev => ({ ...prev, todayCars: todayCarsCount, waitingQueue: waitingCount }));
        
        fetchActiveMechanicsAndWorkload(allTickets);
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

  const fetchActiveMechanicsAndWorkload = async (currentTickets) => {
    try {
      const usersRef = collection(db, "users");
      const qMech = query(usersRef, where("role", "==", "mechanic"));
      const snap = await getDocs(qMech);
      
      const list = snap.docs.map(d => {
        const mechUid = d.id;
        // METRIK WORKLOAD: Menghitung jumlah mobil riil yang sedang dikerjakan (processing) oleh mekanik terkait
        const activeCarCount = currentTickets.filter(t => t.mechanicId === mechUid && t.status === "processing").length;
        return { uid: mechUid, ...d.data(), activeWorkload: activeCarCount };
      }).filter(m => m.isActive !== false);

      setMechanics(list);
    } catch (err) {
      console.error("Gagal memuat kompetensi beban kerja mekanik:", err.message);
    }
  };

  // CALLBACK A: SUBMIT ACC TIKET + KALKULASI TARGET SELESAI ABSOLUT TIMESTAMP
  const handleConfirmApproval = async (targetTicket, estimationValue, estimationUnit) => {
    try {
      const targetDocRef = doc(db, "serviceTickets", targetTicket.docId);
      
      // Menghitung target penanggalan selesai riil di server
      const targetDate = new Date();
      if (estimationUnit === "Jam") {
        targetDate.setHours(targetDate.getHours() + estimationValue);
      } else {
        targetDate.setDate(targetDate.getDate() + estimationValue);
      }
      
      // Mengamankan data array foto keluhan bawaan tiket agar tetap utuh saat di-update
      const complaintPhotoUrls = targetTicket.complaintPhotoUrls || [];
      
      await updateDoc(targetDocRef, { 
        status: "waiting",
        estimationValue: estimationValue,
        estimationUnit: estimationUnit,
        targetCompletionTime: targetDate, // Otomatis disimpan sebagai Firebase Timestamp objek absolut
        complaintPhotoUrls: complaintPhotoUrls // Memastikan data array foto keluhan tetap melekat erat pada dokumen
      });

      alert(`Tiket ${targetTicket.ticketId} berhasil disetujui.`);
      setApproveTicket(null);
    } catch (err) { alert(`Gagal memproses persetujuan: ${err.message}`); }
  };

  // CALLBACK B: SUBMIT REJECT JALUR GANDA (TOLAK TOTAL ATAU WAITING OFFER ALTERNATIF)
  const handleConfirmRejection = async (targetTicket, rejectionType, alternativeDateTime) => {
    try {
      const targetDocRef = doc(db, "serviceTickets", targetTicket.docId);
      
      if (rejectionType === "offer" && alternativeDateTime) {
        const offerDateObject = new Date(alternativeDateTime);
        
        // Statuswaiting_offer memicu pop-up pilihan interaksi di handphone konsumen
        await updateDoc(targetDocRef, {
          status: "waiting_offer",
          offeredAlternativeTime: offerDateObject
        });
        alert(`Penawaran jadwal alternatif berhasil dikirim ke perangkat konsumen.`);
      } else {
        // Alur penolakan permanen pembatalan antrean
        await updateDoc(targetDocRef, { status: "rejected" });
        alert(`Tiket ${targetTicket.ticketId} berhasil dibatalkan secara permanen.`);
      }
      setRejectTicket(null);
    } catch (err) { alert(`Gagal memproses pembatalan: ${err.message}`); }
  };

  // CALLBACK C: SUBMIT DELEGASI TUGAS MEKANIK
  const handleConfirmAssignment = async (targetTicket, mechanicUid) => {
    const targetMechanicObj = mechanics.find(m => m.uid === mechanicUid);
    if (!targetMechanicObj) return;

    try {
      const targetDocRef = doc(db, "serviceTickets", targetTicket.docId);
      const complaintPhotoUrls = targetTicket.complaintPhotoUrls || [];
      const tasks = targetTicket.tasks || "Cek kerusakan kendaraan";

      await updateDoc(targetDocRef, {
        mechanicId: mechanicUid,
        mechanicName: targetMechanicObj.name,
        status: "processing",
        complaintPhotoUrls: complaintPhotoUrls, // Meneruskan array foto keluhan pelanggan ke mekanik secara eksplisit
        tasks: tasks // Meneruskan keterangan penugasan komplit
      });
      alert(`Teknisi ${targetMechanicObj.name} resmi didelegasikan.`);
      setAssignTicket(null);
    } catch (err) { alert(`Gagal mendelegasikan teknisi: ${err.message}`); }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const handleResetAllDialogs = () => {
    setApproveTicket(null);
    setRejectTicket(null);
    setAssignTicket(null);
    setSelectedDetailTicket(null); // Memastikan state detail juga bersih saat di-reset
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

      {/* Live Status Monitor Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h4 className="text-base font-semibold text-white">Live Status Monitor</h4>
          <p className="text-xs text-slate-500 mt-0.5">Sistem kendali verifikasi persetujuan antrean loket dan pendelegasian teknisi otomotif.</p>
        </div>
        
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">Sinkronisasi data operasional sedang berlangsung...</div>
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
                  <th className="px-5 py-3">Unit Kendaraan / Tindakan</th>
                  <th className="px-5 py-3">Estimasi / Opsi Alternatif</th>
                  <th className="px-5 py-3">Teknisi Penanggung Jawab</th>
                  <th className="px-5 py-3 text-center">Status Operasional</th>
                  <th className="px-5 py-3 text-center">Aksi Manajemen Antrean</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-400 font-medium">
                {liveTickets.map((ticket) => (
                  <tr key={ticket.docId} className="hover:bg-slate-800/30 transition duration-150">
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium">
                      <button 
                        onClick={() => setSelectedDetailTicket(ticket)}
                        className="text-blue-400 hover:text-blue-300 hover:underline text-left font-mono font-bold"
                        title="Klik untuk lihat detail komplit"
                      >
                        {ticket.ticketId}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-slate-900 border border-slate-800 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px] tracking-wide">
                        {ticket.carDetails?.plate || ticket.plateNumber || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-200">
                      {ticket.carDetails ? `${ticket.carDetails.brand} ${ticket.carDetails.type}` : "Walk-In Manual"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {ticket.status === "rejected" ? (
                        <span className="text-rose-500/70 font-semibold">Ditolak Permanen</span>
                      ) : ticket.status === "waiting_offer" ? (
                        <span className="text-purple-400">Tawaran: {ticket.offeredAlternativeTime?.seconds ? new Date(ticket.offeredAlternativeTime.seconds * 1000).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                      ) : (
                        <span>Durasi: {ticket.estimationValue ? `${ticket.estimationValue} ${ticket.estimationUnit}` : <span className="text-slate-600 italic">Belum Diatur</span>}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <FiUser className="text-slate-600" /> {ticket.mechanicName || <span className="text-slate-600 italic">Belum Ditunjuk</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {ticket.status === "pending" ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">Menunggu Verifikasi</span>
                      ) : ticket.status === "processing" ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">Sedang Dikerjakan</span>
                      ) : ticket.status === "rejected" ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Antrean Ditolak</span>
                      ) : ticket.status === "waiting_offer" ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">Menawarkan Jadwal</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Dalam Antrean</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center flex items-center justify-center gap-2">
                      {ticket.status === "pending" && (
                        <>
                          <button onClick={() => setApproveTicket(ticket)} className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer transition flex items-center gap-0.5">ACC</button>
                          <button onClick={() => setRejectTicket(ticket)} className="px-2.5 py-1 rounded bg-slate-950 border border-rose-500/30 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-[10px] cursor-pointer transition">Tolak</button>
                        </>
                      )}
                      {ticket.status === "waiting" && (
                        <button onClick={() => setAssignTicket(ticket)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-bold text-[10px] border border-slate-700 transition cursor-pointer flex items-center gap-1">Tugaskan Teknisi</button>
                      )}
                      {ticket.status === "waiting_offer" && <span className="text-[11px] text-purple-400/70 italic font-medium">Menunggu Klien</span>}
                      {ticket.status === "processing" && <span className="text-[11px] text-slate-600 italic">Mekanik Bekerja</span>}
                      {ticket.status === "rejected" && <span className="text-[11px] text-rose-500/60 font-medium">Dibatalkan</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QueueActionModal
        approveTicket={approveTicket}
        rejectTicket={rejectTicket}
        assignTicket={assignTicket}
        mechanics={mechanics}
        onClose={handleResetAllDialogs}
        onConfirmApprove={handleConfirmApproval}
        onConfirmReject={handleConfirmRejection}
        onConfirmAssign={handleConfirmAssignment}
      />

      {/* --- REKTIFIKASI INTEGRASI MODAL DETAIL (DI SINI TEMPATNYA) --- */}
      {selectedDetailTicket && (
        <TicketDetailModal 
          ticket={selectedDetailTicket} 
          onClose={() => setSelectedDetailTicket(null)} 
        />
      )}

    </div>
  );
}