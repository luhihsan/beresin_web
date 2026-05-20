/**
 * @file exportHelper.js
 * @description Engine utilitas mandiri untuk mengonversi data finansial ke format dokumen CSV.
 * Menerapkan prinsip SOLID (Single Responsibility Principle) untuk mengisolasi I/O file dari UI Component.
 * @author Galuh Ihsan Nurkholis
 */

/**
 * @description Mengonversi snapshot data transaksi finansial menjadi berkas spreadsheet (.csv).
 * Menyusun baris record secara terstruktur serta menyuntikkan baris kalkulasi total omzet di akhir dokumen.
 * @param {Array<Object>} invoiceData - Array berisi manifest data invoice hasil pemfilteran komponen
 * @returns {void}
 */
export const exportInvoicesToCSV = (invoiceData) => {
  try {
    if (!invoiceData || invoiceData.length === 0) {
      console.warn("Export Aborted: Dataset invoice dalam kondisi kosong atau undefined.");
      return;
    }

    console.log("Financial Data Factory: Memulai standarisasi struktur kolom audit...");

    // 1. Inisialisasi Judul Kolom (Header) Dokumen Berkas Audit
    const headers = [
      "ID Invoice",
      "Nama Pelanggan",
      "No. Pelat Kendaraan",
      "Tanggal Transaksi",
      "Nominal Tagihan (IDR)",
      "Metode Pembayaran",
      "Status Verifikasi"
    ];

    // 2. Pemetaan Dataset Menjadi Baris-Baris Record CSV
    const dataRows = invoiceData.map(inv => [
      inv.id,
      `"${inv.customerName.replace(/"/g, '""')}"`, // Proteksi karakter tanda kutip ganda di penamingan
      inv.plateNumber,
      inv.date,
      inv.amount,
      inv.method,
      inv.isPaid ? "LUNAS" : "PENDING (BELUM BAYAR)"
    ]);

    // 3. Hitung Akumulasi Untuk Baris Ringkasan Rekonsiliasi di Bawah Dokumen
    const totalRevenue = invoiceData.reduce((acc, curr) => acc + curr.amount, 0);
    
    const summaryRowEmpty = ["", "", "", "", "", "", ""];
    const summaryRowData = [
      "TOTAL AKUMULASI KAS",
      "",
      "",
      "",
      totalRevenue, // Menampilkan angka total omzet tepat di bawah kolom Nominal Tagihan
      "",
      `"${invoiceData.length} Dokumen Terproses"`
    ];

    // ============================================================================================
    // ENTERPRISE TRICK: Menyuntikkan 'sep=,' di baris pertama agar Excel otomatis memecah kolom
    // tanpa mempedulikan status Regional Settings Windows (Indonesian / US) di komputer owner.
    // ============================================================================================
    const csvFinalContent = [
      "sep=,", // Instruksi eksplisit untuk Microsoft Excel / WPS Office
      headers.join(","),
      ...dataRows.map(row => row.join(",")),
      summaryRowEmpty.join(","), 
      summaryRowData.join(",")   
    ].join("\n");

    // ============================================================================================
    // ENTERPRISE TRICK 2: Menyuntikkan Byte Order Mark (BOM) UTF-8 ("\uFEFF") di awal string blob
    // agar karakter mata uang dan simbol internasional terbaca sempurna tanpa berantakan.
    // ============================================================================================
    const blob = new Blob(["\uFEFF" + csvFinalContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    
    const hiddenAnchorElement = document.createElement("a");
    hiddenAnchorElement.setAttribute("href", downloadUrl);
    hiddenAnchorElement.setAttribute("download", `BeresinBengkel_Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.csv`);
    
    document.body.appendChild(hiddenAnchorElement);
    hiddenAnchorElement.click(); // Trigger eksekusi download otomatis
    document.body.removeChild(hiddenAnchorElement); // Garbage collection pembersihan DOM
    
    console.log("Export Engine Process Successfully Committed with Excel Auto-Format.");
  } catch (error) {
    console.error("Critical Failure - Pembuatan berkas CSV gagal dieksekusi:", error.message);
  }
};