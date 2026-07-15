"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { useShop } from "@/app/context/ShopContext";
import { api } from "@/app/lib/api";
import type { Product } from "@/app/products/page";

// ─── Gradients (must match products page) ────────────────────────────────────
const GRADIENTS = [
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #dc2626 0%, #111827 100%)",
  "linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)",
  "linear-gradient(135deg, #10b981 0%, #1d4ed8 100%)",
  "linear-gradient(135deg, #0f172a 0%, #38bdf8 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)",
];

function mapApiToProduct(p: any): Product {
  let badge = "";
  if (p.hasCustomPrice) badge = "Special Price";
  else if (p.availableCodes != null && p.availableCodes < 10) badge = "Low Stock";
  else if (p.source !== "internal") badge = "Live Stock";

  return {
    id: String(p.id),
    name: p.name || "",
    category: p.category || "",
    shortDescription: p.description
      ? p.description.slice(0, 80) + (p.description.length > 80 ? "…" : "")
      : `${p.brand || p.category || "Digital"} product — instant delivery.`,
    description: p.description || "",
    price: parseFloat(p.price) || 0,
    rating: 0,
    reviews: 0,
    badge,
    imageGradient: p.images?.[0] || GRADIENTS[parseInt(p.id) % GRADIENTS.length],
    brand: p.brand || undefined,
    regularPrice: p.regularPrice || undefined,
    hasCustomPrice: p.hasCustomPrice || false,
    redemptionInstructions: p.redemptionInstructions || undefined,
    availableCodes: p.availableCodes ?? undefined,
    unlimitedStock: p.unlimitedStock || false,
  };
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 19.657l-8.828-8.829a4 4 0 010-5.656z" />
    </svg>
  );
}

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    cartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    buyNow,
    isFavorite,
    toggleFavorite,
  } = useShop();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Derive cart state from context (single source of truth) ─────────────
  const cartItem = product ? cartItems.find(i => i.productId === product.id) : undefined;
  const cartQty = cartItem?.quantity ?? 0;
  const inCart = cartQty > 0;

  // ─── Fetch product ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    api.getClientProductById(params.id)
      .then(res => {
        if (!res.data) { setError("Product not found"); return; }
        setProduct(mapApiToProduct(res.data));
      })
      .catch(e => setError(e.message || "Failed to load product"))
      .finally(() => setLoading(false));
  }, [params.id]);

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <Dashboard>
        <div className="app-page">
          <section className="app-card animate-pulse space-y-4">
            <div className="h-48 sm:h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </section>
        </div>
      </Dashboard>
    );
  }

  // ─── Error / not found ────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <Dashboard>
        <div className="app-page">
          <section className="app-card">
            <h1 className="app-title">Product not found</h1>
            <p className="app-subtitle">
              {error || "This product is not available or you don't have access to it."}
            </p>
            <div className="mt-4">
              <Link href="/products" className="app-button-primary">Back to Products</Link>
            </div>
          </section>
        </div>
      </Dashboard>
    );
  }

  const favorite = isFavorite(product.id);

  const cartSnapshot = {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    imageGradient: product.imageGradient,
    badge: product.badge,
    shortDescription: product.shortDescription,
    description: product.description,
    rating: product.rating,
    reviews: product.reviews,
  };

  // ─── Cart handlers ────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    addToCart(product.id, 1, cartSnapshot);
  };

  const handleIncrement = () => {
    updateCartQuantity(product.id, cartQty + 1);
  };

  const handleDecrement = () => {
    if (cartQty <= 1) {
      removeFromCart(product.id);
    } else {
      updateCartQuantity(product.id, cartQty - 1);
    }
  };

  const handleBuyNow = () => {
    // If not in cart yet, add with qty 1; if already in cart keep existing qty
    if (!inCart) {
      buyNow(product.id, cartSnapshot);
    }
    router.push("/cart");
  };

  return (
    <Dashboard>
      <div className="app-page">
        <section className="product-details app-card">

          {/* Hero banner */}
          <div
            className="h-48 sm:h-64 rounded-xl flex items-start p-6 mb-6"
            style={
              product.imageGradient?.startsWith('http')
                ? { backgroundImage: `url(${product.imageGradient})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: product.imageGradient || "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }
            }
          >
            {product.badge && <span className="product-badge">{product.badge}</span>}
          </div>

          <div className="product-details-content">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {product.category}
            </p>
            <h1 className="app-title mt-2">{product.name}</h1>
            <p className="app-subtitle mt-2">{product.description || product.shortDescription}</p>

            <div className="product-meta mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Digital product · Instant delivery
              </span>
              <strong className="text-xl">${product.price.toFixed(2)}</strong>
            </div>

            {/* ── Actions ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mt-8">

              {/* Cart control — toggles between Add button and stepper */}
              {!inCart ? (
                <button
                  type="button"
                  className="app-button-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
                  onClick={handleAddToCart}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 3h2l1 5h13l-2 7H8L6 6H3m6 13a1 1 0 100 2 1 1 0 000-2zm7 0a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                  Add to Cart
                </button>
              ) : (
                <div className="flex items-center rounded-[0.65rem] border border-[var(--surface-border)] bg-[var(--surface)] overflow-hidden h-[2.4rem] flex-1 sm:flex-none sm:w-36">
                  {/* Minus */}
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-10 h-full flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  {/* Quantity + label */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                      {cartQty}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">
                      in cart
                    </span>
                  </div>

                  {/* Plus */}
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-10 h-full flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Buy Now — goes straight to cart */}
              <button
                type="button"
                className="app-button-secondary flex-1 sm:flex-none"
                onClick={handleBuyNow}
              >
                {inCart ? "Go to Cart →" : "Buy Now"}
              </button>

              {/* Favourite */}
              <button
                type="button"
                className={`app-button-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 ${favorite ? "text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : ""
                  }`}
                onClick={() => toggleFavorite(product.id, cartSnapshot)}
              >
                <HeartIcon filled={favorite} />
                <span>{favorite ? "Favorited" : "Add to Favorites"}</span>
              </button>
            </div>

            {/* "In your cart" summary strip */}
            {inCart && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  <span className="font-semibold text-gray-800 dark:text-white">{cartQty}×</span> in your cart
                  {" · "}
                  <span className="font-semibold text-gray-800 dark:text-white">
                    ${(product.price * cartQty).toFixed(2)} total
                  </span>
                </span>
                <Link href="/cart" className="ml-auto text-xs text-blue-600 dark:text-blue-400 underline font-medium">
                  View Cart
                </Link>
              </div>
            )}

            {/* Redemption instructions */}
            {product.redemptionInstructions && (
              <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Redemption Instructions
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {product.redemptionInstructions}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Dashboard>
  );
}