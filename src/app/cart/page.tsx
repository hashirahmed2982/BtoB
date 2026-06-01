"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { useShop } from "@/app/context/ShopContext";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/app/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WalletInfo {
  balance:  number;
  currency: string;
}

function mapCartProductFromApi(p: any) {
  return {
    id:               String(p.id),
    name:             p.name || "",
    category:         p.category || "",
    price:            parseFloat(p.price) || 0,
    imageGradient:    "",
    badge:            p.hasCustomPrice ? "Special Price" : "",
    shortDescription: p.description
      ? p.description.slice(0, 80) + (p.description.length > 80 ? "..." : "")
      : `${p.brand || p.category || "Digital"} product - instant delivery.`,
    description:      p.description || "",
    rating:           0,
    reviews:          0,
    availableCodes:   p.availableCodes !== undefined && p.availableCodes !== null ? Number(p.availableCodes) : null,
    unlimitedStock:   p.unlimitedStock !== undefined ? Boolean(p.unlimitedStock) : false,
  };
}

function otpVerified(response: any) {
  return response?.success === true || response?.data?.success === true;
}

function getApiMessage(error: any, fallback: string) {
  return error?.message || fallback;
}

function OrderOtpModal({
  email = 'kingrao286@gmail.com',
  onClose,
  onVerified,
  onResend,
  verifying,
  resending,
  error,
}: {
  email: string;
  onClose: () => void;
  onVerified: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  verifying: boolean;
  resending: boolean;
  error: string | null;
}) {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

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
    setTimeLeft(60);
  };

  const submit = () => {
    if (otp.length !== 6 || verifying) return;
    onVerified(otp);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verify Order</h3>
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
              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => {
                if (e.key === "Enter") submit();
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
            ) : "Verify & Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

function CheckoutModal({
  cartItems, cartTotal, getProduct,
  onClose, onConfirm, placing, requestingOtp, placeError,
}: {
  cartItems:  { productId: string; quantity: number }[];
  cartTotal:  number;
  getProduct: (id: string) => { name: string; category: string; price: number } | undefined;
  onClose:    () => void;
  onConfirm:  () => Promise<void>;
  placing:    boolean;
  requestingOtp: boolean;
  placeError: string | null;
}) {
  const [wallet,        setWallet]        = useState<WalletInfo | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [walletError,   setWalletError]   = useState<string | null>(null);

  useEffect(() => {
    api.getWalletBalance()
      .then(res => setWallet({
        balance:  parseFloat(res.data?.balance ?? 0),
        currency: res.data?.currency ?? "USD",
      }))
      .catch(() => setWalletError("Could not load wallet balance."))
      .finally(() => setLoadingWallet(false));
  }, []);

  const currency     = wallet?.currency ?? "USD";
  const balance      = wallet?.balance  ?? 0;
  const balanceAfter = balance - cartTotal;
  const canAfford    = !loadingWallet && !walletError && balanceAfter >= 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Summary</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Review your order before confirming
            </p>
          </div>
          <button onClick={onClose} disabled={placing}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Items list ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-1">
            {cartItems.map(item => {
              const product  = getProduct(item.productId);
              const subtotal = product
                ? (product.price * item.quantity).toFixed(2)
                : "—";
              return (
                <div key={item.productId}
                  className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {product?.name ?? item.productId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product?.category ?? ""} · qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                    ${subtotal}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Wallet + balance summary ─────────────────────────────────────── */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-3">

          {/* Order total */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Order Total</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              ${cartTotal.toFixed(2)}
            </span>
          </div>

          {/* Wallet balance */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Wallet Balance</span>
            {loadingWallet ? (
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : walletError ? (
              <span className="text-xs text-red-500 dark:text-red-400">{walletError}</span>
            ) : (
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currency} {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Balance after */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Balance After Order</span>
            {loadingWallet ? (
              <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : walletError ? (
              <span className="text-sm text-gray-400">—</span>
            ) : (
              <span className={`text-sm font-bold ${
                balanceAfter >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {currency} {balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Insufficient funds */}
          {!loadingWallet && !walletError && balanceAfter < 0 && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">Insufficient Balance</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  You need {currency} {Math.abs(balanceAfter).toFixed(2)} more to complete this order.{" "}
                  <Link href="/wallet" onClick={onClose} className="underline font-medium">
                    Top up wallet →
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Delivery note */}
          {canAfford && (
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              You will verify this order with a 6-digit OTP before it is placed.
            </p>
          )}

          {/* API error */}
          {placeError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs text-red-700 dark:text-red-300">{placeError}</p>
            </div>
          )}
        </div>

        {/* ── Footer buttons ───────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button onClick={onClose} disabled={placing}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            Back to Cart
          </button>
          <button
            onClick={onConfirm}
            disabled={placing || requestingOtp || loadingWallet || !canAfford}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            {placing || requestingOtp ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {requestingOtp ? "Sending OTP..." : "Placing Order..."}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm & Place Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cartItems, cartTotal,
    updateCartQuantity, removeFromCart, clearCart,
    getCartProduct, addToCart,
  } = useShop();

  const [showCheckout, setShowCheckout] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [placing,      setPlacing]      = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [placeError,   setPlaceError]   = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const syncRef = useRef(false);

  // Sync cart items with server data on mount (once only per component mount)
  useEffect(() => {
    if (syncRef.current || cartItems.length === 0) return;
    syncRef.current = true;

    let isMounted = true;
    Promise.all(
      cartItems.map(item =>
        api.getClientProductById(item.productId)
          .then(res => ({ productId: item.productId, product: mapCartProductFromApi(res.data) }))
          .catch(() => null)
      )
    ).then(results => {
      if (!isMounted) return;
      results.forEach(result => {
        if (result?.product) {
          // Update product snapshot
          addToCart(result.productId, 0, result.product);

          // Check stock limits and auto-cap quantity
          const item = cartItems.find(i => i.productId === result.productId);
          if (item) {
            const hasStockLimit = !result.product.unlimitedStock && result.product.availableCodes !== undefined && result.product.availableCodes !== null;
            if (hasStockLimit) {
              const maxStock = result.product.availableCodes || 0;
              if (item.quantity > maxStock) {
                updateCartQuantity(result.productId, maxStock);
              }
            }
          }
        }
      });
    });

    return () => { isMounted = false; };
  }, []); // Only run on mount

  const sendOrderOtp = async (isResend = false) => {
    const email = user?.email;
    if (!email) {
      const message = "Could not find your account email. Please sign in again.";
      if (isResend) setOtpError(message);
      else setPlaceError(message);
      return;
    }

    if (isResend) {
      setResendingOtp(true);
      setOtpError(null);
    } else {
      setRequestingOtp(true);
      setPlaceError(null);
    }

    try {
      await api.requestOtp(email);
      setOtpError(null);
      setShowOtpModal(true);
    } catch (e: any) {
      const message = getApiMessage(e, "Failed to send OTP. Please try again.");
      if (isResend) setOtpError(message);
      else setPlaceError(message);
    } finally {
      if (isResend) setResendingOtp(false);
      else setRequestingOtp(false);
    }
  };

  const handleConfirmOrder = async () => {
    await sendOrderOtp(false);
  };

  const handleVerifiedOrder = async (otp: string) => {
    const email = user?.email;
    if (!email) {
      setOtpError("Could not find your account email. Please sign in again.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const result = await api.verifyOtp(email, otp);
      if (!otpVerified(result)) {
        setOtpError(result?.message || result?.data?.message || "Invalid OTP code. Please try again.");
        return;
      }

      setShowOtpModal(false);
      await placeOrder();
    } catch (e: any) {
      setOtpError(getApiMessage(e, "OTP verification failed. Please try again."));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    setPlaceError(null);
    try {
      await api.placeOrder(
        cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
      );
      clearCart();
      router.push("/orders");
    } catch (e: any) {
      setPlaceError(e.message || "Failed to place order. Please try again.");
      setPlacing(false);
    }
  };

  return (
    <Dashboard>
      <div className="app-page">

        {/* Hero */}
        <section className="app-card app-hero">
          <h1 className="app-title">Your Cart</h1>
          <p className="app-subtitle">Review selected items and complete purchase.</p>
        </section>

        {/* Cart items */}
        <section className="app-card">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-300">Your cart is empty.</p>
              <Link href="/products" className="app-button-primary inline-block mt-3">
                Browse Products
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {cartItems.map(item => {
                  const product  = getCartProduct(item.productId);
                  const subtotal = product
                    ? (product.price * item.quantity).toFixed(2)
                    : "—";

                  return (
                    <div key={item.productId} className="cart-item">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {product?.name ?? item.productId}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {product?.category ?? ""}
                        </p>
                      </div>
                      <div className="cart-item-actions">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={product?.unlimitedStock ? undefined : product?.availableCodes ?? undefined}
                            value={item.quantity}
                            onChange={e => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              const maxVal = product?.unlimitedStock ? val : (product?.availableCodes ?? val);
                              updateCartQuantity(
                                item.productId,
                                Math.min(val, maxVal)
                              );
                            }}
                            className="text-center"
                          />
                          {product && !product.unlimitedStock && product.availableCodes !== undefined && product.availableCodes !== null && (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                              {product.availableCodes} available
                            </span>
                          )}
                        </div>
                        <p className="font-semibold whitespace-nowrap">${subtotal}</p>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex-shrink-0"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-footer">
                <p>
                  Total: <strong>${cartTotal.toFixed(2)}</strong>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="app-button-secondary"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </button>
                  <button
                    type="button"
                    className="app-button-primary"
                    onClick={() => { setPlaceError(null); setShowCheckout(true); }}
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Checkout summary modal */}
      {showCheckout && (
        <CheckoutModal
          cartItems={cartItems}
          cartTotal={cartTotal}
          getProduct={getCartProduct}
          onClose={() => { if (!placing && !requestingOtp) setShowCheckout(false); }}
          onConfirm={handleConfirmOrder}
          placing={placing}
          requestingOtp={requestingOtp}
          placeError={placeError}
        />
      )}

      {showOtpModal && user?.email && (
        <OrderOtpModal
          email={user.email}
          onClose={() => {
            if (!verifyingOtp && !placing) setShowOtpModal(false);
          }}
          onVerified={handleVerifiedOrder}
          onResend={() => sendOrderOtp(true)}
          verifying={verifyingOtp || placing}
          resending={resendingOtp}
          error={otpError}
        />
      )}
    </Dashboard>
  );
}
