"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/client";
import { FiHome, FiUsers, FiTool, FiFileText, FiSettings, FiLogOut, FiAlertTriangle } from "react-icons/fi";

export default function DashboardLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // State konfirmasi logout
  const pathname = usePathname();
  const router = useRouter();

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

  const isActive = (path) => pathname === path;

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
          <Link href="/dashboard/invoices" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/dashboard/invoices") ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            <FiFileText size={18} /> Finansial
          </Link>
          <Link href="/dashboard/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/dashboard/settings") ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            <FiSettings size={18} /> Pengaturan
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setIsLogoutModalOpen(true)} // Buka modal konfirmasi
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl font-medium transition-all duration-200 cursor-pointer"
          >
            <FiLogOut size={18} /> Keluar Akun
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen bg-slate-950">
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-white tracking-wide">Command Center</h1>
          <div className="flex items-center gap-3.5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-200">Owner Bengkel</p>
              <p className="text-xs text-slate-500">Workspace Utama</p>
            </div>
            <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-xl flex items-center justify-center font-bold text-sm">OW</div>
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
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Apakah Anda yakin ingin mengakhiri sesi administrator dan keluar dari dasbor?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-red-600/10"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}