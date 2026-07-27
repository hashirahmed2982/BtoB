"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useShop } from "@/app/context/ShopContext";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, getInitials } = useAuth();
  const { cartCount, favoriteCount } = useShop();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const initials = user?.full_name ? getInitials(user.full_name) : "?";

  const hasCart      = cartCount > 0;
  const hasFavorites = favoriteCount > 0;

  return (
    <header className="app-header bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* <div className="hidden md:block">
            <input
              type="search"
              placeholder="Search..."
              className="app-input px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div> */}

          {/* Favorites */}
          <Link
            href="/favorites"
            aria-label="Favorites"
            className={`header-icon-chip transition-all duration-200 ${
              hasFavorites
                ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 shadow-sm shadow-red-100 dark:shadow-red-900/30"
                : ""
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={hasFavorites ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 19.657l-8.828-8.829a4 4 0 010-5.656z"
              />
            </svg>
            {hasFavorites && (
              <span className="header-chip-count">{favoriteCount}</span>
            )}
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Cart"
            className={`header-icon-chip transition-all duration-200 ${
              hasCart
                ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] shadow-sm"
                : ""
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 3h2l1 5h13l-2 7H8L6 6H3m6 13a1 1 0 100 2 1 1 0 000-2zm7 0a1 1 0 100 2 1 1 0 000-2z"
              />
            </svg>
            {hasCart && (
              <span className="header-chip-count">{cartCount}</span>
            )}
          </Link>

          {/* Notifications */}
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-white leading-tight max-w-[130px] truncate">
                  {user?.full_name || "Loading..."}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize leading-tight">
                  {user?.role_name || ""}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}