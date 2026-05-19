export default function DashboardOverview() {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Widget Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Mobil Masuk Hari Ini</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">12 <span className="text-sm font-normal text-slate-400">Unit</span></h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Antrean Menunggu</p>
          <h3 className="text-3xl font-bold text-orange-500 mt-2">3 <span className="text-sm font-normal text-slate-400">Mobil</span></h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Estimasi Pendapatan</p>
          <h3 className="text-3xl font-bold text-green-600 mt-2">Rp 2.5M <span className="text-sm font-normal text-slate-400">Hari ini</span></h3>
        </div>
      </div>

      {/* Area Tabel (Placeholder dulu) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-8 min-h-[400px] flex items-center justify-center">
        <p className="text-slate-400">Tabel Live Antrean Servis akan muncul di sini</p>
      </div>

    </div>
  );
}