"use client";

import Link from "next/link";
import type { Product } from "@/app/products/page";
import { useShop } from "@/app/context/ShopContext";

interface ProductCardProps {
  product: Product;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 19.657l-8.828-8.829a4 4 0 010-5.656z" />
    </svg>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, removeFromCart, updateCartQuantity, toggleFavorite, isFavorite, cartItems } = useShop();
  const favorite = isFavorite(product.id);

  const cartItem = cartItems.find(i => i.productId === product.id);
  const quantity = cartItem?.quantity ?? 0;
  const inCart   = quantity > 0;

  const snapshot = {
    id:               product.id,
    name:             product.name,
    category:         product.category,
    price:            product.price,
    imageGradient:    product.imageGradient,
    badge:            product.badge,
    shortDescription: product.shortDescription,
    description:      product.description,
    rating:           product.rating,
    reviews:          product.reviews,
  };

  const handleAdd       = () => addToCart(product.id, 1, snapshot);
  const handleIncrement = () => updateCartQuantity(product.id, quantity + 1);
  const handleDecrement = () => {
    if (quantity <= 1) removeFromCart(product.id);
    else updateCartQuantity(product.id, quantity - 1);
  };

  return (
    // card: flex column so all cards in a row stretch to equal height
    <article className="product-card group" style={{ display: "flex", flexDirection: "column" }}>

      {/* Image */}
      <Link href={`/products/${product.id}`} className="block flex-shrink-0">
        <div
          className="product-visual flex items-start justify-between p-3"
          style={{ background: product.imageGradient || "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
        >
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <span className="product-category">{product.category}</span>
        </div>
      </Link>

      {/* Content: flex column, grows to fill card height */}
      <div className="product-content" style={{ display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Name + description: flex-1 absorbs variable text, pushes rest down */}
        <div className="flex items-start justify-between gap-3" style={{ flex: 1 }}>
          <div className="flex flex-col gap-1 min-w-0">
            <Link href={`/products/${product.id}`} className="product-name">
              {product.name}
            </Link>
            <p className="product-description">{product.shortDescription}</p>
          </div>
          <button
            type="button"
            className={`favorite-button flex-shrink-0 ${favorite ? "is-active" : ""}`}
            onClick={() => toggleFavorite(product.id, snapshot)}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <HeartIcon filled={favorite} />
          </button>
        </div>

        {/* Price — always at the same vertical position across all cards */}
        <div className="product-meta flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Instant delivery</span>
          <strong>${product.price.toFixed(2)}</strong>
        </div>

        {/* Actions — always pinned to the bottom */}
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          {!inCart ? (
            <button
              type="button"
              className="app-button-primary flex-1"
              onClick={handleAdd}
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-1 rounded-[0.65rem] border border-[var(--surface-border)] bg-[var(--surface)] overflow-hidden h-[2.4rem]">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-10 h-full flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white select-none">
                {quantity}
              </span>
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

          <Link href={`/products/${product.id}`} className="app-button-secondary flex-1 text-center">
            View Details
          </Link>
        </div>

      </div>
    </article>
  );
}