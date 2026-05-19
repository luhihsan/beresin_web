import Link from "next/link";
import { FiHome, FiUsers, FiTool, FiFileText, FiSettings, FiLogOut } from "react-icons/fi";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* SIDEBAR (Navigasi Kiri) */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col fixed h-screen z-20">
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-white/10">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Beresin<span className="text-blue-500">Web</span>
          </h2>
        </div>
        
        {/* Menu Navigasi */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl font-medium transition-colors">
            <FiHome size={20} /> Dashboard
          </Link>
          <Link href="/dashboard/mechanics" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <FiTool size={20} /> Data Mekanik
          </Link>
          <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <FiUsers size={20} /> Pelanggan
          </Link>
          <Link href="/dashboard/invoices" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <FiFileText size={20} /> Finansial
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <FiSettings size={20} /> Pengaturan
          </Link>
        </nav>

        {/* Tombol Logout */}
        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-500/10 hover:text-red-400 rounded-xl font-medium transition-colors">
            <FiLogOut size={20} /> Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (Kanan Sidebar) */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-800">Overview</h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-800">Owner Bengkel</p>
              <p className="text-xs text-slate-500">admin@bengkel.com</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-blue-200">
              O
            </div>
          </div>
        </header>

        {/* Dynamic Content (Halaman yang berganti-ganti) */}
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>

    </div>
  );
}