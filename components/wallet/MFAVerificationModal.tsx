"use client";

import { useState, useEffect } from "react";
import { TopupRequest } from "@/app/wallet/page";

interface MFAVerificationModalProps {
  action: "approve" | "reject";
  request: TopupRequest;
  onVerified: () => void;
  onClose: () => void;
}

export default function MFAVerificationModal({
  action,
  request,
  onVerified,
  onClose,
}: MFAVerificationModalProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    // Simulate sending OTP
    const timer = setTimeout(() => {
      setOtpSent(true);
      console.log("OTP sent to admin email: 123456");
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!otpSent) return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, timeLeft]);

  const handleResend = () => {
    if (isVerifying || timeLeft > 0) return;
    setOtpSent(false);
    setError("");
    setOtp("");
    setTimeout(() => {
      setOtpSent(true);
      setTimeLeft(60);
      console.log("OTP sent to admin email: 123456");
    }, 1000);
  };

  const handleVerify = () => {
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP code");
      return;
    }

    setIsVerifying(true);
    setError("");

    // Simulate OTP verification
    setTimeout(() => {
      if (otp === "123456") {
        onVerified();
      } else {
        setError("Invalid OTP code. Please try again.");
        setIsVerifying(false);
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && otp.length === 6 && !isVerifying) {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              MFA Verification Required
            </h3>
            <button
              onClick={onClose}
              disabled={isVerifying}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Action Summary */}
          <div
            className={`p-4 rounded-lg ${
              action === "approve"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex gap-3">
              {action === "approve" ? (
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <div
                className={`text-sm ${
                  action === "approve"
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                <p className="font-medium mb-2">
                  You are about to {action} this topup request:
                </p>
                <div className="space-y-1">
                  <p>
                    <strong>Client:</strong> {request.userName}
                  </p>
                  <p>
                    <strong>Company:</strong> {request.company}
                  </p>
                  <p>
                    <strong>Amount:</strong> ${request.amount.toLocaleString()} USD
                  </p>
                  <p>
                    <strong>Request ID:</strong> {request.id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* OTP Sending Status */}
          {!otpSent ? (
            <div className="text-center py-6">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                Sending OTP code to your email...
              </p>
            </div>
          ) : (
            <>
              {/* OTP Sent Confirmation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    ✓ OTP code has been sent to your registered email address
                  </p>
                </div>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000000"
                  disabled={isVerifying}
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300 text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* Resend Code Button & Timer */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isVerifying || timeLeft > 0}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline disabled:text-gray-400 dark:disabled:text-gray-500 font-medium"
                >
                  Resend code
                </button>
                {timeLeft > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Resend in {timeLeft}s
                  </span>
                )}
              </div>

              {/* Demo Hint */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Demo OTP Code: <strong className="text-gray-900 dark:text-white">123456</strong>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isVerifying}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={!otpSent || otp.length !== 6 || isVerifying}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              action === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Verifying...
              </span>
            ) : (
              `Verify & ${action === "approve" ? "Approve" : "Reject"}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
