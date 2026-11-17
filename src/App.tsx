import React, { useCallback, useEffect, useState } from 'react';
import { Category, HomepageConfig, Order, Product, Review, UserAccount } from './types';
import { SEED_DB } from './data/seedData';
import { AppRoute, CartDrawer, CartLine, Footer, Header } from './components/NavbarAndFooter';
import { HomeView } from './components/HomeView';
import { CatalogView, CompareView, ProductDetailView } from './components/CatalogAndDetailViews';
import { BuybackView } from './components/BuybackView';
import { AccountView, CheckoutView, SupportAndPolicyView } from './components/CheckoutAndAccountViews';
import { AdminDashboardView } from './components/AdminDashboardView';

export default function App() {
  const [route, setRoute] = useState<AppRoute>({ page: 'home' });
  const [categories, setCategories] = useState<Category[]>(SEED_DB.categories);
  const [products, setProducts] = useState<Product[]>(SEED_DB.products);
  const [reviews, setReviews] = useState<Review[]>(SEED_DB.reviews);
  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig>(SEED_DB.homepageConfig);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const saved = localStorage.getItem('kronton_cart');
      return saved ? (JSON.parse(saved) as CartLine[]) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kronton_wishlist');
      return saved ? (JSON.parse(saved) as string[]) : ['prod-ref-rpi5-a', 'prod-kit-iot'];
    } catch {
      return [];
    }
  });

  const [compareList, setCompareList] = useState<string[]>(['prod-new-rpi5', 'prod-ref-rpi5-a']);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('kronton_user');
      return saved ? (JSON.parse(saved) as UserAccount) : null;
    } catch {
      return null;
    }
  });

  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  const fetchBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
        setProducts(data.products);
        setReviews(data.reviews);
        setHomepageConfig(data.homepageConfig);
      }
    } catch {
      // Fallback to seeded data if offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  useEffect(() => {
    localStorage.setItem('kronton_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('kronton_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kronton_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kronton_user');
    }
  }, [currentUser]);

  const navigate = useCallback((next: AppRoute) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddToCart = (product: Product, qty = 1) => {
    if (product.stock <= 0) {
      notify('This item is currently out of stock.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.qty + qty);
        return prev.map((l) => (l.product.id === product.id ? { ...l, product, qty: nextQty } : l));
      }
      return [...prev, { product, qty: Math.min(product.stock, qty) }];
    });
    setCartOpen(true);
    notify(`Added ${product.name} to cart.`);
  };

  const handleBuyNow = (product: Product, qty: number) => {
    handleAddToCart(product, qty);
    setCartOpen(false);
    navigate({ page: 'checkout' });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === productId
            ? { ...l, qty: Math.min(l.product.stock, Math.max(0, l.qty + delta)) }
            : l
        )
        .filter((l) => l.qty > 0)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      notify(exists ? 'Removed from wishlist.' : 'Saved to wishlist.');
      return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
    });
  };

  const handleToggleCompare = (productId: string) => {
    setCompareList((prev) => {
      if (prev.includes(productId)) {
        notify('Removed from comparison matrix.');
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        notify('You can compare up to 4 components at once.');
        return prev;
      }
      notify('Added to component comparison matrix.');
      return [...prev, productId];
    });
  };

  const handleOrderPlaced = async (_order: Order) => {
    setCart([]);
    await fetchBootstrap();
  };

  const activeProduct =
    route.page === 'product' ? products.find((p) => p.id === route.productId) || products[0] : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        route={route}
        config={homepageConfig}
        cart={cart}
        wishlistCount={wishlist.length}
        compareCount={compareList.length}
        currentUser={currentUser}
        products={products}
        categories={categories}
        onNavigate={navigate}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="flex-1">
        {loading && products.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-sm text-slate-500">
            Loading KRONTON electronics catalog...
          </div>
        ) : route.page === 'home' ? (
          <HomeView
            config={homepageConfig}
            categories={categories}
            products={products}
            reviews={reviews}
            wishlist={wishlist}
            compareList={compareList}
            onNavigate={navigate}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onToggleWishlist={handleToggleWishlist}
            onToggleCompare={handleToggleCompare}
          />
        ) : route.page === 'catalog' ? (
          <CatalogView
            key={`${route.division || 'all'}-${route.categoryId || ''}-${route.query || ''}`}
            products={products}
            categories={categories}
            initialDivision={route.division}
            initialCategoryId={route.categoryId}
            initialQuery={route.query}
            wishlist={wishlist}
            compareList={compareList}
            onNavigate={navigate}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onToggleWishlist={handleToggleWishlist}
            onToggleCompare={handleToggleCompare}
          />
        ) : route.page === 'product' && activeProduct ? (
          <ProductDetailView
            key={activeProduct.id}
            product={activeProduct}
            allProducts={products}
            categories={categories}
            reviews={reviews}
            isWishlisted={wishlist.includes(activeProduct.id)}
            isCompared={compareList.includes(activeProduct.id)}
            currentUser={currentUser}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onToggleWishlist={handleToggleWishlist}
            onToggleCompare={handleToggleCompare}
            onReviewAdded={(rev) => {
              setReviews((prev) => [rev, ...prev]);
              fetchBootstrap();
            }}
            onNotify={notify}
          />
        ) : route.page === 'compare' ? (
          <CompareView
            products={products}
            compareIds={compareList}
            onRemoveCompare={(id) => setCompareList((prev) => prev.filter((x) => x !== id))}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onNavigate={navigate}
          />
        ) : route.page === 'buyback' ? (
          <BuybackView
            key={`${route.initialTab || 'sell'}-${route.trackId || ''}`}
            categories={categories}
            currentUser={currentUser}
            initialTab={route.initialTab}
            initialTrackId={route.trackId}
            onNotify={notify}
          />
        ) : route.page === 'checkout' ? (
          <CheckoutView
            cart={cart}
            currentUser={currentUser}
            onOrderPlaced={handleOrderPlaced}
            onNavigate={navigate}
            onNotify={notify}
          />
        ) : route.page === 'account' ? (
          <AccountView
            currentUser={currentUser}
            products={products}
            wishlist={wishlist}
            initialTab={route.tab}
            onLogin={(u) => {
              setCurrentUser(u);
              notify(`Signed in as ${u.name}.`);
            }}
            onLogout={() => {
              setCurrentUser(null);
              notify('Signed out of KRONTON.');
            }}
            onNavigate={navigate}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onToggleWishlist={handleToggleWishlist}
            onNotify={notify}
          />
        ) : route.page === 'support' ? (
          <SupportAndPolicyView
            key={`${route.doc || 'track'}-${route.trackOrderId || ''}`}
            initialDoc={route.doc}
            initialOrderId={route.trackOrderId}
            onNotify={notify}
          />
        ) : route.page === 'admin' ? (
          <AdminDashboardView
            products={products}
            categories={categories}
            homepageConfig={homepageConfig}
            onRefreshBootstrap={fetchBootstrap}
            onNavigate={navigate}
            onNotify={notify}
          />
        ) : null}
      </main>

      <Footer onNavigate={navigate} onNotify={notify} />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setCartOpen(false);
          navigate({ page: 'checkout' });
        }}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-700 max-w-sm"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
