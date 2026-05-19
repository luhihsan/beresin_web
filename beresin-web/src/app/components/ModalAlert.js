export default function ModalAlert({ isOpen, onClose, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
        <div className="w-12 h-12 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-xl font-bold">!</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Akses Ditolak</h3>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition duration-200"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}