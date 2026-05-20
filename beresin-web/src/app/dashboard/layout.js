"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/client";
import { FiHome, FiUsers, FiTool, FiFileText, FiSettings, FiLogOut, FiAlertTriangle, FiBell, FiDollarSign, FiLayers, FiPaperclip, FiSmartphone } from "react-icons/fi";

export default function DashboardLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // LIVE NOTIFICATION CENTER WITH DEEP LINKING ROUTE REGISTRY
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // SINKRONISASI STRUKTUR: Pastikan properti type dan redirectUrl ada di setiap objek
  const [notifications, setNotifications] = useState([
    { 
      id: "nt_01", 
      type: "cash_settlement",
      invoiceId: "INV-20260520-002", 
      text: "Bambang Pamungkas melakukan pembayaran Cash. Butuh otorisasi finansial.", 
      time: "2 mnt lalu", 
      unread: true,
      redirectUrl: "/dashboard/invoices?open=INV-20260520-002" // Link rute target
    },
    { 
      id: "nt_02", 
      type: "parts_approval",
      invoiceId: "INV-20260520-001", 
      text: "Mekanik Budi Santoso mengajukan reimbursement nota Ring Piston Avanza (AD 2345 GL).", 
      time: "15 mnt lalu", 
      unread: true,
      redirectUrl: "/dashboard/invoices?open=INV-20260520-001"
    },
    { 
      id: "nt_03", 
      type: "android_booking",
      invoiceId: null, 
      text: "Booking Antrean Baru dari Android: Ahmad Yani (Honda Civic - AD 9999 IH).", 
      time: "1 jam lalu", 
      unread: false,
      redirectUrl: "/dashboard" // Diarahkan langsung ke halaman monitor beranda utama
    }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Gagal melakukan sesi logout:", err);
    }
  };

  /**
   * @description Menangani aksi klik pada item notifikasi.
   * Menyertakan tameng pengaman defensive code guard mencegah crash startsWith Next.js.
   */
  const handleNotificationActionClick = (notif) => {
    // 1. Mutasi status unread khusus untuk item ID target
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, unread: false } : n));
    
    // 2. Tutup panel layang dropdown topbar
    setIsNotifOpen(false);
    
    // ===================================================================================
    // TAMENG PENGAMAN (DEFENSIVE GUARD): Cek apakah link tujuan ada atau tidak
    // ===================================================================================
    if (!notif || !notif.redirectUrl) {
      console.warn("Deep Link Aborted: Objek notifikasi tidak memiliki parameter redirectUrl.");
      return; // Stop eksekusi agar tidak menembak router.push(undefined) yang pemicu error
    }
    
    // 3. Eksekusi Router Deep-linking pindah halaman bawaan Next.js
    console.log(`System Router Navigating Deep-Link Destination: ${notif.redirectUrl}`);
    router.push(notif.redirectUrl);
  };

  const markAllAsReadLayout = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    setIsNotifOpen(!isNotifOpen);
  };

  const isActive = (path) => pathname === path;
  const unreadCount = notifications.filter(n => n.unread).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <p className="text-slate-500 text-sm animate-pulse">Memverifikasi hak akses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      
      {/* SIDEBAR (Navigasi Kiri) */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-screen z-20">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            B
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Beresin<span className="text-blue-500">Web</span>
          </h2>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/dashboard") ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            <FiHome size={18} /> Dashboard
          </Link>
          <Link href="/dashboard/mechanics" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/dashboard/mechanics") ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            <FiTool size={18} /> Data Mekanik
          </Link>
          <Link href="/dashboard/customers" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/dashboard/customers") ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            <FiUsers size={18} /> Pelanggan
          </Link>
          <Link href="/dashboard/services" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/dashboard/services") ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            <FiLayers size={18} /> Katalog Jasa
          </Link>
          <Link href="/dashboard/invoices" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/dashboard/invoices") ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            <FiFileText size={18} /> Finansial
          </Link>
          <Link href="/dashboard/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/dashboard/settings") ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            <FiSettings size={18} /> Pengaturan
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setIsLogoutModalOpen(true)} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl font-medium transition-all duration-200 cursor-pointer">
            <FiLogOut size={18} /> Keluar Akun
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen bg-slate-950">
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-white tracking-wide">Command Center</h1>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <button onClick={markAllAsReadLayout} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition relative cursor-pointer border border-slate-700/50">
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* DROPDOWN FLYOUT NOTIFIKASI */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-85 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-fade-in text-left max-h-[450px] overflow-y-auto">
                  <div className="border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pusat Aktivitas Operasional</h4>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-2">Tidak ada pemberitahuan baru.</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationActionClick(n)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex gap-3 items-start relative ${n.unread ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800" : "bg-slate-950 border-slate-800/80 hover:bg-slate-900/50"}`}
                        >
                          {n.unread && <span className="absolute top-3.5 right-3 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}

                          {n.type === "cash_settlement" && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <FiDollarSign size={14} />
                            </div>
                          )}
                          {n.type === "parts_approval" && (
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                              <FiPaperclip size={14} />
                            </div>
                          )}
                          {n.type === "android_booking" && (
                            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                              <FiSmartphone size={14} />
                            </div>
                          )}

                          <div className="space-y-0.5 pr-3">
                            <p className={`text-xs leading-relaxed ${n.unread ? "text-white font-medium" : "text-slate-400"}`}>
                              {n.invoiceId && <span className="font-mono font-bold text-blue-400 mr-1">{n.invoiceId}</span>}
                              {n.text}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-200">Owner Bengkel</p>
                <p className="text-xs text-slate-500">Workspace Utama</p>
              </div>
              <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-xl flex items-center justify-center font-bold text-sm">OW</div>
            </div>
          </div>
        </header>

        <main className="p-8 flex-1">{children}</main>
      </div>

      {/* MODAL KONFIRMASI LOGOUT */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Konfirmasi Keluar</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">Apakah Anda yakin ingin mengakhiri sesi administrator dan keluar dari dasbor?</p>
            <div className="flex gap-3">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer">Batal</button>
              <button onClick={handleLogout} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-red-600/10">Keluar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}