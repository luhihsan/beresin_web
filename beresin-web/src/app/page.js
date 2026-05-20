"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./lib/client"; // Kita cuma butuh auth sekarang, db dihapus
import { useAuthLimit } from "./hooks/useAuthLimit";
import ModalAlert from "./components/ModalAlert";
import { FiEye, FiEyeOff } from "react-icons/fi"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, message: "" });

  const router = useRouter();
  const { isLocked, cooldownText, trackFailedAttempt, resetAttempts, remainingAttempts } = useAuthLimit();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setIsLoading(true);

    try {
      // Murni cek ke Firebase Auth saja, nggak peduli role-nya apa
      await signInWithEmailAndPassword(auth, email, password);
      
      // Kalau berhasil login (nggak error), langsung lempar ke dashboard
      resetAttempts();
      router.push("/dashboard");
      
    } catch (err) {
      trackFailedAttempt();
      let errorMsg = "Email atau kata sandi salah. Silakan periksa kembali.";
      
      // Deteksi jika eror karena diblokir sistem lokal
      if (remainingAttempts <= 1) {
        errorMsg = "Terlalu banyak percobaan gagal. Akses formulir diblokir selama 5 menit.";
      }
      
      setModal({ isOpen: true, message: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background Glow Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-indigo-600/20 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 sm:p-10">
          
          {/* Header Area */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-3 mb-6 shadow-inner">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-md" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
            <p className="text-slate-300 text-sm text-center">Sign in to manage your garage operations.</p>
          </div>

          {/* Form Area */}
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            
            {/* Input Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                disabled={isLocked}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 backdrop-blur-sm text-base disabled:opacity-40"
                placeholder="admin@bengkel.com"
                required
              />
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="password">Password</label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 pr-14 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 backdrop-blur-sm text-base disabled:opacity-40"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed mt-8 text-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                "Verifying Account..."
              ) : isLocked ? (
                `Locked (${cooldownText})`
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Render Alert Dialog */}
      <ModalAlert 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
        message={modal.message} 
      />
    </div>
  );
}