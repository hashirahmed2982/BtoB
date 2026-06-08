"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/app/lib/api";

type SettingsTab = "profile" | "security";
type PendingSave = "profile" | "security" | null;

function isOtpVerified(response: any) {
  return response?.success === true || response?.data?.success === true;
}

function apiErrorMessage(error: any, fallback: string) {
  if (error?.status === 409) return "Email already exists";
  if (error?.status === 400) {
    const validation = error?.data?.errors;
    if (Array.isArray(validation)) return validation.map((item: any) => item.message || item).join(", ");
    if (validation && typeof validation === "object") return Object.values(validation).flat().join(", ");
    return error?.data?.message || error?.message || fallback;
  }
  return error?.message || fallback;
}

function SettingsOtpModal({
  email,
  error,
  verifying,
  resending,
  onClose,
  onVerify,
  onResend,
}: {
  email: string;
  error: string | null;
  verifying: boolean;
  resending: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
}) {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleResend = async () => {
    if (resending || verifying || timeLeft > 0) return;
    await onResend();
    setTimeLeft(120);
  };

  const submit = () => {
    if (otp.length !== 6 || verifying) return;
    onVerify(otp);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verify Settings Change</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Enter the 6-digit code sent to {email}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={verifying}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40"
            aria-label="Close OTP verification"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              OTP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={event => setOtp(event.target.value.replace(/\D/g, ""))}
              onKeyDown={event => {
                if (event.key === "Enter") submit();
              }}
              disabled={verifying}
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder="000000"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || verifying || timeLeft > 0}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline disabled:text-gray-400 dark:disabled:text-gray-500 font-medium"
            >
              {resending ? "Sending new code..." : "Resend code"}
            </button>
            {timeLeft > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Resend in {timeLeft}s
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={verifying}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={otp.length !== 6 || verifying}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {verifying ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </>
            ) : "Verify & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { user, setUser, logout, isLoading } = useAuth();
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    company: "",
  });
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pendingSave, setPendingSave] = useState<PendingSave>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      fullName: user.full_name || "",
      email: user.email || "",
      company: user.company_name || "",
    });
  }, [user]);

  const handleProfileChange = (field: keyof typeof profileForm) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setProfileForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSecurityChange = (field: keyof typeof securityForm) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSecurityForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const requestSettingsOtp = async (target: Exclude<PendingSave, null>, isResend = false) => {
    const email = user?.email;
    if (!email) {
      const message = "Could not find your account email. Please sign in again.";
      if (isResend) setOtpError(message);
      else setError(message);
      return;
    }

    if (isResend) {
      setResendingOtp(true);
      setOtpError(null);
    } else {
      setRequestingOtp(true);
      setPendingSave(target);
      setError(null);
      setSuccess(null);
    }

    try {
      await api.requestOtp(email);
      setShowOtpModal(true);
      setOtpError(null);
    } catch (e: any) {
      const message = apiErrorMessage(e, "Failed to send OTP. Please try again.");
      if (isResend) setOtpError(message);
      else setError(message);
    } finally {
      if (isResend) setResendingOtp(false);
      else setRequestingOtp(false);
    }
  };

  const validateSecurity = () => {
    const hasPasswordChange = Boolean(
      securityForm.currentPassword || securityForm.newPassword || securityForm.confirmPassword
    );
    if (!hasPasswordChange) return true;
    if (!securityForm.newPassword || !securityForm.confirmPassword) {
      setError("New password and confirmation are required.");
      return false;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return false;
    }

    const pass = securityForm.newPassword;
    if (pass.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    if (!/[A-Z]/.test(pass)) {
      setError("Password must contain at least one capital letter.");
      return false;
    }
    if (!/\d/.test(pass)) {
      setError("Password must contain at least one number.");
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(pass)) {
      setError("Password must contain at least one special character.");
      return false;
    }

    return true;
  };

  const handleSave = async (target: Exclude<PendingSave, null>, event: FormEvent) => {
    event.preventDefault();
    if (target === "security" && !validateSecurity()) return;
    await requestSettingsOtp(target);
  };

  const saveSettings = async () => {
    if (!pendingSave) return;

    const passwordWasChanged = pendingSave === "security" && Boolean(securityForm.newPassword);
    const payload = pendingSave === "profile"
      ? {
          name: profileForm.fullName.trim(),
          email: profileForm.email.trim(),
          company: profileForm.company.trim(),
        }
      : {
          password: securityForm.newPassword,
        };

    setSaving(true);
    setError(null);
    try {
      const result = await api.updateMySettings(payload);
      setShowOtpModal(false);
      setSuccess("Settings saved successfully.");

      if (pendingSave === "profile" && user) {
        const updatedUser = {
          ...user,
          full_name: result?.data?.user?.full_name || result?.data?.user?.name || profileForm.fullName.trim(),
          email: profileForm.email.trim(),
          company_name: result?.data?.user?.company_name || result?.data?.user?.company || profileForm.company.trim(),
          ...(result?.data?.user || {}),
        };
        setUser(updatedUser);
      }

      if (passwordWasChanged) {
        logout();
        return;
      }

      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPendingSave(null);
    } catch (e: any) {
      const message = apiErrorMessage(e, "Failed to save settings.");
      setShowOtpModal(false);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const verifyOtpAndSave = async (otp: string) => {
    const email = user?.email;
    if (!email) {
      setOtpError("Could not find your account email. Please sign in again.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const result = await api.verifyOtp(email, otp);
      if (!isOtpVerified(result)) {
        setOtpError(result?.message || result?.data?.message || "Invalid OTP code. Please try again.");
        return;
      }

      await saveSettings();
    } catch (e: any) {
      setOtpError(apiErrorMessage(e, "OTP verification failed. Please try again."));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const busy = isLoading || requestingOtp || verifyingOtp || saving;

  return (
    <Dashboard>
      <div className="app-page">
        <section className="app-card app-hero">
          <h1 className="app-title">Settings</h1>
          <p className="app-subtitle">Manage your account preferences and settings.</p>
        </section>

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <section className="app-card">
          <div className="border-b border-gray-200 dark:border-gray-700 mb-5">
            <nav className="flex gap-2">
              {(["profile", "security"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg capitalize ${
                    activeTab === tab
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === "profile" && (
            <form className="space-y-6 max-w-2xl" onSubmit={event => handleSave("profile", event)}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={handleProfileChange("fullName")}
                    disabled={busy}
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange("email")}
                    disabled={busy}
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={profileForm.company}
                    onChange={handleProfileChange("company")}
                    disabled={busy}
                    className="app-input"
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={busy} className="app-button-primary px-4 py-2 disabled:opacity-50">
                    {requestingOtp && pendingSave === "profile" ? "Sending OTP..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form className="space-y-6 max-w-2xl" onSubmit={event => handleSave("security", event)}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={handleSecurityChange("currentPassword")}
                    placeholder="Current password"
                    disabled={busy}
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={securityForm.newPassword}
                    onChange={handleSecurityChange("newPassword")}
                    placeholder="New password"
                    disabled={busy}
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={handleSecurityChange("confirmPassword")}
                    placeholder="Confirm new password"
                    disabled={busy}
                    className="app-input"
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={busy} className="app-button-primary px-4 py-2 disabled:opacity-50">
                    {requestingOtp && pendingSave === "security" ? "Sending OTP..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      </div>

      {showOtpModal && user?.email && (
        <SettingsOtpModal
          email={user.email}
          error={otpError}
          verifying={verifyingOtp || saving}
          resending={resendingOtp}
          onClose={() => {
            if (!verifyingOtp && !saving) setShowOtpModal(false);
          }}
          onVerify={verifyOtpAndSave}
          onResend={() => requestSettingsOtp(pendingSave || activeTab, true)}
        />
      )}
    </Dashboard>
  );
}
