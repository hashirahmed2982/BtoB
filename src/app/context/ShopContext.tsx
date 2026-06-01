"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { products } from "@/app/data/products";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  imageGradient?: string;
  badge?: string;
  // Full Product fields so CartProduct can be used directly in ProductCard
  shortDescription?: string;
  description?: string;
  rating?: number;
  reviews?: number;
  brand?: string;
  regularPrice?: number;
  hasCustomPrice?: boolean;
  redemptionInstructions?: string;
  availableCodes?: number | null;
  unlimitedStock?: boolean;
}

interface CartItem {
  productId: string;
  quantity: number;
  product?: CartProduct; // snapshot stored alongside the item
}

interface FavoriteItem {
  productId: string;
  product?: CartProduct; // snapshot for display
}

interface ShopContextValue {
  cartItems:       CartItem[];
  favoriteIds:     string[];
  favoriteItems:   FavoriteItem[];
  cartCount:       number;
  favoriteCount:   number;
  cartTotal:       number;
  addToCart:          (productId: string, quantity?: number, product?: CartProduct) => void;
  buyNow:             (productId: string, product?: CartProduct) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart:     (productId: string) => void;
  clearCart:          () => void;
  isFavorite:         (productId: string) => boolean;
  toggleFavorite:     (productId: string, product?: CartProduct) => void;
  getCartProduct:     (productId: string) => CartProduct | undefined;
}

const SHOP_STORAGE_KEY = "b2b-shop-state-v2";

const ShopContext = createContext<ShopContextValue | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getFavoriteProducts(ids: string[]) {
  return products.filter(p => ids.includes(p.id));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cartItems,     setCartItems]     = useState<CartItem[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(SHOP_STORAGE_KEY);
      if (!cached) return;
      const parsed = JSON.parse(cached) as { cartItems?: CartItem[]; favoriteItems?: FavoriteItem[]; favoriteIds?: string[] };
      if (Array.isArray(parsed.cartItems))     setCartItems(parsed.cartItems);
      // Support both new favoriteItems and old favoriteIds format
      if (Array.isArray(parsed.favoriteItems)) {
        setFavoriteItems(parsed.favoriteItems);
      } else if (Array.isArray(parsed.favoriteIds)) {
        setFavoriteItems(parsed.favoriteIds.map((id: string) => ({ productId: id })));
      }
    } catch { /* ignore */ }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify({ cartItems, favoriteItems }));
  }, [cartItems, favoriteItems]);

  // ─── Cart actions ────────────────────────────────────────────────────────

  const addToCart = useCallback((productId: string, quantity = 1, product?: CartProduct) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) {
        return prev.map(i =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + quantity, product: product ?? i.product }
            : i
        );
      }
      return [...prev, { productId, quantity, product }];
    });
  }, []);

  const buyNow = useCallback((productId: string, product?: CartProduct) => {
    setCartItems(prev => {
      const rest = prev.filter(i => i.productId !== productId);
      return [...rest, { productId, quantity: 1, product }];
    });
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(i => i.productId !== productId));
      return;
    }
    setCartItems(prev =>
      prev.map(i => i.productId === productId ? { ...i, quantity } : i)
    );
  }, []);

  const removeFromCart = useCallback((productId: string) =>
    setCartItems(prev => prev.filter(i => i.productId !== productId)),
  []);

  const clearCart = useCallback(() => setCartItems([]), []);

  // ─── Favorites ───────────────────────────────────────────────────────────

  const favoriteIds = favoriteItems.map(f => f.productId);

  const isFavorite = useCallback((productId: string) => favoriteIds.includes(productId), [favoriteIds]);

  const toggleFavorite = useCallback((productId: string, product?: CartProduct) =>
    setFavoriteItems(prev =>
      prev.some(f => f.productId === productId)
        ? prev.filter(f => f.productId !== productId)
        : [...prev, { productId, product }]
    ),
  []);

  // ─── Derived ─────────────────────────────────────────────────────────────

  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems]
  );

  const favoriteCount = favoriteItems.length;

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0),
    [cartItems]
  );

  const getCartProduct = useCallback((productId: string) =>
    cartItems.find(i => i.productId === productId)?.product,
  [cartItems]);

  // ─── Context value ────────────────────────────────────────────────────

  const value = useMemo<ShopContextValue>(() => ({
    cartItems,
    favoriteIds,
    favoriteItems,
    cartCount,
    favoriteCount,
    cartTotal,
    addToCart,
    buyNow,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isFavorite,
    toggleFavorite,
    getCartProduct,
  }), [cartItems, favoriteItems, cartCount, favoriteCount, cartTotal, addToCart, buyNow, updateCartQuantity, removeFromCart, clearCart, isFavorite, toggleFavorite, getCartProduct]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
