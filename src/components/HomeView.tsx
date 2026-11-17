import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  Heart,
  IndianRupee,
  LayoutGrid,
  ShieldCheck,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { Category, HomepageConfig, Product, Review } from '../types';
import { IMG_HERO, IMG_KIT, IMG_MCU, IMG_REFURB, IMG_SENSORS } from '../data/seedData';
import { formatINR, ProductImage } from '../utils/format';
import { AppRoute } from './NavbarAndFooter';

interface HomeViewProps {
  config: HomepageConfig;
  categories: Category[];
  products: Product[];
  reviews: Review[];
  wishlist: string[];
  compareList: string[];
  onNavigate: (r: AppRoute) => void;
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

const HERO_SLIDES = [
  {
    kicker: 'YOUR ELECTRONICS MARKETPLACE',
    line1: 'Build More. Spend Less.',
    line2: 'Create Without Limits.',
    description:
      'Explore new electronics components, quality-tested refurbished hardware and curated SMM Kits at KRONTON.',
    image: IMG_HERO,
    accentTag: 'Innovate Smarter',
  },
  {
    kicker: '15-POINT LAB TESTED RECOMMERCE',
    line1: 'Certified Refurbished.',
    line2: 'Save 50% to 70% Today.',
    description:
      'Every Grade A, B, and C board undergoes voltage-rail, GPIO continuity, and thermal load verification before shipping.',
    image: IMG_REFURB,
    accentTag: 'Lab Certified',
  },
  {
    kicker: 'CURATED FOR LABS & MAKERS',
    line1: 'All-in-One SMM Kits.',
    line2: 'Ready to Prototype.',
    description:
      'Compartmentalized IoT, Robotics, and Analog Lab boxes with pre-tested modules, schematics, and starter code.',
    image: IMG_KIT,
    accentTag: 'Build Faster',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  config,
  categories,
  products,
  reviews,
  wishlist,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [heroSlide, setHeroSlide] = useState(0);
  const [showAllCats, setShowAllCats] = useState(false);

  const slide = HERO_SLIDES[heroSlide];
  const enabledCategories = categories.filter((c) => c.enabled);
  const visibleCats = showAllCats ? enabledCategories : enabledCategories.slice(0, 7);

  const publishedProducts = products.filter(
    (p) => p.stockStatus !== 'Under Inspection' && p.stockStatus !== 'Parts Only' && p.grade !== 'D'
  );

  // Pick 3 New Arrivals and 3 Refurbished Deals to match the dual side-by-side grid
  const newArrivals = publishedProducts.filter((p) => p.division === 'new' && p.isNewArrival).slice(0, 3);
  const refurbDeals = publishedProducts.filter((p) => p.division === 'refurbished').slice(0, 3);

  const testimonials =
    reviews.length >= 3
      ? [
          { name: 'Rahul Sharma, Delhi', quote: 'Excellent platform! Great quality and super fast delivery.', rating: 5, initials: 'RS' },
          { name: 'Priya Nair, Bengaluru', quote: 'Refurbished products are amazing. Saved 50% and works perfectly!', rating: 5, initials: 'PN' },
          { name: 'Aman Verma, Mumbai', quote: 'Best place for electronics and robotics components.', rating: 5, initials: 'AV' },
        ]
      : reviews.slice(0, 3).map((r) => ({
          name: r.authorName,
          quote: r.comment,
          rating: r.rating,
          initials: r.authorName
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2),
        }));

  return (
    <div className="bg-[#F4F7FB]">
      {/* 1. Hero Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#EDF5FF] via-[#E5F0FE] to-[#D4E6FD] px-6 sm:px-10 lg:px-14 py-8 lg:py-11">
          {/* Subtle circuit lines backdrop */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
            viewBox="0 0 1200 420"
            fill="none"
            aria-hidden="true"
          >
            <path d="M0 90 H240 L280 130 H540" stroke="#7EB5F7" strokeWidth="1.5" />
            <path d="M90 340 H360 L400 300 H720" stroke="#7EB5F7" strokeWidth="1.5" />
            <path d="M840 60 H1020 L1060 100 H1200" stroke="#7EB5F7" strokeWidth="1.5" />
            <circle cx="280" cy="130" r="4" fill="#7EB5F7" />
            <circle cx="400" cy="300" r="4" fill="#7EB5F7" />
          </svg>

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="inline-block px-3 py-1 rounded-full bg-[#D8E9FE] text-[#1D5EA8] text-[11px] font-bold tracking-wider uppercase">
                {slide.kicker}
              </span>

              <h1
                className="font-display font-extrabold text-[#0A223D] tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3.1rem)' }}
              >
                {heroSlide === 0 && config.heroHeadline !== 'Build More. Spend Less. Create Without Limits.' ? (
                  config.heroHeadline
                ) : (
                  <>
                    <span className="block">{slide.line1}</span>
                    <span className="block text-[#2B7CE9]">{slide.line2}</span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed">
                {heroSlide === 0 ? config.heroDescription : slide.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'catalog', division: 'new' })}
                  className="px-5 py-2.5 bg-[#0A2A4D] hover:bg-[#0D3866] text-white text-xs sm:text-sm font-semibold rounded-full inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <span>Explore Components</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'catalog', division: 'refurbished' })}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#0A2A4D] border border-slate-200 text-xs sm:text-sm font-semibold rounded-full transition-colors whitespace-nowrap"
                >
                  Shop Refurbished
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'buyback', initialTab: 'sell' })}
                  className="px-5 py-2.5 bg-[#CCE2FC] hover:bg-[#BCD7FA] text-[#0A2A4D] text-xs sm:text-sm font-semibold rounded-full transition-colors whitespace-nowrap"
                >
                  Sell Your Components
                </button>
              </div>
            </div>

            {/* Right Hardware Visual Composition */}
            <div className="lg:col-span-6 relative">
              <div className="hidden sm:block text-right mb-2">
                <span className="font-display italic text-sm font-semibold text-[#1D5EA8]/80">
                  {slide.accentTag}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-7 rounded-2xl overflow-hidden border border-white/80 shadow-lg bg-white">
                  <img
                    src={slide.image}
                    alt="KRONTON electronic hardware showcase"
                    referrerPolicy="no-referrer"
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                </div>
                <div className="col-span-5 space-y-3">
                  <div className="rounded-xl overflow-hidden border border-white/80 shadow-md bg-white">
                    <img
                      src={IMG_MCU}
                      alt="ESP32 & Development Boards"
                      referrerPolicy="no-referrer"
                      className="w-full h-28 object-cover"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/80 shadow-md bg-white">
                    <img
                      src={IMG_SENSORS}
                      alt="Ultrasonic Sensors & Robotics Motors"
                      referrerPolicy="no-referrer"
                      className="w-full h-28 object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Carousel Indicators & Controls */}
          <div className="relative mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Slide ${idx + 1}`}
                  onClick={() => setHeroSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    heroSlide === idx ? 'w-6 bg-[#0A2A4D]' : 'w-2 bg-slate-400/50 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous hero slide"
                onClick={() => setHeroSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-slate-200 flex items-center justify-center text-[#0A2A4D]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next hero slide"
                onClick={() => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-slate-200 flex items-center justify-center text-[#0A2A4D]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category (8-card single row) */}
      {config.showCategoriesSection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0A223D]">
              Shop by Category
            </h2>
            <button
              type="button"
              onClick={() => onNavigate({ page: 'catalog', division: 'all' })}
              className="text-xs font-semibold text-[#1D5EA8] hover:text-[#0A2A4D] inline-flex items-center gap-1"
            >
              <span>Browse All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
            {visibleCats.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onNavigate({ page: 'catalog', division: 'all', categoryId: cat.id })}
                className="group bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-2.5 flex flex-col items-center text-center transition-all hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#F1F5FB] mb-2">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowAllCats(!showAllCats)}
              className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-2.5 flex flex-col items-center justify-center text-center transition-all hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="w-full aspect-[4/3] rounded-lg bg-[#F1F5FB] mb-2 flex items-center justify-center">
                <LayoutGrid className="w-7 h-7 text-[#0A2A4D]" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] font-semibold text-[#0A2A4D] leading-tight">
                {showAllCats ? 'Show Less −' : 'More Categories +'}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* 3. Side-by-Side New Arrivals & Refurbished Deals */}
      {config.showDealsSection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Left: New Arrivals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0A223D]">New Arrivals</h2>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'catalog', division: 'new' })}
                  className="text-xs font-semibold text-[#1D5EA8] hover:text-[#0A2A4D] inline-flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {newArrivals.map((p) => {
                  const isWish = wishlist.includes(p.id);
                  return (
                    <article
                      key={p.id}
                      className="group bg-white border border-slate-200/90 rounded-xl p-3 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">
                            New
                          </span>
                          <button
                            type="button"
                            aria-label="Wishlist"
                            onClick={() => onToggleWishlist(p.id)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Heart className={`w-4 h-4 ${isWish ? 'fill-rose-600 text-rose-600' : ''}`} />
                          </button>
                        </div>

                        <div
                          onClick={() => onNavigate({ page: 'product', productId: p.id })}
                          className="cursor-pointer rounded-lg overflow-hidden bg-[#F7F9FC] mb-2.5"
                        >
                          <ProductImage src={p.images[0]} alt={p.name} />
                        </div>

                        <h3
                          onClick={() => onNavigate({ page: 'product', productId: p.id })}
                          className="text-xs font-semibold text-slate-900 line-clamp-2 cursor-pointer hover:text-blue-700 leading-snug"
                        >
                          {p.name}
                        </h3>
                      </div>

                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span className="text-sm font-bold text-[#0A223D] font-mono tabular-nums">
                            {formatINR(p.price)}
                          </span>
                          {p.mrp > p.price && (
                            <>
                              <span className="text-[11px] text-slate-400 line-through font-mono tabular-nums">
                                {formatINR(p.mrp)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                {p.discountPercent}% OFF
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 tabular-nums">
                            <Star className="w-3 h-3 text-amber-400 fill-current" />
                            <strong className="text-slate-800">{p.rating.toFixed(1)}</strong> ({p.reviewCount})
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddToCart(p)}
                            aria-label={`Add ${p.name} to cart`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#0A2A4D] text-slate-700 hover:text-white transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Right: Refurbished Deals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0A223D]">Refurbished Deals</h2>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'catalog', division: 'refurbished' })}
                  className="text-xs font-semibold text-[#1D5EA8] hover:text-[#0A2A4D] inline-flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {refurbDeals.map((p) => {
                  const isWish = wishlist.includes(p.id);
                  const compareNew = p.newComparisonPrice || p.mrp;
                  const pctOff = Math.round(((compareNew - p.price) / compareNew) * 100);
                  const gradeStyle =
                    p.grade === 'A'
                      ? 'bg-amber-400 text-slate-900'
                      : p.grade === 'B'
                      ? 'bg-amber-200 text-amber-950'
                      : 'bg-orange-200 text-orange-950';

                  return (
                    <article
                      key={p.id}
                      className="group bg-white border border-slate-200/90 rounded-xl p-3 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${gradeStyle}`}>
                            Grade {p.grade || 'A'}
                          </span>
                          <button
                            type="button"
                            aria-label="Wishlist"
                            onClick={() => onToggleWishlist(p.id)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Heart className={`w-4 h-4 ${isWish ? 'fill-rose-600 text-rose-600' : ''}`} />
                          </button>
                        </div>

                        <div
                          onClick={() => onNavigate({ page: 'product', productId: p.id })}
                          className="cursor-pointer rounded-lg overflow-hidden bg-[#F7F9FC] mb-2.5"
                        >
                          <ProductImage src={p.images[0]} alt={p.name} />
                        </div>

                        <h3
                          onClick={() => onNavigate({ page: 'product', productId: p.id })}
                          className="text-xs font-semibold text-slate-900 line-clamp-2 cursor-pointer hover:text-blue-700 leading-snug"
                        >
                          {p.name}
                        </h3>
                      </div>

                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span className="text-sm font-bold text-[#0A223D] font-mono tabular-nums">
                            {formatINR(p.price)}
                          </span>
                          {compareNew > p.price && (
                            <>
                              <span className="text-[11px] text-slate-400 line-through font-mono tabular-nums">
                                {formatINR(compareNew)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                {pctOff}% OFF
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 truncate">
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">Tested · {p.warranty.replace('KRONTON Refurbished ', '')}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddToCart(p)}
                            aria-label={`Add ${p.name} to cart`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#0A2A4D] text-slate-700 hover:text-white transition-colors shrink-0"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Twin Feature Banners: Sell Your Components & Featured SMM Kits */}
      {(config.showBuybackSection || config.showKitsSection) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sell Your Components Banner */}
            <div
              onClick={() => onNavigate({ page: 'buyback', initialTab: 'sell' })}
              className="group cursor-pointer relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#EBF2FB] to-[#DDE9F8] p-6 sm:p-8 flex items-center justify-between gap-6"
            >
              <div className="max-w-xs space-y-3 z-10">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0A223D]">
                  Sell Your Components
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Turn your unused electronic components into value. Get a fair price, hassle-free process!
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate({ page: 'buyback', initialTab: 'sell' });
                  }}
                  className="px-5 py-2.5 bg-[#0A2A4D] hover:bg-blue-700 text-white text-xs font-semibold rounded-full inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Start Selling</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-36 sm:w-44 shrink-0 rounded-xl overflow-hidden border border-white shadow-md bg-white">
                <img
                  src={IMG_REFURB}
                  alt="Sell unused electronics components to KRONTON"
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              <span className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/80 text-slate-600 flex items-center justify-center">
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            {/* Featured SMM Kits Banner */}
            <div
              onClick={() => onNavigate({ page: 'catalog', division: 'kit' })}
              className="group cursor-pointer relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#EDF5FF] to-[#DFECFC] p-6 sm:p-8 flex items-center justify-between gap-6"
            >
              <div className="max-w-xs space-y-3 z-10">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0A223D]">
                  Featured SMM Kits
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Ready-to-build kits for learners, makers and innovators.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate({ page: 'catalog', division: 'kit' });
                  }}
                  className="px-5 py-2.5 bg-[#0A2A4D] hover:bg-blue-700 text-white text-xs font-semibold rounded-full inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Explore Kits</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-36 sm:w-44 shrink-0 rounded-xl overflow-hidden border border-white shadow-md bg-white">
                <img
                  src={IMG_KIT}
                  alt="Featured SMM Kits at KRONTON"
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              <span className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/80 text-slate-600 flex items-center justify-center">
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 5. Why Choose KRONTON? + Our Quality Assurance Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0A223D] mb-4">
              Why Choose KRONTON?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1">
              {[
                { icon: ShieldCheck, label: 'New & Refurbished Options' },
                { icon: Check, label: 'Quality-Tested Components' },
                { icon: IndianRupee, label: 'Affordable Pricing' },
                { icon: CreditCard, label: 'Secure Payments' },
                { icon: Headphones, label: 'Dedicated Support' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#EDF4FD] text-[#1D5EA8] flex items-center justify-center">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 leading-snug">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-full rounded-2xl border border-blue-100 bg-gradient-to-br from-[#EDF5FF] to-[#DFECFC] p-6 sm:p-7 flex items-center justify-between gap-5">
              <div className="space-y-2.5 max-w-xs">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0A223D]">
                  Our Quality Assurance Process
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every refurbished product goes through a rigorous inspection, testing and grading process.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'support', doc: 'refurbished-policy' })}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1D5EA8] hover:text-[#0A2A4D] pt-1"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white/80 border border-blue-200/80 flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-11 h-11 text-[#0A2A4D]" strokeWidth={1.6} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. What Our Customers Say */}
      {config.showReviewsSection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0A223D]">
              What Our Customers Say
            </h2>
            <button
              type="button"
              onClick={() => onNavigate({ page: 'catalog', division: 'all' })}
              className="text-xs font-semibold text-[#1D5EA8] hover:text-[#0A2A4D] inline-flex items-center gap-1"
            >
              <span>View All Reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/80 rounded-xl p-5 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#E8F1FC] text-[#0A2A4D] font-display font-bold text-sm flex items-center justify-center shrink-0 border border-blue-100">
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-0.5 text-amber-400 mb-1.5">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed">"{t.quote}"</p>
                  <p className="text-[11px] text-slate-500 mt-1.5">{t.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
