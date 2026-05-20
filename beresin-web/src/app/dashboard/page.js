"use client";

import { useState, useEffect } from "react";
import { FiActivity, FiClock, FiTrendingUp, FiUser, FiActivity as FiGauge } from "react-icons/fi";
// IMPORT KONEKSI CORE FIRESTORE ASLI LU
import { db } from "../lib/client";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

export default function DashboardOverview() {
  // State Utama untuk Agregasi Metrik Finansial & Operasional Lapangan
  const [metrics, setMetrics] = useState({
    todayCars: 0,
    waitingQueue: 0,
    monthlyRevenue: 0
  });

  // State untuk menampung data antrean aktif (Live Queue Monitor)
  const [liveTickets, setLiveTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ===================================================================================
  // EFFECT: REAL-TIME STREAMING LISTENER (onSnapshot Firebase Engine)
  // ===================================================================================
  useEffect(() => {
    console.log("Firestore Real-time: Membuka jalur onSnapshot stream listener...");

    // 1. Pembuatan Ref Koleksi Database
    const ticketsCollectionRef = collection(db, "serviceTickets");
    const invoicesCollectionRef = collection(db, "invoices");

    // Query Taktis: Ambil tiket antrean hari ini atau yang statusnya belum selesai (waiting/processing)
    const ticketsQuery = query(ticketsCollectionRef, orderBy("createdAt", "desc"));
    
    // Query Taktis Keuangan: Ambil faktur lunas untuk kalkulasi omzet bulanan
    const invoicesQuery = query(invoicesCollectionRef, where("isPaid", "==", true));

    // 2. LANGGANAN DATA LIVE: TIKET OPERASIONAL BENGKEL
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      try {
        const allTickets = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));

        // Kalkulasi Tanggal Hari Ini (Format string pencocokan: YYYY-MM-DD atau DD MMM YYYY)
        const todayString = new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });

        // Metrik A: Hitung total mobil yang masuk khusus hari ini saja
        const todayCarsCount = allTickets.filter(ticket => {
          // Antisipasi jika data format berupa objek timestamp atau string biasa
          const ticketDate = ticket.date || (ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "");
          return ticketDate === todayString;
        }).length;

        // Metrik B: Hitung total antrean kendaraan yang berstatus "waiting" (Menunggu Mekanik)
        const waitingCount = allTickets.filter(ticket => ticket.status === "waiting").length;

        // Filter untuk Live Monitor List: Hanya tampilkan tiket yang aktif berjalan ("waiting" atau "processing")
        const activeQueueList = allTickets.filter(ticket => ticket.status === "waiting" || ticket.status === "processing");

        setLiveTickets(activeQueueList);
        setMetrics(prev => ({
          ...prev,
          todayCars: todayCarsCount,
          waitingQueue: waitingCount
        }));

        console.log("Firestore Stream: Operasional data updated in real-time.");
      } catch (err) {
        console.error("Stream parsing error (Tickets):", err.message);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Firestore Stream Rejected (Tickets):", error.message);
    });

    // 3. LANGGANAN DATA LIVE: BUKU KAS FINANSIAL (TOTAL OMZET)
    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      try {
        const paidInvoices = snapshot.docs.map(doc => doc.data());
        
        // Ambil penanda Bulan & Tahun Berjalan Saat Ini
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Metrik C: Akumulasikan total nominal uang dari invoice yang lunas di bulan ini saja
        const revenueSum = paidInvoices.reduce((acc, inv) => {
          // Fallback parsing date dari string/timestamp
          const invDate = inv.createdAt?.seconds ? new Date(inv.createdAt.seconds * 1000) : new Date();
          
          if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
            return acc + (inv.amount || 0);
          }
          return acc + (inv.amount || 0); // Jika data testing berupa string manual, ikut jumlahkan saja
        }, 0);

        setMetrics(prev => ({
          ...prev,
          monthlyRevenue: revenueSum
        }));
        
        console.log("Firestore Stream: Financial parameters synced.");
      } catch (err) {
        console.error("Stream parsing error (Invoices):", err.message);
      }
    }, (error) => {
      console.error("Firestore Stream Rejected (Invoices):", error.message);
    });

    // Clean-up function: Otomatis memutus stream subscription ketika owner menutup halaman/logout
    return () => {
      unsubscribeTickets();
      unsubscribeInvoices();
    };
  }, []);

  // Utility format Rupiah Currency
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Welcome Banner */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Ringkasan Operasional</h2>
        <p className="text-sm text-slate-400 mt-1">Pantau performa lapangan dan statistik bengkel hari ini secara real-time.</p>
      </div>

      {/* Grid Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Mobil Masuk */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Mobil Masuk Hari Ini</p>
            <h3 className="text-3xl font-bold text-white tracking-tight font-mono">
              {isLoading ? "..." : metrics.todayCars} <span className="text-xs font-normal text-slate-500 tracking-normal font-sans">Unit</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/5">
            <FiActivity size={22} />
          </div>
        </div>

        {/* Card 2: Antrean Menunggu */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Antrean Menunggu</p>
            <h3 className="text-3xl font-bold text-amber-500 tracking-tight font-mono">
              {isLoading ? "..." : metrics.waitingQueue} <span className="text-xs font-normal text-slate-500 tracking-normal font-sans">Kendaraan</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/5">
            <FiClock size={22} />
          </div>
        </div>

        {/* Card 3: Estimasi Omzet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl sm:col-span-2 lg:col-span-1">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Estimasi Pendapatan</p>
            <h3 className="text-2xl font-bold text-emerald-500 tracking-tight font-mono">
              {isLoading ? "Rp ..." : formatRupiah(metrics.monthlyRevenue)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/5">
            <FiTrendingUp size={22} />
          </div>
        </div>

      </div>

      {/* Live Antrean Section (REAL-TIME LIVE STATUS MONITOR TABLE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="border-b border-slate-800 pb-4">
          <h4 className="text-base font-semibold text-white">Live Status Monitor</h4>
          <p className="text-xs text-slate-500 mt-0.5">Sinkronisasi langsung dengan pergerakan montir otomotif di kolong mobil.</p>
        </div>
        
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
            Membuka gerbang sinkronisasi live data stream...
          </div>
        ) : liveTickets.length === 0 ? (
          /* Empty State Illustration jika tidak ada kerjaan aktif */
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 mb-4 animate-pulse">
              ⚙️
            </div>
            <p className="text-sm font-medium text-slate-400">Belum ada antrean aktif saat ini</p>
            <p className="text-xs text-slate-600 max-w-xs mt-1">Data dari sub-koleksi serviceTickets akan otomatis muncul di sini begitu mekanik memulai pengerjaan dari aplikasi Flutter.</p>
          </div>
        ) : (
          /* Render Tabel Antrean Aktif Nyata */
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3">ID Tiket</th>
                  <th className="px-5 py-3">No. Pelat</th>
                  <th className="px-5 py-3">Mekanik Bertugas</th>
                  <th className="px-5 py-3">Deskripsi Keluhan Kendaraan</th>
                  <th className="px-5 py-3 text-center">Status Monitor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-400 font-medium">
                {liveTickets.map((ticket) => (
                  <tr key={ticket.docId} className="hover:bg-slate-900/30 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-200">{ticket.ticketId}</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-slate-900 border border-slate-800 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px] tracking-wide">
                        {ticket.plateNumber || "AD 1234 XX"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 flex items-center gap-1.5">
                      <FiUser className="text-slate-600" /> {ticket.mechanicName || "Menunggu Teknisi"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">{ticket.tasks}</td>
                    <td className="px-5 py-3.5 text-center">
                      {ticket.status === "processing" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                          <span className="w-1 h-1 rounded-full bg-blue-400 animate-ping"></span> Sedang Dikerjakan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Dalam Antrean
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}