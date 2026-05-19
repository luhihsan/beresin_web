"use client"; 

import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Nanti kita panggil auth Firebase di sini
    setTimeout(() => {
      console.log("Login sukses sementara:", email);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-indigo-600/20 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 sm:p-10">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-3 mb-6 shadow-inner">
              {/* Di Next.js, manggil gambar di folder public langsung pakai /logo.png */}
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-md" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
            <p className="text-slate-300 text-sm text-center">Sign in to manage your garage operations.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 backdrop-blur-sm text-base"
                placeholder="admin@bengkel.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1" htmlFor="password">Password</label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 pr-14 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 backdrop-blur-sm text-base"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none mt-8 text-lg"
            >
              {isLoading ? "Signing In..." : "Sign In to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}