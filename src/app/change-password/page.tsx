"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function ChangePasswordPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one capital letter.";
    if (!/\d/.test(password)) return "Password must contain at least one number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    const validationError = validatePassword(formData.newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await api.changePassword(formData.currentPassword, formData.newPassword);
      
      // Update local storage and context
      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        // If somehow user context is not loaded yet, just clear and re-login
        // or attempt to parse from localstorage directly
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.mustChangePassword = false;
          localStorage.setItem("user", JSON.stringify(parsed));
          setUser(parsed);
        }
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
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
          <h2 className="text-2xl font-light text-white tracking-wide">
            Update Password
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            You must change your password before continuing.
          </p>
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

          <div className="space-y-2">
            <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-400 ml-1">
              Current Password
            </label>
            <input
              id="currentPassword" name="currentPassword" type="password" required
              value={formData.currentPassword} onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white text-sm outline-none transition-all placeholder:text-gray-600"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-xs font-medium text-gray-400 ml-1">
              New Password
            </label>
            <input
              id="newPassword" name="newPassword" type="password" required
              value={formData.newPassword} onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white text-sm outline-none transition-all placeholder:text-gray-600"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-400 ml-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword" name="confirmPassword" type="password" required
              value={formData.confirmPassword} onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white text-sm outline-none transition-all placeholder:text-gray-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-cyan-900/20 active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              <span>Update Password</span>
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
