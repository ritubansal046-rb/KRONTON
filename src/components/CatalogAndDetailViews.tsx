import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  GitCompareArrows,
  Heart,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { Category, Product, Review, UserAccount } from '../types';
import { formatINR, downloadProductDatasheet, ProductImage } from '../utils/format';
import { AppRoute } from './NavbarAndFooter';
import { ProductCard } from './ProductCard';

interface CatalogViewProps {
  products: Product[];
  categories: Category[];
  initialDivision?: 'all' | 'new' | 'refurbished' | 'kit' | 'deals';
  initialCategoryId?: string;
  initialQuery?: string;
  wishlist: string[];
  compareList: string[];
  onNavigate: (r: AppRoute) => void;
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  categories,
  initialDivision = 'all',
  initialCategoryId = '',
  initialQuery = '',
  wishlist,
  compareList,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
  onToggleCompare,
}) => {
  const [division, setDivision] = useState<'all' | 'new' | 'refurbished' | 'kit' | 'deals'>(initialDivision);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [brandFilter, setBrandFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(15000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'newest' | 'discount'>('popular');

  const categoryNameMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  // Exclude internal Under Inspection / Parts Only Grade D items from public catalog
  const publicProducts = useMemo(
    () =>
      products.filter(
        (p) => p.stockStatus !== 'Under Inspection' && p.stockStatus !== 'Parts Only' && p.grade !== 'D'
      ),
    [products]
  );

  const availableBrands = useMemo(
    () => Array.from(new Set(publicProducts.map((p) => p.brand))).sort(),
    [publicProducts]
  );

  const filtered = useMemo(() => {
    return publicProducts
      .filter((p) => {
        if (division === 'new' && p.division !== 'new') return false;
        if (division === 'refurbished' && p.division !== 'refurbished') return false;
        if (division === 'kit' && p.division !== 'kit') return false;
        if (division === 'deals' && p.discountPercent < 25 && p.division !== 'refurbished') return false;
        if (categoryId && p.categoryId !== categoryId) return false;
        if (brandFilter && p.brand !== brandFilter) return false;
        if (gradeFilter && p.grade !== gradeFilter) return false;
        if (p.price > maxPrice) return false;
        if (inStockOnly && p.stock <= 0) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.modelNumber.toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q) ||
            (p.unitId && p.unitId.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'discount') return b.discountPercent - a.discountPercent;
        if (sortBy === 'newest') return Number(b.isNewArrival) - Number(a.isNewArrival);
        return Number(b.isBestSeller) - Number(a.isBestSeller) || b.rating - a.rating;
      });
  }, [publicProducts, division, categoryId, brandFilter, gradeFilter, maxPrice, inStockOnly, searchQuery, sortBy]);

  const resetFilters = () => {
    setDivision('all');
    setCategoryId('');
    setBrandFilter('');
    setGradeFilter('');
    setMaxPrice(15000);
    setInStockOnly(false);
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs text-slate-500 mb-1">KRONTON Hardware Catalog</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {division === 'refurbished'
              ? 'Lab-Tested Refurbished Components'
              : division === 'kit'
              ? 'Curated SMM Kits'
              : division === 'new'
              ? 'New Electronic Components'
              : division === 'deals'
              ? 'Deals & Surplus Offers'
              : 'All Electronic Components & Kits'}
          </h1>
        </div>

        {/* Division segmented switcher */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto max-w-full">
          {(
            [
              ['all', 'All'],
              ['new', 'New'],
              ['refurbished', 'Refurbished'],
              ['kit', 'SMM Kits'],
              ['deals', 'Deals'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDivision(key);
                if (key !== 'refurbished') setGradeFilter('');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                division === key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Filter Hardware</h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                Reset
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Search SKU / Model</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ESP32, Pi 5, HC-SR04..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="">All 15 Categories</option>
                {categories
                  .filter((c) => c.enabled)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Brand / Manufacturer</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="">All Brands</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {(division === 'refurbished' || division === 'all') && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Refurbished Condition Grade
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['', 'A', 'B', 'C'].map((g) => (
                    <button
                      key={g || 'all'}
                      type="button"
                      onClick={() => setGradeFilter(g)}
                      className={`py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                        gradeFilter === g
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {g ? `Grade ${g}` : 'Any'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-600">Max Price</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatINR(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={15000}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-700"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>In stock & ready to ship</span>
            </label>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-600 tabular-nums">
              Showing <strong className="text-slate-900">{filtered.length}</strong> components
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="popular">Popularity</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Highest Savings</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <p className="text-base font-semibold text-slate-900">No matching components found</p>
              <p className="text-sm text-slate-500 mt-1">
                Try clearing category or price filters, or search by SKU.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={categoryNameMap[product.categoryId]}
                  isWishlisted={wishlist.includes(product.id)}
                  isCompared={compareList.includes(product.id)}
                  onOpenProduct={(id) => onNavigate({ page: 'product', productId: id })}
                  onAddToCart={onAddToCart}
                  onToggleWishlist={onToggleWishlist}
                  onToggleCompare={onToggleCompare}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  categories: Category[];
  reviews: Review[];
  isWishlisted: boolean;
  isCompared: boolean;
  currentUser: UserAccount | null;
  onNavigate: (r: AppRoute) => void;
  onAddToCart: (p: Product, qty?: number) => void;
  onBuyNow: (p: Product, qty: number) => void;
  onToggleWishlist: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onReviewAdded: (rev: Review) => void;
  onNotify: (msg: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts,
  categories,
  reviews,
  isWishlisted,
  isCompared,
  currentUser,
  onNavigate,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  onToggleCompare,
  onReviewAdded,
  onNotify,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [submittingRev, setSubmittingRev] = useState(false);

  const category = categories.find((c) => c.id === product.categoryId);
  const isRefurb = product.division === 'refurbished';
  const comparePrice = isRefurb && product.newComparisonPrice ? product.newComparisonPrice : product.mrp;
  const isAvailable = product.stock > 0 && product.stockStatus !== 'Under Inspection' && product.stockStatus !== 'Parts Only';

  // Find counterpart (New <-> Refurbished) for direct comparison switching
  const counterparts = allProducts.filter(
    (p) =>
      p.id !== product.id &&
      p.stockStatus !== 'Under Inspection' &&
      p.stockStatus !== 'Parts Only' &&
      (p.id === product.linkedNewProductId || p.linkedNewProductId === product.id)
  );

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const related = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.stockStatus !== 'Under Inspection' &&
        p.stockStatus !== 'Parts Only' &&
        (p.categoryId === product.categoryId || p.division === product.division)
    )
    .slice(0, 3);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revComment.trim()) return;
    setSubmittingRev(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          authorName: currentUser?.name || 'Verified Maker',
          authorRole: currentUser ? `${currentUser.city} Customer` : 'Electronics Engineer',
          rating: revRating,
          title: revTitle || 'Hardware review',
          comment: revComment,
        }),
      });
      if (res.ok) {
        const created = (await res.json()) as Review;
        onReviewAdded(created);
        setRevTitle('');
        setRevComment('');
        onNotify('Review published. Thank you for contributing to KRONTON.');
      }
    } finally {
      setSubmittingRev(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <button
          type="button"
          onClick={() => onNavigate({ page: 'catalog', division: product.division })}
          className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
        <span aria-hidden="true">/</span>
        <span>{category?.name || 'Components'}</span>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900 font-mono truncate">{product.sku}</span>
      </div>

      {/* Main Contiguous Split: Sticky Gallery Left + Contiguous Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <ProductImage
              src={product.images[selectedImage] || product.images[0]}
              alt={product.name}
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex items-center gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 rounded-lg overflow-hidden border transition-all ${
                    selectedImage === i ? 'border-blue-700 ring-2 ring-blue-700/20' : 'border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <ProductImage src={img} alt={`${product.name} view ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs text-slate-500 font-mono">
              {isRefurb
                ? `Refurbished Division · Grade ${product.grade} · Unit ${product.unitId}`
                : product.division === 'kit'
                ? `SMM Kit · ${product.difficultyLevel || 'Curated'} · ${product.modelNumber}`
                : `New Component · ${product.brand} · ${product.modelNumber}`}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5">
              {product.name}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-medium text-slate-900 tabular-nums">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                {product.rating > 0 ? product.rating.toFixed(1) : 'New'}
              </span>
              <span>({product.reviewCount} reviews)</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">SKU: {product.sku}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">HSN: {product.hsnCode}</span>
            </div>
          </div>

          {/* Condition Counterpart Switcher (New vs Refurbished) */}
          {counterparts.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <p className="text-xs font-semibold text-slate-800">
                Available Condition Options for this Model
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 bg-white border-2 border-blue-700 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700">
                    {isRefurb ? `Current: Refurbished Grade ${product.grade}` : 'Current: Brand New'}
                  </p>
                  <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatINR(product.price)}
                  </p>
                </div>
                {counterparts.map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => onNavigate({ page: 'product', productId: alt.id })}
                    className="p-3 text-left bg-white border border-slate-200 hover:border-slate-400 rounded-lg transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-700">
                      {alt.division === 'refurbished'
                        ? `Switch to Refurbished Grade ${alt.grade}`
                        : 'Switch to Brand New'}
                    </p>
                    <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {formatINR(alt.price)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pricing & Tax Block */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {formatINR(product.price)}
              </span>
              {comparePrice > product.price && (
                <>
                  <span className="text-base text-slate-400 line-through font-mono tabular-nums">
                    {formatINR(comparePrice)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    {isRefurb
                      ? `${Math.round(((comparePrice - product.price) / comparePrice) * 100)}% below new price`
                      : `Save ${product.discountPercent}%`}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Inclusive of {product.gstRate}% GST (Tax invoice provided at checkout) ·{' '}
              <span className={isAvailable ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                {isAvailable ? `${product.stock} units available` : product.stockStatus}
              </span>
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{product.shortDescription}</p>

          {/* Quantity & Primary Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  −
                </button>
                <span className="px-4 py-2.5 text-sm font-mono tabular-nums font-semibold">{qty}</span>
                <button
                  type="button"
                  disabled={qty >= product.stock}
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => onAddToCart(product, qty)}
                className="flex-1 min-w-[160px] py-3 px-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => onBuyNow(product, qty)}
                className="flex-1 min-w-[140px] py-3 px-5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Buy Now
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className="px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:border-slate-400 inline-flex items-center gap-1.5"
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-slate-900 text-slate-900' : ''}`} />
                <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleCompare(product.id)}
                className="px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:border-slate-400 inline-flex items-center gap-1.5"
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
                <span>{isCompared ? 'In Compare Matrix' : 'Compare'}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadProductDatasheet(product)}
                className="px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:border-slate-400 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Datasheet</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{product.warranty}</span>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>{product.estimatedDelivery}</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              <span>{product.returnEligible ? '7-Day Tested Return Eligible' : 'Final Sale / Parts'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sections Below Fold */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-slate-900 mb-3">Engineering Overview</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Documentation: {product.datasheetSummary}</span>
            </div>
          </section>

          {/* Refurbished Inspection & Grading Dossier */}
          {isRefurb && (
            <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Refurbishment Lab Inspection Report
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Unit ID: {product.unitId} · Grade {product.grade} · {product.testingStatus}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-800 mb-1">Physical Condition</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{product.physicalCondition}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-800 mb-1">Functional Test Summary</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{product.functionalTestSummary}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-800 mb-1">Known Limitations</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{product.knownLimitations || 'None'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-800 mb-1">Repair & Service Log</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {(product.repairHistory || ['Passed baseline inspection']).map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {product.refurbishmentHistory && product.refurbishmentHistory.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-900 mb-3">Chain of Custody & Lab Pipeline</p>
                  <div className="space-y-2.5">
                    {product.refurbishmentHistory.map((log, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-4 text-xs py-1.5 border-b border-slate-100 last:border-0">
                        <div>
                          <span className="font-semibold text-slate-900">{log.stage}</span>
                          <span className="text-slate-500"> — {log.notes}</span>
                        </div>
                        <span className="text-slate-400 font-mono shrink-0">{log.date} · {log.technician}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SMM Kit BOM */}
          {product.division === 'kit' && product.includedComponents && (
            <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Included SMM Kit Bill of Materials
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {product.documentationSummary}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2.5 pr-4 font-semibold">Component</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Qty</th>
                      <th className="py-2.5 pl-4 font-semibold">Specification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {product.includedComponents.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 pr-4 font-medium text-slate-900">{item.name}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">{item.qty}</td>
                        <td className="py-2.5 pl-4 text-slate-600">{item.spec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {product.intendedApplications && (
                <p className="text-xs text-slate-600 pt-2">
                  <strong className="text-slate-900">Applications:</strong>{' '}
                  {product.intendedApplications.join(' · ')}
                </p>
              )}
            </section>
          )}
        </div>

        {/* Right: Technical Specifications Table */}
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Technical Specifications</h2>
            <dl className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500">Manufacturer</dt>
                <dd className="text-slate-900 font-medium text-right">{product.manufacturer}</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500">Model Number</dt>
                <dd className="text-slate-900 font-mono text-right">{product.modelNumber}</dd>
              </div>
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">{key}</dt>
                  <dd className="text-slate-900 font-mono text-right">{val}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Customer Reviews & Form */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Customer Reviews ({productReviews.length})
            </h2>

            {productReviews.length === 0 ? (
              <p className="text-xs text-slate-500">No reviews yet for this SKU. Share your lab experience below.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {productReviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{rev.authorName}</span>
                      <span className="text-slate-400 font-mono">{rev.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 my-1">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{rev.title}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-900">Write a Technical Review</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600">Rating:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRevRating(n)}
                    className={`px-2 py-1 rounded border text-xs font-mono ${
                      revRating >= n ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    {n}★
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={revTitle}
                onChange={(e) => setRevTitle(e.target.value)}
                placeholder="Review headline"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <textarea
                rows={3}
                required
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                placeholder="Share build quality, test stability, or kit completeness..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={submittingRev}
                className="px-4 py-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Submit Review
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-14 pt-10 border-t border-slate-200">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-6">Related Hardware</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                categoryName={categories.find((c) => c.id === p.categoryId)?.name}
                isWishlisted={false}
                isCompared={false}
                onOpenProduct={(id) => onNavigate({ page: 'product', productId: id })}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

interface CompareViewProps {
  products: Product[];
  compareIds: string[];
  onRemoveCompare: (id: string) => void;
  onAddToCart: (p: Product) => void;
  onNavigate: (r: AppRoute) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  products,
  compareIds,
  onRemoveCompare,
  onAddToCart,
  onNavigate,
}) => {
  const items = products.filter((p) => compareIds.includes(p.id));
  const specKeys = Array.from(new Set(items.flatMap((p) => Object.keys(p.specifications))));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Component Comparison Matrix
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Compare specifications, refurbished grades, warranty coverage, and pricing side by side.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate({ page: 'catalog', division: 'all' })}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
        >
          Browse More Components
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-12 text-center">
          <GitCompareArrows className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-900">No components selected for comparison</p>
          <p className="text-sm text-slate-500 mt-1">
            Click the Compare icon on any New, Refurbished, or SMM Kit listing to evaluate specs side-by-side.
          </p>
        </div>
      ) : (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 text-xs font-semibold text-slate-500 w-48 align-top">Attribute</th>
                {items.map((item) => (
                  <th key={item.id} className="p-4 align-top w-64">
                    <div className="space-y-2">
                      <div className="w-32 rounded-lg overflow-hidden border border-slate-200">
                        <ProductImage src={item.images[0]} alt={item.name} />
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate({ page: 'product', productId: item.id })}
                        className="text-sm font-semibold text-slate-900 hover:text-blue-700 text-left line-clamp-2"
                      >
                        {item.name}
                      </button>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onAddToCart(item)}
                          disabled={item.stock <= 0}
                          className="px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded-md hover:bg-blue-800 disabled:opacity-40"
                        >
                          Add to Cart
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveCompare(item.id)}
                          className="text-xs text-slate-500 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="p-4 font-medium text-slate-500">Division & Condition</td>
                {items.map((p) => (
                  <td key={p.id} className="p-4 font-semibold text-slate-900">
                    {p.division === 'refurbished' ? `Refurbished · Grade ${p.grade}` : p.division === 'kit' ? 'SMM Kit' : 'Brand New'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-500">Selling Price (INR)</td>
                {items.map((p) => (
                  <td key={p.id} className="p-4 font-mono tabular-nums font-bold text-slate-900">
                    {formatINR(p.price)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-500">MRP / New Reference</td>
                {items.map((p) => (
                  <td key={p.id} className="p-4 font-mono tabular-nums text-slate-500">
                    {formatINR(p.newComparisonPrice || p.mrp)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-500">Warranty</td>
                {items.map((p) => (
                  <td key={p.id} className="p-4 text-slate-700">
                    {p.warranty}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-500">Availability</td>
                {items.map((p) => (
                  <td key={p.id} className="p-4 text-slate-700 tabular-nums">
                    {p.stock > 0 ? `${p.stock} in stock` : p.stockStatus}
                  </td>
                ))}
              </tr>
              {specKeys.map((key) => (
                <tr key={key}>
                  <td className="p-4 font-medium text-slate-500">{key}</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-4 font-mono text-slate-700">
                      {p.specifications[key] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
