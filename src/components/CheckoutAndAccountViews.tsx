import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  LogOut,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { BuybackRequest, Order, Product, UserAccount } from '../types';
import { formatINR, ProductImage } from '../utils/format';
import { AppRoute, CartLine } from './NavbarAndFooter';

interface CheckoutViewProps {
  cart: CartLine[];
  currentUser: UserAccount | null;
  onOrderPlaced: (order: Order) => void;
  onNavigate: (r: AppRoute) => void;
  onNotify: (msg: string) => void;
}

const INDIAN_STATES = [
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Delhi NCR',
  'Telangana',
  'Gujarat',
  'Kerala',
  'West Bengal',
  'Uttar Pradesh',
  'Rajasthan',
  'Punjab',
  'Haryana',
];

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  currentUser,
  onOrderPlaced,
  onNavigate,
  onNotify,
}) => {
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.mobile || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [stateName, setStateName] = useState(currentUser?.state || 'Karnataka');
  const [pinCode, setPinCode] = useState(currentUser?.pinCode || '');
  const [gstin, setGstin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card / NetBanking' | 'Cash on Delivery (COD)'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const subtotal = cart.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const shippingFee = subtotal >= 1499 || subtotal === 0 ? 0 : 79;
  const gstIncluded = Math.round((subtotal * 18) / 118);
  const total = subtotal + shippingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          customerName,
          email,
          phone,
          address,
          city,
          state: stateName,
          pinCode,
          gstin: gstin.trim() || undefined,
          paymentMethod,
          items: cart.map(({ product, qty }) => ({
            productId: product.id,
            name: product.name,
            sku: product.sku,
            division: product.division,
            unitId: product.unitId,
            grade: product.grade,
            price: product.price,
            qty,
            gstRate: product.gstRate,
            imageUrl: product.images[0],
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Could not place order.');
        return;
      }
      setConfirmedOrder(data as Order);
      onOrderPlaced(data as Order);
      onNotify(`Order ${data.orderId} confirmed!`);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-700 shrink-0" />
            <div>
              <p className="text-xs font-mono text-slate-500">Order Confirmed · {confirmedOrder.paymentStatus}</p>
              <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
                Order #{confirmedOrder.orderId} Confirmed — Preparing Shipment
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Dispatching to {confirmedOrder.customerName}, {confirmedOrder.city}, {confirmedOrder.state} ({confirmedOrder.pinCode}).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-900">GST Tax Invoice Summary</h2>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {confirmedOrder.items.map((item, i) => (
                <div key={i} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-slate-500 font-mono">
                      {item.sku} {item.unitId ? `· Unit ${item.unitId}` : ''} · Qty {item.qty}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {formatINR(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value + Included 18% GST ({formatINR(confirmedOrder.gstAmount)})</span>
                <span className="font-mono tabular-nums">{formatINR(confirmedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ESD Courier Shipping</span>
                <span className="font-mono tabular-nums">
                  {confirmedOrder.shippingFee === 0 ? 'Free' : formatINR(confirmedOrder.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Payable ({confirmedOrder.paymentMethod})</span>
                <span className="font-mono tabular-nums">{formatINR(confirmedOrder.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate({ page: 'support', doc: 'track', trackOrderId: confirmedOrder.orderId })}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg"
            >
              Track Shipment Live
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ page: 'catalog', division: 'all' })}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-10">
          <p className="text-lg font-bold text-slate-900">Your cart is empty</p>
          <p className="text-sm text-slate-500 mt-1">Add components before proceeding to checkout.</p>
          <button
            type="button"
            onClick={() => onNavigate({ page: 'catalog', division: 'all' })}
            className="mt-5 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg"
          >
            Explore Components
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
        Checkout & GST Order Summary
      </h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900">1. Shipping & Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email for GST Invoice *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">6-Digit PIN Code *</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="560038"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Building, street, landmark"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">State *</label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company GSTIN (Optional)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900">2. Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['UPI', 'Card / NetBanking', 'Cash on Delivery (COD)'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3.5 text-left rounded-lg border text-xs transition-colors ${
                    paymentMethod === method
                      ? 'border-blue-700 bg-blue-50/50 text-slate-900 font-semibold'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === 'UPI' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">UPI ID / VPA</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okhdfcbank"
                  className="w-full sm:w-72 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
              </div>
            )}

            {paymentMethod === 'Cash on Delivery (COD)' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                Pay <strong className="font-mono text-slate-900">{formatINR(total)}</strong> via cash or UPI QR at delivery. Free Pan-India delivery applies automatically above ₹1,499.
              </div>
            )}
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 sticky top-24">
            <h2 className="font-display text-base font-bold text-slate-900">Order Summary</h2>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {cart.map(({ product, qty }) => (
                <div key={product.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{product.name}</p>
                    <p className="text-slate-500 font-mono">
                      Qty {qty} × {formatINR(product.price)}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                    {formatINR(product.price * qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Incl. {formatINR(gstIncluded)} GST)</span>
                <span className="font-mono tabular-nums">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ESD Courier Shipping</span>
                <span className="font-mono tabular-nums">
                  {shippingFee === 0 ? 'Free' : formatINR(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Payable</span>
                <span className="font-mono tabular-nums">{formatINR(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Confirming Order...' : `Confirm & Place Order · ${formatINR(total)}`}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
};

interface AccountViewProps {
  currentUser: UserAccount | null;
  products: Product[];
  wishlist: string[];
  initialTab?: 'orders' | 'buybacks' | 'wishlist' | 'profile';
  onLogin: (u: UserAccount) => void;
  onLogout: () => void;
  onNavigate: (r: AppRoute) => void;
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => void;
  onNotify: (msg: string) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  products,
  wishlist,
  initialTab = 'orders',
  onLogin,
  onLogout,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
  onNotify,
}) => {
  const [tab, setTab] = useState<'orders' | 'buybacks' | 'wishlist' | 'profile'>(initialTab);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regCity, setRegCity] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [buybacks, setBuybacks] = useState<BuybackRequest[]>([]);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/orders?email=${encodeURIComponent(currentUser.email)}`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => {});
    fetch(`/api/buybacks?email=${encodeURIComponent(currentUser.email)}`)
      .then((r) => r.json())
      .then(setBuybacks)
      .catch(() => {});
  }, [currentUser]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Account not found');
        return;
      }
      onLogin(data as UserAccount);
    } else {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: emailInput,
          mobile: regMobile,
          city: regCity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Registration failed');
        return;
      }
      onLogin(data as UserAccount);
    }
  };

  const quickLogin = async (role: 'customer' | 'admin') => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        role === 'admin' ? { role: 'admin' } : { email: 'arjun.mehta@example.in' }
      ),
    });
    if (res.ok) {
      const user = (await res.json()) as UserAccount;
      onLogin(user);
      if (user.role === 'admin') {
        onNavigate({ page: 'admin' });
      }
    }
  };

  const handleRequestReturn = async (orderId: string) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: returnReason }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Order;
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? updated : o)));
      setReturnOrderId(null);
      setReturnReason('');
      onNotify(`Return request logged for ${orderId}.`);
    }
  };

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              {authMode === 'login' ? 'Sign in to KRONTON' : 'Create Customer Account'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage orders, GST invoices, component buybacks, and saved wishlists.
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-lg w-full">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md ${
                authMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md ${
                authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="arjun.mehta@example.in"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            <p className="text-xs text-slate-500">Quick Evaluation Access</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('customer')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Demo Customer
              </button>
              <button
                type="button"
                onClick={() => quickLogin('admin')}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                Operations Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Customer Dashboard</p>
          <h1 className="font-display text-2xl font-bold text-slate-900">{currentUser.name}</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {currentUser.email} · {currentUser.city}, {currentUser.state}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate({ page: 'admin' })}
              className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
            >
              Open Admin Console
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
        {(
          [
            ['orders', `My Orders (${orders.length})`],
            ['buybacks', `My Buyback Requests (${buybacks.length})`],
            ['wishlist', `Wishlist (${wishlistProducts.length})`],
            ['profile', 'Address & Profile'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">No orders placed yet</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.orderId} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-mono text-slate-500">{ord.orderId}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {ord.orderStatus} · {ord.paymentMethod} ({ord.paymentStatus})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                      {formatINR(ord.total)}
                    </span>
                    {ord.orderStatus !== 'Return Requested' && (
                      <button
                        type="button"
                        onClick={() => setReturnOrderId(ord.orderId)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-500"
                      >
                        Request Return
                      </button>
                    )}
                  </div>
                </div>

                {returnOrderId === ord.orderId && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="Describe issue (e.g. DOA board, damaged pin)"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRequestReturn(ord.orderId)}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                    >
                      Submit Return
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-slate-700">
                          {it.qty}x {it.name}
                        </span>
                        <span className="font-mono tabular-nums text-slate-900">{formatINR(it.price * it.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5 border-l border-slate-100 pl-4">
                    {ord.trackingTimeline.map((t, i) => (
                      <div key={i} className="flex justify-between text-slate-600">
                        <span className="font-medium text-slate-800">{t.status}</span>
                        <span className="font-mono text-slate-400">{t.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'buybacks' && (
        <div className="space-y-4">
          {buybacks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm font-semibold text-slate-900">No buyback submissions found</p>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'buyback', initialTab: 'sell' })}
                className="mt-4 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
              >
                Sell Unused Components
              </button>
            </div>
          ) : (
            buybacks.map((b) => (
              <div key={b.requestId} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-mono text-slate-500">
                    {b.requestId} · {b.status}
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{b.productName}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {b.condition} · Qty {b.quantity} · Payout: {b.payoutMethod}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Offer</p>
                    <p className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                      {b.finalOffer ? formatINR(b.finalOffer) : b.estimatedOffer ? `Est. ${formatINR(b.estimatedOffer)}` : 'Evaluating'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'buyback', initialTab: 'track', trackId: b.requestId })}
                    className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                  >
                    View & Respond
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'wishlist' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wishlistProducts.length === 0 ? (
            <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl p-10 text-center">
              <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">Your wishlist is empty</p>
            </div>
          ) : (
            wishlistProducts.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <ProductImage src={p.images[0]} alt={p.name} />
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">{p.name}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono font-bold text-slate-900">{formatINR(p.price)}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onAddToCart(p)}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleWishlist(p.id)}
                      className="px-2.5 py-1.5 border border-slate-200 text-xs rounded-lg text-slate-500 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl space-y-3 text-xs">
          <h2 className="font-display text-base font-bold text-slate-900">Saved Delivery Profile</h2>
          <p><strong className="text-slate-700">Name:</strong> {currentUser.name}</p>
          <p><strong className="text-slate-700">Email:</strong> {currentUser.email}</p>
          <p><strong className="text-slate-700">Mobile:</strong> {currentUser.mobile}</p>
          <p><strong className="text-slate-700">Address:</strong> {currentUser.address}, {currentUser.city}, {currentUser.state} — {currentUser.pinCode}</p>
        </div>
      )}
    </div>
  );
};

interface SupportAndPolicyViewProps {
  initialDoc?: string;
  initialOrderId?: string;
  onNotify: (msg: string) => void;
}

const POLICY_CONTENT: Record<string, { title: string; sections: [string, string][] }> = {
  about: {
    title: 'About KRONTON',
    sections: [
      ['Our Mission', 'KRONTON is India’s unified electronics components marketplace and circular refurbishment lab, serving makers, universities, robotics clubs, and R&D laboratories.'],
      ['Three Core Divisions', 'We operate New Electronic Components, Lab-Tested Refurbished Components (Grades A, B, and C at 50%–70% of new prices), and curated SMM Kits alongside direct Customer Buyback.'],
    ],
  },
  'refurbished-policy': {
    title: 'Refurbished Product & Grading Policy',
    sections: [
      ['15-Point Lab Qualification', 'No previously owned hardware is listed for resale without passing physical inspection, electrical rail checks, functional bench testing, and ultrasonic cleaning.'],
      ['Standardized Condition Grades', 'Grade A (~70% of new price): minimal wear, full functionality. Grade B (~60%): light cosmetic scuffs, 100% functional. Grade C (~50%): visible wear with explicit limitation disclosure. Grade D is strictly withheld for parts/repair and never marketed as functional.'],
    ],
  },
  'buyback-terms': {
    title: 'Buyback Terms & Conditions',
    sections: [
      ['Ownership & Authenticity', 'Sellers must legally own submitted hardware and provide accurate defect disclosures. Counterfeit or unlawfully acquired electronics are rejected.'],
      ['Valuation & Rejection', 'Initial estimates are contingent upon physical bench inspection at KRONTON Bengaluru Lab. If a seller declines the final post-inspection offer, KRONTON ships the hardware back to the pickup address.'],
    ],
  },
  warranty: {
    title: 'Warranty Policy',
    sections: [
      ['New Components', 'Covered by 6 to 12-month manufacturer or KRONTON replacement warranty against manufacturing defects.'],
      ['Refurbished Components', 'Every Grade A/B/C refurbished unit carries a unit-serialized 3 to 6-month KRONTON functional warranty attached directly to its Unit ID.'],
    ],
  },
  shipping: {
    title: 'Pan-India Shipping Policy',
    sections: [
      ['ESD-Safe Dispatch', 'All microcontrollers, ICs, and refurbished boards are sealed in anti-static ESD bags and cushioned cartons before dispatch from Bengaluru.'],
      ['Rates & Delivery Windows', 'Free shipping across India on orders of ₹1,499 and above (₹79 flat rate below). Standard metro delivery takes 2–4 business days.'],
    ],
  },
  returns: {
    title: 'Return & Refund Policy',
    sections: [
      ['7-Day Testing Window', 'Eligible new, refurbished, and SMM kit items can be returned within 7 days of delivery if DOA or mismatched from declared grade.'],
      ['Restocking Protocol', 'Returned refurbished units undergo re-inspection in our lab before returning to sellable stock.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy & Terms of Service',
    sections: [
      ['Data Stewardship', 'Customer contact details, GSTINs, and buyback records are used strictly for order fulfillment, tax invoicing, and reverse logistics.'],
      ['Platform Terms', 'All prices on KRONTON are displayed in Indian Rupees (INR) inclusive of applicable GST unless stated otherwise.'],
    ],
  },
  faqs: {
    title: 'Frequently Asked Questions',
    sections: [
      ['Are refurbished boards tested before shipping?', 'Yes. Every refurbished unit has an individual Unit ID and documented functional test summary (e.g., voltage rails, GPIO continuity, thermal run).'],
      ['How long does buyback payout take?', 'UPI and IMPS payouts are processed same-day once you accept the final post-inspection offer.'],
      ['Do you provide GST invoices for colleges and companies?', 'Yes. Enter your company GSTIN at checkout to receive a compliant HSN tax invoice.'],
    ],
  },
};

export const SupportAndPolicyView: React.FC<SupportAndPolicyViewProps> = ({
  initialDoc = 'track',
  initialOrderId = '',
  onNotify,
}) => {
  const [activeDoc, setActiveDoc] = useState(initialDoc);
  const [orderQuery, setOrderQuery] = useState(initialOrderId || 'KRN-ORD-2026-1042');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [orderErr, setOrderErr] = useState('');

  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tRef, setTRef] = useState('');
  const [tSubject, setTSubject] = useState('');
  const [tMsg, setTMsg] = useState('');

  const lookupOrder = async (id: string) => {
    const clean = id.trim();
    if (!clean) return;
    setOrderErr('');
    const res = await fetch(`/api/orders/${encodeURIComponent(clean)}`);
    if (!res.ok) {
      setTrackedOrder(null);
      setOrderErr(`Order "${clean}" not found.`);
      return;
    }
    setTrackedOrder((await res.json()) as Order);
  };

  useEffect(() => {
    if (activeDoc === 'track' && orderQuery) {
      lookupOrder(orderQuery);
    }
  }, [activeDoc]);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tName,
        email: tEmail,
        orderOrBuybackId: tRef || undefined,
        subject: tSubject,
        message: tMsg,
      }),
    });
    if (res.ok) {
      const tkt = await res.json();
      setTName('');
      setTEmail('');
      setTRef('');
      setTSubject('');
      setTMsg('');
      onNotify(`Support ticket ${tkt.id} created. Our Bengaluru team will reply shortly.`);
    }
  };

  const policy = POLICY_CONTENT[activeDoc];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          {[
            ['track', 'Order Tracking'],
            ['contact', 'Contact & Support Ticket'],
            ['about', 'About KRONTON'],
            ['faqs', 'FAQs'],
            ['refurbished-policy', 'Refurbished Product Policy'],
            ['buyback-terms', 'Buyback Terms & Conditions'],
            ['warranty', 'Warranty Policy'],
            ['shipping', 'Shipping Policy'],
            ['returns', 'Return & Refund Policy'],
            ['privacy', 'Privacy Policy & Terms'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveDoc(key)}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeDoc === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </aside>

      <div className="lg:col-span-9">
        {activeDoc === 'track' ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">Track Your KRONTON Order</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Try sample Order ID:{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setOrderQuery('KRN-ORD-2026-1042');
                      lookupOrder('KRN-ORD-2026-1042');
                    }}
                    className="font-mono text-blue-700 underline"
                  >
                    KRN-ORD-2026-1042
                  </button>
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  lookupOrder(orderQuery);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  placeholder="KRN-ORD-2026-XXXX"
                  className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Track</span>
                </button>
              </form>
            </div>

            {orderErr && <p className="text-xs text-rose-600">{orderErr}</p>}

            {trackedOrder && (
              <div className="pt-6 border-t border-slate-200 space-y-6">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-slate-500">{trackedOrder.orderId}</p>
                    <h2 className="text-lg font-bold text-slate-900">
                      Status: {trackedOrder.orderStatus}
                    </h2>
                    <p className="text-xs text-slate-600">
                      {trackedOrder.customerName} · {trackedOrder.city}, {trackedOrder.state} {trackedOrder.pinCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Order Total</p>
                    <p className="text-lg font-bold font-mono tabular-nums text-slate-900">
                      {formatINR(trackedOrder.total)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {trackedOrder.trackingTimeline.map((step, i) => (
                    <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Truck className="w-4 h-4 text-blue-700" />
                        <div>
                          <span className="font-semibold text-slate-900">{step.status}</span>
                          <span className="text-slate-500"> — {step.location}</span>
                        </div>
                      </div>
                      <span className="font-mono text-slate-400">{step.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeDoc === 'contact' ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">Contact KRONTON Support</h1>
              <p className="text-xs text-slate-500 mt-1">
                Peenya Industrial Area, Bengaluru · Mon–Sat 9:30 AM – 6:30 PM IST · support@kronton.in
              </p>
            </div>
            <form onSubmit={submitTicket} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Your Name *"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Address *"
                  value={tEmail}
                  onChange={(e) => setTEmail(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Order or Buyback ID (Optional)"
                  value={tRef}
                  onChange={(e) => setTRef(e.target.value)}
                  className="px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="Subject *"
                  value={tSubject}
                  onChange={(e) => setTSubject(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <textarea
                rows={4}
                required
                placeholder="Describe your technical, shipping, warranty, or buyback inquiry..."
                value={tMsg}
                onChange={(e) => setTMsg(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg"
              >
                Submit Support Ticket
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>KRONTON Policy & Documentation</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{policy?.title}</h1>
            <div className="space-y-6 pt-2">
              {policy?.sections.map(([heading, body]) => (
                <div key={heading} className="pb-5 border-b border-slate-100 last:border-0">
                  <h2 className="text-sm font-semibold text-slate-900 mb-1.5">{heading}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
