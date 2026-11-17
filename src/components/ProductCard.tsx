import React from 'react';
import { GitCompareArrows, Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { formatINR, ProductImage } from '../utils/format';

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  isWishlisted: boolean;
  isCompared: boolean;
  onOpenProduct: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onToggleCompare: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryName,
  isWishlisted,
  isCompared,
  onOpenProduct,
  onAddToCart,
  onToggleWishlist,
  onToggleCompare,
}) => {
  const isRefurb = product.division === 'refurbished';
  const isKit = product.division === 'kit';
  const comparePrice = isRefurb && product.newComparisonPrice ? product.newComparisonPrice : product.mrp;
  const isAvailable = product.stock > 0 && product.stockStatus !== 'Under Inspection' && product.stockStatus !== 'Parts Only';

  const kicker = isRefurb
    ? `Refurbished · Grade ${product.grade || 'A'} · ${product.testingStatus || 'Tested'}`
    : isKit
    ? `SMM Kit · ${product.difficultyLevel || 'Curated'} · ${product.includedComponents?.length || 6} Modules`
    : `${categoryName || 'New Component'} · ${product.brand}`;

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300">
      <div
        onClick={() => onOpenProduct(product.id)}
        className="relative cursor-pointer bg-slate-100 border-b border-slate-100"
      >
        <ProductImage src={product.images[0]} alt={product.name} />
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product.id);
            }}
            title={isCompared ? 'Remove from comparison' : 'Compare specification'}
            aria-label={isCompared ? 'Remove from comparison' : 'Compare specification'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
              isCompared
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white/95 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            <GitCompareArrows className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
              isWishlisted
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white/95 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 truncate mb-1.5">{kicker}</p>
          <h3
            onClick={() => onOpenProduct(product.id)}
            className="text-base font-semibold text-slate-900 leading-snug line-clamp-2 cursor-pointer hover:text-blue-700 transition-colors"
          >
            {product.name}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums">
            {isRefurb && product.unitId ? `Unit ${product.unitId}` : `SKU ${product.sku}`}
            {' · '}
            {product.warranty}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {formatINR(product.price)}
              </span>
              {comparePrice > product.price && (
                <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                  {formatINR(comparePrice)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
              {comparePrice > product.price
                ? `Save ${Math.round(((comparePrice - product.price) / comparePrice) * 100)}%`
                : 'Incl. 18% GST'}
              {' · '}
              <span className={isAvailable ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                {isAvailable ? `${product.stock} in stock` : product.stockStatus}
              </span>
            </p>
          </div>

          <button
            type="button"
            disabled={!isAvailable}
            onClick={() => onAddToCart(product)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              isAvailable
                ? 'bg-slate-900 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isAvailable ? 'Add' : 'Unavailable'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
