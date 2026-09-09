"use client";

import { useState, useEffect, useCallback } from "react";
import Dashboard from "@/components/Dashboard";
import ProductCard from "@/components/ProductCard";
import { api } from "@/src/app/lib/api";

// Matches the Product shape expected by ProductCard
export interface Product {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  badge: string;
  imageGradient: string;
  // Extended fields from API (available for product detail pages)
  brand?: string;
  regularPrice?: number;
  hasCustomPrice?: boolean;
  redemptionInstructions?: string;
  availableCodes?: number | null;
  unlimitedStock?: boolean;
}

// Gradients cycled for products that don't have images
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

function mapApiProduct(p: any, index: number): Product {
  // Pick a badge based on stock / pricing.
  // availableCodes === null is the API's unified "real-time stock" signal —
  // true for a pure supplier product, and (as of the backend's
  // sku_supplier_links check) also true for an internal product that has
  // since had a supplier linked to it. Checking p.source alone would miss
  // that second case, since linking a supplier never changes it.
  let badge = "";
  if (p.hasCustomPrice)                                        badge = "Special Price";
  else if (p.availableCodes != null && p.availableCodes < 10)   badge = "Low Stock";
  else if (p.availableCodes == null)                            badge = "Live Stock";

  return {
    id:                     String(p.id),
    name:                   p.name        || "",
    category:               p.category    || "",
    shortDescription:       p.description
                              ? p.description.slice(0, 80) + (p.description.length > 80 ? "…" : "")
                              : `${p.brand || p.category || "Digital"} product — instant delivery.`,
    description:            p.description || "",
    price:                  parseFloat(p.price) || 0,
    rating:                 0,   // not stored in DB — placeholder
    reviews:                0,   // not stored in DB — placeholder
    badge,
    imageGradient:          p.images?.[0]
                              ? ""   // ProductCard can use the URL directly when set
                              : GRADIENTS[index % GRADIENTS.length],
    // Extended
    brand:                  p.brand             || undefined,
    regularPrice:           p.regularPrice      || undefined,
    hasCustomPrice:         p.hasCustomPrice     || false,
    redemptionInstructions: p.redemptionInstructions || undefined,
    availableCodes:         p.availableCodes     ?? undefined,
    unlimitedStock:         p.unlimitedStock     || false,
  };
}

export default function ProductsPage() {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Filters
  const [filterCategory,  setFilterCategory]  = useState("all");

  // Pagination
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 50;

  // ─── Load categories once on mount ──────────────────────────────────────
  useEffect(() => {
    api.getClientProductCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => {/* non-critical */});
  }, []);

  // ─── Load products ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getClientProducts({
        category: filterCategory !== "all" ? filterCategory : undefined,
        page,
        limit: LIMIT,
      });
      setProducts((res.data || []).map((p: any, i: number) => mapApiProduct(p, i)));
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [filterCategory, page]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filterCategory]);
  useEffect(() => { load(); }, [load]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dashboard>
      <div className="app-page">

        {/* Hero */}
        <section className="app-card app-hero">
          <h1 className="app-title">Products</h1>
          <p className="app-subtitle">
            Browse our collection and select a product to see details.
          </p>
        </section>

        {/* Category Selection Dropdown */}
        <section className="app-card">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Filter by Category:
              </label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="app-input sm:w-64"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Selected Category Chip */}
            {filterCategory !== "all" && (
              <div className="flex items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800">
                  <span>Category: {filterCategory}</span>
                  <button
                    onClick={() => setFilterCategory("all")}
                    className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                    title="Clear filter"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Error */}
        {error && (
          <section className="app-card">
            <div className="flex items-center justify-between text-sm text-red-600 dark:text-red-400">
              <span>{error}</span>
              <button onClick={load} className="underline ml-4">Retry</button>
            </div>
          </section>
        )}

        {/* Loading skeleton */}
        {loading && (
          <section className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-3">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ))}
          </section>
        )}

        {/* Products grid */}
        {!loading && !error && (
          <>
            {products.length === 0 ? (
              <section className="app-card text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No products available in this category.
                </p>
              </section>
            ) : (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                  {total} product{total !== 1 ? "s" : ""} available
                </p>
                <section className="product-grid">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </section>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <section className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Dashboard>
  );
}
