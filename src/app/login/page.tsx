"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mfaCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.cardcovefzc.com"}/api/v1/auth/client/login`,
        {
          // const response = await fetch(
          //   `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/auth/client/login`,
          //   {
          // const response = await fetch(
          //   `${process.env.NEXT_PUBLIC_API_URL || "https://178-104-162-74.sslip.io"}/api/v1/auth/client/login`,
          //   {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            mfaCode: requiresMFA ? formData.mfaCode : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.requiresMFA) {
        setRequiresMFA(true);
        setLoading(false);
        return;
      }

      const userToStore = {
        ...data.data.user,
        mustChangePassword: data.data.mustChangePassword
      };

      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(userToStore));
      setUser(userToStore);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Simple Brand Header */}
        <div className="text-center mb-10">
          <img
            src="/assets/card-cove-logo.png"
            alt="Card Cove"
            className="h-14 w-auto mx-auto mb-6 brightness-200 contrast-100"
          />
          <h2 className="text-3xl font-light text-white tracking-wide">
            Sign In
          </h2>
          <div className="h-0.5 w-12 bg-cyan-500 mx-auto mt-4 rounded-full opacity-50"></div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
              <svg className="h-4 w-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-medium text-red-400">{error}</p>
            </div>
          )}

          {!requiresMFA ? (
            <>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-medium text-gray-400 ml-1">
                  Email Address
                </label>
                <input
                  id="email" name="email" type="email" autoComplete="email" required
                  value={formData.email} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white text-sm outline-none transition-all placeholder:text-gray-600"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-medium text-gray-400 ml-1">
                  Password
                </label>
                <input
                  id="password" name="password" type="password" autoComplete="current-password" required
                  value={formData.password} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white text-sm outline-none transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                />
                <div className="pt-1 px-1">
                  <a href="/forgot-password" title="Coming soon" className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors">
                    Forgot Password?
                  </a>
                </div>
              </div>

              <div className="flex items-center px-1 pt-1">
                <input
                  id="remember-me" name="remember-me" type="checkbox"
                  className="h-4 w-4 bg-white/5 border-white/10 text-cyan-600 rounded cursor-pointer accent-cyan-600"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-400 cursor-pointer">
                  Keep me logged in
                </label>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-xs font-medium text-cyan-400 uppercase tracking-widest">
                  Verification Required
                </p>
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                  A security code was sent to your email.
                </p>
              </div>

              <div className="space-y-3 text-center">
                <input
                  id="mfaCode" name="mfaCode" type="text" maxLength={6} required
                  value={formData.mfaCode} onChange={handleChange}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-xl text-white text-center text-3xl font-light tracking-[0.5em] focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  placeholder="000000" autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => { setRequiresMFA(false); setFormData({ ...formData, mfaCode: "" }); }}
                className="w-full text-xs font-medium text-gray-500 hover:text-white transition-colors"
              >
                ← Back to login
              </button>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-cyan-900/20 active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              <span>{requiresMFA ? "Complete Authentication" : "Enter Dashboard"}</span>
            )}
          </button>
        </form>

        <div className="mt-12 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">
            Secure Cloud Inventory
          </p>
        </div>
      </div>
    </div>
  );
}
