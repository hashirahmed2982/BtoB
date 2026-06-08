"use client";

// components/QuantityStepper.tsx
// Shared stepper used on ProductCard, product detail page, and cart page.
// − button | editable numeric input (max 4 digits) | + button
// When quantity reaches 0 via − button, onRemove() is called if provided,
// otherwise quantity stays at 1.

import { useState, useRef } from "react";

interface Props {
  quantity:  number;
  onChange:  (qty: number) => void;
  onRemove?: () => void;          // called when − is pressed at qty=1
  size?:     "sm" | "md";        // sm = product card, md = cart / detail
}

const MAX = 9999;

export default function QuantityStepper({ quantity, onChange, onRemove, size = "sm" }: Props) {
  // Local string state so the user can clear the field and type freely
  const [inputVal, setInputVal] = useState(String(quantity));
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep inputVal in sync if parent changes quantity externally
  // (e.g. another card increments the same item)
  const prevQty = useRef(quantity);
  if (quantity !== prevQty.current) {
    prevQty.current = quantity;
    setInputVal(String(quantity));
  }

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!raw || isNaN(n) || n < 1) {
      // Empty or invalid → revert to current quantity
      setInputVal(String(quantity));
      return;
    }
    const clamped = Math.min(n, MAX);
    setInputVal(String(clamped));
    if (clamped !== quantity) onChange(clamped);
  };

  const decrement = () => {
    if (quantity <= 1) {
      onRemove?.();
    } else {
      onChange(quantity - 1);
    }
  };

  const increment = () => {
    if (quantity < MAX) onChange(quantity + 1);
  };

  const h   = size === "md" ? "h-[2.6rem]" : "h-[2.4rem]";
  const btn = size === "md" ? "w-10" : "w-9";
  const inp = size === "md" ? "text-sm w-14" : "text-sm w-10";

  return (
    <div className={`flex items-center rounded-[0.65rem] border border-[var(--surface-border)] bg-[var(--surface)] overflow-hidden ${h}`}>
      {/* − */}
      <button
        type="button"
        onClick={decrement}
        className={`${btn} ${h} flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0`}
        aria-label="Decrease quantity"
      >
        −
      </button>

      {/* Editable input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={inputVal}
        maxLength={4}
        onChange={e => {
          // Only allow digits, max 4 chars
          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
          setInputVal(v);
        }}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            commit(inputVal);
            inputRef.current?.blur();
          }
          // Allow only digit keys, backspace, delete, arrows, tab
          if (
            !/^\d$/.test(e.key) &&
            !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
          ) {
            e.preventDefault();
          }
        }}
        className={`${inp} text-center font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none select-all py-0`}
        aria-label="Quantity"
      />

      {/* + */}
      <button
        type="button"
        onClick={increment}
        disabled={quantity >= MAX}
        className={`${btn} ${h} flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 disabled:opacity-40`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
