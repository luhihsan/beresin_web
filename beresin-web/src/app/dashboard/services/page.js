"use client";

import { useState } from "react";
import { FiPlus, FiX, FiEdit2, FiTrash2, FiLayers, FiDollarSign, FiClock, FiSearch, FiFilter } from "react-icons/fi";

export default function ServicesCatalog() {
  // Mock Master Database Jasa Murni Bengkel (Simulasi data murni dari collections/masterCatalog)
  const [services, setServices] = useState([
    { id: "SRV-001", name: "Jasa Ganti Oli Mesin murni", category: "Perawatan Berkala", price: 50000, estimatedTime: "15 Menit" },
    { id: "SRV-002", name: "Tune-Up Ringan & Pembersihan Throttle Body", category: "Perawatan Berkala", price: 150000, estimatedTime: "45 Menit" },
    { id: "SRV-003", name: "Service Sistem Pengereman Set (4 Roda)", category: "Keamanan & Rem", price: 250000, estimatedTime: "60 Menit" },
    { id: "SRV-004", name: "Top Overhaul (Bongkar Setengah Mesin / Turun Setengah)", category: "Perbaikan Besar", price: 1200000, estimatedTime: "1-2 Hari" },
    { id: "SRV-005", name: "Service AC Berkala & Pembersihan Evaporator", category: "Sistem AC", price: 350000, estimatedTime: "90 Menit" },
  ]);

  // State Kontrol UI & Form Input
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState(null); 
  const [formData, setFormData] = useState({ name: "", category: "Perawatan Berkala", price: "", estimatedTime: "" });

  // ==========================================
  // STATE BARU: FILTER & SEARCH UTILITY SYSTEM
  // ==========================================
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  /**
   * @description Menangani proses pembuatan jasa baru atau pembaruan tarif lama (UPSERT logic).
   * Menerapkan validasi tipe data finansial sebelum melakukan commit ke database.
   * @param {Event} e - Objek event form submission
   */
  const handleSaveService = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (Number(formData.price) < 0) {
        throw new Error("Tarif operasional jasa tidak diizinkan bernilai minus.");
      }

      console.log("Master Catalog Factory: Memproses sinkronisasi dokumen tarif...");
      
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingService) {
        // Logika Update data lama
        setServices(services.map(srv => 
          srv.id === editingService.id 
            ? { ...srv, name: formData.name, category: formData.category, price: Number(formData.price), estimatedTime: formData.estimatedTime }
            : srv
        ));
        console.log(`Tarif Jasa dengan ID [${editingService.id}] berhasil diperbarui.`);
      } else {
        // Logika Create data baru
        const newService = {
          id: `SRV-${String(services.length + 1).padStart(3, '0')}`,
          name: formData.name,
          category: formData.category,
          price: Number(formData.price),
          estimatedTime: formData.estimatedTime
        };
        setServices([...services, newService]);
        console.log("Entri item tarif jasa baru berhasil disuntikkan ke Cloud Firestore.");
      }

      setIsModalOpen(false);
      setEditingService(null);
      setFormData({ name: "", category: "Perawatan Berkala", price: "", estimatedTime: "" });
    } catch (err) {
      console.error("Catalog System Error - Gagal menyimpan data jasa:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * @description Mempersiapkan form modal dengan isi data lama untuk proses editing.
   * @param {Object} service - Objek data jasa yang dipilih
   */
  const startEditService = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      price: service.price,
      estimatedTime: service.estimatedTime
    });
    setIsModalOpen(true);
  };

  /**
   * @description Menghapus entri tarif jasa dari master katalog.
   * @param {string} id - Unique Service ID (Primary Key)
   */
  const handleDeleteService = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus tarif jasa ini dari katalog standar?")) {
      setServices(services.filter(srv => srv.id !== id));
      console.log(`Dokumen tarif [${id}] berhasil dihapus dari master katalog.`);
    }
  };

  // Utility helper untuk formatting mata uang rupiah secara konsisten
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  // ===================================================================================
  // LOGIKA KOMPUTASI FILTER & SEARCH DATA (Computed State)
  // ===================================================================================
  const filteredServices = services.filter(srv => {
    const matchesSearch = srv.name.toLowerCase().includes(searchQuery.toLowerCase()) || srv.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" ? true : srv.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Katalog Standar Jasa Servis</h2>
          <p className="text-sm text-slate-400 mt-1">Kelola standardisasi batas tarif ongkos kerja mekanik untuk menjaga transparansi dan integritas invoice konsumen.</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setFormData({ name: "", category: "Perawatan Berkala", price: "", estimatedTime: "" });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-lg shadow-blue-600/10 text-sm material-ripple"
        >
          <FiPlus size={18} /> Tambah Standar Jasa
        </button>
      </div>

      {/* Main Grid Card Metrics Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Menu Layanan Jasa</p>
            <h3 className="text-2xl font-bold text-white font-mono">{services.length} <span className="text-xs font-normal text-slate-500 font-sans">Item Pekerjaan</span></h3>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
            <FiLayers size={20} />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Ongkos Kerja Jasa</p>
            <h3 className="text-2xl font-bold text-emerald-400 font-mono">
              {formatRupiah(services.reduce((acc, curr) => acc + curr.price, 0) / services.length)}
            </h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <FiDollarSign size={20} />
          </div>
        </div>
      </div>

      {/* SEARCH BAR & FILTER TABS CONTROLS PANEL */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800/80 shadow-md">
        
        {/* Search Field */}
        <div className="relative w-full lg:max-w-xs flex items-center">
          <FiSearch className="absolute left-4 text-slate-600" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID atau nama jasa..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-xs"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pr-1 py-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden xl:inline flex items-center gap-1 shrink-0">
            <FiFilter size={10} /> Kategori:
          </span>
          {[
            { key: "all", label: "Semua Jasa" },
            { key: "Perawatan Berkala", label: "Berkala" },
            { key: "Keamanan & Rem", label: "Rem" },
            { key: "Sistem AC", label: "AC" },
            { key: "Perbaikan Besar", label: "Overhaul" },
            { key: "Elektrikal", label: "Elektrikal" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition shrink-0 cursor-pointer ${categoryFilter === tab.key ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/60"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Main Ledger Table Layout */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">ID Jasa</th>
                <th className="px-6 py-4">Nama Deskripsi Jasa Mekanik</th>
                <th className="px-6 py-4">Kategori Sektor</th>
                <th className="px-6 py-4">Estimasi Durasi Kerja</th>
                <th className="px-6 py-4">Tarif Ongkos Kerja</th>
                <th className="px-6 py-4 text-center">Tindakan Otoritas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-xs">
                    Tidak ditemukan item jasa servis standar yang cocok dengan parameter pencarian.
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-800/30 transition duration-150">
                    <td className="px-6 py-4 font-mono font-bold text-blue-400 text-xs">{service.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{service.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-slate-950 border border-slate-800/50 text-slate-400">
                        {service.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-400 inline-flex items-center gap-1.5 mt-4">
                      <FiClock size={12} className="text-slate-600" /> {service.estimatedTime}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">{formatRupiah(service.price)}</td>
                    <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => startEditService(service)}
                        className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-blue-400 border border-slate-800 transition cursor-pointer"
                        title="Edit Item Tarif Jasa"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
                        title="Hapus Item Jasa"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OVERLAY: FORM INPUT/EDIT MASTER TARIF JASA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setEditingService(null);
              }} 
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <FiX size={20} />
            </button>

            <div className="mb-6 border-b border-slate-800 pb-4">
              <span className="text-[10px] font-bold tracking-widest uppercase text-blue-500">Master Data Standardisasi</span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {editingService ? "Modifikasi Tarif Jasa" : "Registrasi Standar Jasa Baru"}
              </h3>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Nama Deskripsi Jasa Perbaikan</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Service Rem Set (4 Roda)"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-0.5">Sektor Kategori Kerja</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm cursor-pointer"
                >
                  <option value="Perawatan Berkala">Perawatan Berkala</option>
                  <option value="Keamanan & Rem">Keamanan & Rem</option>
                  <option value="Sistem AC">Sistem AC</option>
                  <option value="Perbaikan Besar">Perbaikan Besar</option>
                  <option value="Elektrikal">Elektrikal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 ml-0.5">Estimasi Durasi Kerja</label>
                  <input
                    type="text"
                    required
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    placeholder="Contoh: 45 Menit"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 ml-0.5">Tarif Ongkos Kerja (IDR)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Contoh: 150000"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-200 mt-6 shadow-lg shadow-blue-600/10 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-sm flex items-center justify-center"
              >
                {isSubmitting ? "Committing Document to Firestore..." : "Simpan Standar Jasa"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}