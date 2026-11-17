import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  GitCompareArrows,
  Heart,
  Home,
  Megaphone,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Category, HomepageConfig, Product, UserAccount } from '../types';
import { formatINR, ProductImage } from '../utils/format';

export type AppRoute =
  | { page: 'home' }
  | { page: 'catalog'; division?: 'all' | 'new' | 'refurbished' | 'kit' | 'deals'; categoryId?: string; query?: string }
  | { page: 'product'; productId: string }
  | { page: 'compare' }
  | { page: 'buyback'; initialTab?: 'sell' | 'track'; trackId?: string }
  | { page: 'checkout' }
  | { page: 'account'; tab?: 'orders' | 'buybacks' | 'wishlist' | 'profile' }
  | { page: 'support'; doc?: string; trackOrderId?: string }
  | { page: 'admin' };

export interface CartLine {
  product: Product;
  qty: number;
}

const KrontonLogoMark: React.FC<{ light?: boolean }> = ({ light = false }) => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true" className="shrink-0">
    <rect x="3" y="4" width="7" height="28" rx="1.5" fill={light ? '#FFFFFF' : '#0A2A4D'} />
    <path d="M13 18L24.5 4H33L20.5 18.5L33 32H24.2L13 18Z" fill="#2B84EA" />
    <path d="M10 18L19.5 4H24.5L13 18L24.2 32H19L10 18Z" fill="#5BB2FF" opacity="0.85" />
  </svg>
);

interface HeaderProps {
  route: AppRoute;
  config: HomepageConfig;
  cart: CartLine[];
  wishlistCount: number;
  compareCount: number;
  currentUser: UserAccount | null;
  products: Product[];
  categories: Category[];
  onNavigate: (r: AppRoute) => void;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  route,
  config,
  cart,
  wishlistCount,
  compareCount,
  currentUser,
  products,
  categories,
  onNavigate,
  onOpenCart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const totalCartItems = cart.reduce((sum, line) => sum + line.qty, 0);

  const quickResults = searchTerm.trim()
    ? products
        .filter((p) => {
          const q = searchTerm.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.modelNumber.toLowerCase().includes(q) ||
            (p.unitId && p.unitId.toLowerCase().includes(q))
          );
        })
        .slice(0, 6)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    onNavigate({ page: 'catalog', division: 'all', query: searchTerm });
  };

  return (
    <>
      {/* Top Navy Promotional Bar */}
      {config.showAnnouncement && (
        <div className="bg-[#0A2A4D] text-white text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 truncate">
              <Megaphone className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span className="truncate font-medium">
                {config.announcementText || 'Flat 20% OFF on SMM Kits | Free Shipping on orders above ₹999'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ page: 'support', doc: 'track' })}
              className="inline-flex items-center gap-1 text-sky-200 hover:text-white font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              <span>Track Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main White Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-[0_1px_3px_rgba(10,42,77,0.04)]">
        {/* Tier 1: Logo + Search Bar + Account / Wishlist / Cart */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 lg:gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ page: 'home' })}
              className="flex items-center gap-2.5 text-left shrink-0"
            >
              <KrontonLogoMark />
              <div>
                <div className="font-display text-xl font-extrabold tracking-tight text-[#0A2A4D] leading-none">
                  KRONTON
                </div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5 tracking-wide">
                  Build · Innovate · Grow
                </div>
              </div>
            </button>
          </div>

          {/* Center Pill Search Input */}
          <div className="hidden md:block flex-1 max-w-xl relative">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white rounded-full px-4 py-2 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="text"
                value={searchTerm}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search components, boards, sensors..."
                className="w-full text-xs sm:text-sm text-slate-800 bg-transparent placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onNavigate({ page: 'catalog', division: 'all', query: searchTerm })}
                title="Open filtered catalog"
                aria-label="Open filtered catalog"
                className="p-1 text-slate-400 hover:text-[#0A2A4D] shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </form>

            {searchFocused && searchTerm.trim() && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
                {quickResults.length === 0 ? (
                  <p className="text-xs text-slate-500 p-3 text-center">
                    No components matched "{searchTerm}"
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {quickResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => onNavigate({ page: 'product', productId: p.id })}
                        className="w-full px-3 py-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {p.division === 'refurbished' ? `Refurbished Grade ${p.grade}` : p.division === 'kit' ? 'SMM Kit' : 'New'} · {p.sku}
                          </p>
                        </div>
                        <span className="text-xs font-bold font-mono tabular-nums text-[#0A2A4D] shrink-0">
                          {formatINR(p.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Utility Actions */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'account' ? null : 'account')}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#0A2A4D] whitespace-nowrap"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">
                  {currentUser ? currentUser.name.split(' ')[0] : 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {openDropdown === 'account' && (
                <div
                  onMouseLeave={() => setOpenDropdown(null)}
                  className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({ page: 'account', tab: 'orders' });
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    {currentUser ? 'Customer Dashboard' : 'Sign In / Register'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({ page: 'account', tab: 'buybacks' });
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    My Buyback Requests
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({ page: 'compare' });
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between"
                  >
                    <span>Compare Matrix</span>
                    {compareCount > 0 && <span className="font-mono text-blue-700">({compareCount})</span>}
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({ page: 'admin' });
                    }}
                    className="w-full text-left px-4 py-2 text-blue-700 hover:bg-blue-50 font-semibold"
                  >
                    Operations Admin Console
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate({ page: 'account', tab: 'wishlist' })}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#0A2A4D] whitespace-nowrap"
            >
              <Heart className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="text-xs font-mono text-slate-500">({wishlistCount})</span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Open shopping cart"
              className="relative flex items-center gap-1.5 p-1.5 text-slate-700 hover:text-[#0A2A4D]"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className=" -mt-4 -ml-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono flex items-center justify-center tabular-nums">
                {totalCartItems}
              </span>
            </button>
          </div>
        </div>

        {/* Tier 2: Clean Single-Line Category Navigation Bar */}
        <div className="hidden lg:block border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center justify-center gap-7 text-xs font-medium text-slate-700">
            <button
              type="button"
              onClick={() => onNavigate({ page: 'home' })}
              className={`px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                route.page === 'home'
                  ? 'bg-[#E8F1FC] text-[#0A2A4D] font-semibold'
                  : 'text-slate-700 hover:text-[#0A2A4D]'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-blue-700" />
              <span>Home</span>
            </button>

            {/* New Components Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('new')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                onClick={() => onNavigate({ page: 'catalog', division: 'new' })}
                className={`inline-flex items-center gap-1 py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  route.page === 'catalog' && route.division === 'new'
                    ? 'text-blue-700 font-semibold'
                    : 'hover:text-[#0A2A4D]'
                }`}
              >
                <span>New Components</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === 'new' && (
                <div className="absolute left-0 top-full w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                  {categories.slice(0, 6).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        onNavigate({ page: 'catalog', division: 'new', categoryId: cat.id });
                      }}
                      className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                    >
                      {cat.name}
                    </button>
                  ))}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({ page: 'catalog', division: 'new' });
                    }}
                    className="w-full text-left px-4 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    View All New Components →
                  </button>
                </div>
              )}
            </div>

            {/* Refurbished Components Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('refurb')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                onClick={() => onNavigate({ page: 'catalog', division: 'refurbished' })}
                className={`inline-flex items-center gap-1 py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  route.page === 'catalog' && route.division === 'refurbished'
                    ? 'text-blue-700 font-semibold'
                    : 'hover:text-[#0A2A4D]'
                }`}
              >
                <span>Refurbished Components</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === 'refurb' && (
                <div className="absolute left-0 top-full w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({ page: 'catalog', division: 'refurbished' });
                    }}
                    className="w-full text-left px-4 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    All Refurbished (Grades A–C)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate({ page: 'support', doc: 'refurbished-policy' });
                    }}
                    className="w-full text-left px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    15-Point Grading Policy
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate({ page: 'catalog', division: 'kit' })}
              className={`inline-flex items-center gap-1 py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                route.page === 'catalog' && route.division === 'kit'
                  ? 'text-blue-700 font-semibold'
                  : 'hover:text-[#0A2A4D]'
              }`}
            >
              <span>SMM Kits</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ page: 'buyback', initialTab: 'sell' })}
              className={`py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                route.page === 'buyback' ? 'text-blue-700 font-semibold' : 'hover:text-[#0A2A4D]'
              }`}
            >
              Sell Your Components
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ page: 'catalog', division: 'deals' })}
              className={`inline-flex items-center gap-1 py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                route.page === 'catalog' && route.division === 'deals'
                  ? 'text-blue-700 font-semibold'
                  : 'hover:text-[#0A2A4D]'
              }`}
            >
              <span>Deals & Offers</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ page: 'support', doc: 'contact' })}
              className={`inline-flex items-center gap-1 py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                route.page === 'support' ? 'text-blue-700 font-semibold' : 'hover:text-[#0A2A4D]'
              }`}
            >
              <span>Contact / Support</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
            <form onSubmit={handleSearchSubmit} className="mb-3 flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search components..."
                className="w-full text-xs bg-transparent focus:outline-none"
              />
            </form>
            {(
              [
                ['Home', { page: 'home' }],
                ['New Components', { page: 'catalog', division: 'new' }],
                ['Refurbished Components', { page: 'catalog', division: 'refurbished' }],
                ['SMM Kits', { page: 'catalog', division: 'kit' }],
                ['Sell Your Components', { page: 'buyback', initialTab: 'sell' }],
                ['Deals & Offers', { page: 'catalog', division: 'deals' }],
                ['Compare Components', { page: 'compare' }],
                ['Track Order & Support', { page: 'support', doc: 'track' }],
                ['Operations Admin Console', { page: 'admin' }],
              ] as [string, AppRoute][]
            ).map(([label, target]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  onNavigate(target);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-sm font-medium text-slate-800 hover:text-blue-700"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>
    </>
  );
};

interface CartDrawerProps {
  open: boolean;
  cart: CartLine[];
  onClose: () => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  cart,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}) => {
  if (!open) return null;

  const subtotal = cart.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const freeShippingThreshold = 999;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const shipping = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : 79;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full flex flex-col border-l border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0A2A4D]">Shopping Cart</h2>
            <p className="text-xs text-slate-500 tabular-nums">
              {cart.reduce((s, l) => s + l.qty, 0)} items · GST inclusive pricing
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-2.5 bg-[#EDF4FD] border-b border-blue-100 text-xs text-[#0A2A4D]">
            {remaining === 0 ? (
              <span className="font-semibold text-emerald-700">Unlocked Free Pan-India ESD Shipping</span>
            ) : (
              <span>
                Add <strong className="font-mono tabular-nums">{formatINR(remaining)}</strong> more for Free Pan-India shipping
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">Your KRONTON cart is empty</p>
              <p className="text-xs text-slate-500 mt-1">
                Browse new electronics, Grade A/B/C refurbished units, or curated SMM Kits.
              </p>
            </div>
          ) : (
            cart.map(({ product, qty }) => (
              <div key={product.id} className="py-4 flex gap-4">
                <div className="w-20 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                  <ProductImage src={product.images[0]} alt={product.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">
                    {product.division === 'refurbished'
                      ? `Refurbished Grade ${product.grade} · ${product.unitId}`
                      : product.division === 'kit'
                      ? 'SMM Kit'
                      : 'New Component'}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2 mt-0.5">{product.name}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="inline-flex items-center border border-slate-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, -1)}
                        className="p-1.5 text-slate-600 hover:text-slate-900"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-mono tabular-nums font-medium">{qty}</span>
                      <button
                        type="button"
                        disabled={qty >= product.stock}
                        onClick={() => onUpdateQty(product.id, 1)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                        {formatINR(product.price * qty)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id)}
                        aria-label="Remove item"
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums font-medium">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Shipping (India ESD Courier)</span>
              <span className="font-mono tabular-nums font-medium">
                {shipping === 0 ? 'Free' : formatINR(shipping)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Estimated Total</span>
              <span className="font-mono tabular-nums">{formatINR(subtotal + shipping)}</span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-3 bg-[#0A2A4D] hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface FooterProps {
  onNavigate: (r: AppRoute) => void;
  onNotify: (msg: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onNotify }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        onNotify('Subscribed to KRONTON engineering alerts and refurbished drops.');
        setEmail('');
      } else {
        onNotify('Please enter a valid email address.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#09213B] text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <KrontonLogoMark light />
            <div>
              <div className="font-display text-lg font-extrabold text-white tracking-tight leading-none">
                KRONTON
              </div>
              <div className="text-[10px] text-sky-300 mt-0.5">Build · Innovate · Grow</div>
            </div>
          </div>
          <p className="text-xs text-slate-300/90 leading-relaxed max-w-xs">
            Your trusted destination for electronics components, refurbished hardware and SMM Kits.
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
            <button type="button" onClick={() => onNavigate({ page: 'support', doc: 'about' })} className="hover:text-white">YouTube</button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => onNavigate({ page: 'support', doc: 'about' })} className="hover:text-white">LinkedIn</button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => onNavigate({ page: 'support', doc: 'about' })} className="hover:text-white">Instagram</button>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white mb-3.5">Quick Links</h4>
          <ul className="space-y-2 text-xs text-slate-300/90">
            <li><button type="button" onClick={() => onNavigate({ page: 'home' })} className="hover:text-white">Home</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'catalog', division: 'new' })} className="hover:text-white">New Components</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'catalog', division: 'refurbished' })} className="hover:text-white">Refurbished Components</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'catalog', division: 'kit' })} className="hover:text-white">SMM Kits</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'catalog', division: 'deals' })} className="hover:text-white">Deals & Offers</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white mb-3.5">Customer Support</h4>
          <ul className="space-y-2 text-xs text-slate-300/90">
            <li><button type="button" onClick={() => onNavigate({ page: 'support', doc: 'faqs' })} className="hover:text-white">FAQs</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'support', doc: 'contact' })} className="hover:text-white">Contact Us</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'support', doc: 'shipping' })} className="hover:text-white">Shipping Policy</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'support', doc: 'returns' })} className="hover:text-white">Return & Refund Policy</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'support', doc: 'warranty' })} className="hover:text-white">Warranty Policy</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white mb-3.5">About KRONTON</h4>
          <ul className="space-y-2 text-xs text-slate-300/90">
            <li><button type="button" onClick={() => onNavigate({ page: 'support', doc: 'about' })} className="hover:text-white">About Us</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'support', doc: 'privacy' })} className="hover:text-white">Privacy Policy</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'support', doc: 'privacy' })} className="hover:text-white">Terms & Conditions</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'support', doc: 'buyback-terms' })} className="hover:text-white">Buyback Terms</button></li>
            <li><button type="button" onClick={() => onNavigate({ page: 'admin' })} className="text-sky-300 hover:text-white">Admin Console</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white mb-3">Stay Updated</h4>
          <p className="text-xs text-slate-300/80 mb-3 leading-relaxed">
            Subscribe to our newsletter for latest deals and updates.
          </p>
          <form onSubmit={handleSubscribe} className="flex items-stretch rounded-lg overflow-hidden bg-white">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 min-w-0 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              aria-label="Subscribe to newsletter"
              className="px-3.5 bg-[#2B84EA] hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center transition-colors"
            >
              ›
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} KRONTON. All rights reserved.</p>
          <p>Made with ♥ for Innovators</p>
        </div>
      </div>
    </footer>
  );
};
