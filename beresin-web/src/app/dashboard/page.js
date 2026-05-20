import { FiActivity, FiClock, FiTrendingUp } from "react-icons/fi";

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Ringkasan Operasional</h2>
        <p className="text-sm text-slate-400 mt-1">Pantau performa lapangan dan statistik bengkel hari ini.</p>
      </div>

      {/* Grid Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Mobil Masuk */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Mobil Masuk Hari Ini</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              12 <span className="text-xs font-normal text-slate-500 tracking-normal">Unit</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
            <FiActivity size={22} />
          </div>
        </div>

        {/* Card 2: Antrean Menunggu */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Antrean Menunggu</p>
            <h3 className="text-3xl font-bold text-amber-500 tracking-tight">
              3 <span className="text-xs font-normal text-slate-500 tracking-normal">Kendaraan</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
            <FiClock size={22} />
          </div>
        </div>

        {/* Card 3: Estimasi Omzet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">Estimasi Pendapatan</p>
            <h3 className="text-3xl font-bold text-emerald-500 tracking-tight">
              Rp 4.5M <span className="text-xs font-normal text-slate-500 tracking-normal">Bulan Ini</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <FiTrendingUp size={22} />
          </div>
        </div>

      </div>

      {/* Live Antrean Section (Placeholder Visual) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 min-h-[350px] flex flex-col justify-between">
        <div className="border-b border-slate-800 pb-4">
          <h4 className="text-base font-semibold text-white">Live Status Monitor</h4>
          <p className="text-xs text-slate-500 mt-0.5">Sinkronisasi langsung dengan aktivitas mekanik di bengkel.</p>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700/50 flex items-center justify-center text-slate-500 mb-4 animate-pulse">
            ⚙️
          </div>
          <p className="text-sm font-medium text-slate-400">Belum ada antrean aktif hari ini</p>
          <p className="text-xs text-slate-600 max-w-xs mt-1">Data dari serviceTickets akan otomatis muncul secara real-time begitu mekanik memulai pekerjaan.</p>
        </div>
      </div>

    </div>
  );
}