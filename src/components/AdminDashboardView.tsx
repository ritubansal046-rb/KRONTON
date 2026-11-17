import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Layers,
  LayoutDashboard,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Wrench,
} from 'lucide-react';
import {
  BuybackRequest,
  Category,
  HomepageConfig,
  Order,
  Product,
  ProductDivision,
  RefurbishedGrade,
  RefurbishmentStage,
} from '../types';
import { formatINR } from '../utils/format';
import { AppRoute } from './NavbarAndFooter';

interface AdminDashboardViewProps {
  products: Product[];
  categories: Category[];
  homepageConfig: HomepageConfig;
  onRefreshBootstrap: () => Promise<void>;
  onNavigate: (r: AppRoute) => void;
  onNotify: (msg: string) => void;
}

type AdminSection = 'overview' | 'inventory' | 'refurbishment' | 'categories' | 'buybacks' | 'orders' | 'cms';

const REFURB_STAGES: RefurbishmentStage[] = [
  'Product Acquisition',
  'Receiving',
  'Unique ID Assigned',
  'Physical Inspection',
  'Electrical Inspection',
  'Functional Testing',
  'Fault Identification',
  'Approved Repair',
  'Cleaning',
  'Final Functional Testing',
  'Condition Grading',
  'Photography',
  'Pricing Approval',
  'Inventory Approval',
  'Published',
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  products,
  categories,
  homepageConfig,
  onRefreshBootstrap,
  onNavigate,
  onNotify,
}) => {
  const [section, setSection] = useState<AdminSection>('overview');
  const [buybacks, setBuybacks] = useState<BuybackRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // New Product Form
  const [showAddProd, setShowAddProd] = useState(false);
  const [pName, setPName] = useState('');
  const [pDiv, setPDiv] = useState<ProductDivision>('new');
  const [pCat, setPCat] = useState(categories[0]?.id || 'cat-mcu');
  const [pBrand, setPBrand] = useState('KRONTON');
  const [pPrice, setPPrice] = useState('499');
  const [pMrp, setPMrp] = useState('699');
  const [pStock, setPStock] = useState('25');
  const [pGrade, setPGrade] = useState<RefurbishedGrade>('A');

  // New Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Refurbishment Pipeline Editor
  const [selectedRefurbId, setSelectedRefurbId] = useState<string>('');
  const [rfStage, setRfStage] = useState<RefurbishmentStage>('Final Functional Testing');
  const [rfGrade, setRfGrade] = useState<RefurbishedGrade>('A');
  const [rfPrice, setRfPrice] = useState('');
  const [rfNotes, setRfNotes] = useState('');

  // Buyback Evaluator State
  const [activeBuyback, setActiveBuyback] = useState<BuybackRequest | null>(null);
  const [estOffer, setEstOffer] = useState('');
  const [finOffer, setFinOffer] = useState('');
  const [bbNote, setBbNote] = useState('');

  // CMS State
  const [cms, setCms] = useState<HomepageConfig>(homepageConfig);

  const loadAdminQueues = async () => {
    const [bRes, oRes] = await Promise.all([fetch('/api/buybacks'), fetch('/api/orders')]);
    if (bRes.ok) setBuybacks(await bRes.json());
    if (oRes.ok) setOrders(await oRes.json());
  };

  useEffect(() => {
    loadAdminQueues();
  }, []);

  const refurbUnits = products.filter((p) => p.division === 'refurbished');
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: pName,
        division: pDiv,
        categoryId: pCat,
        brand: pBrand,
        price: Number(pPrice),
        mrp: Number(pMrp),
        stock: Number(pStock),
        grade: pDiv === 'refurbished' ? pGrade : undefined,
        newComparisonPrice: pDiv === 'refurbished' ? Number(pMrp) : undefined,
      }),
    });
    if (res.ok) {
      setShowAddProd(false);
      setPName('');
      await onRefreshBootstrap();
      onNotify('Component added to KRONTON catalog.');
    }
  };

  const handleInlinePriceUpdate = async (prod: Product, newPrice: number) => {
    const res = await fetch(`/api/products/${prod.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: newPrice }),
    });
    if (res.ok) {
      await onRefreshBootstrap();
      onNotify(`Updated selling price for ${prod.sku} to ${formatINR(newPrice)}.`);
    }
  };

  const handleAdvanceRefurb = async (publish: boolean) => {
    if (!selectedRefurbId) return;
    const res = await fetch(`/api/refurbished/${selectedRefurbId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: rfStage,
        grade: rfGrade,
        price: rfPrice ? Number(rfPrice) : undefined,
        technician: 'Lab Lead (Admin)',
        notes: rfNotes || `Stage updated to ${rfStage}`,
        publish,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onNotify(data.error || 'Unable to advance refurbishment unit.');
      return;
    }
    setRfNotes('');
    await onRefreshBootstrap();
    onNotify(publish ? 'Unit passed inspection and published to Refurbished Store!' : 'Refurbishment log updated.');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName, description: catDesc }),
    });
    if (res.ok) {
      setCatName('');
      setCatDesc('');
      await onRefreshBootstrap();
      onNotify('Category created.');
    }
  };

  const handleToggleCategory = async (cat: Category) => {
    await fetch(`/api/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !cat.enabled }),
    });
    await onRefreshBootstrap();
  };

  const handleUpdateBuyback = async (status: BuybackRequest['status']) => {
    if (!activeBuyback) return;
    const res = await fetch(`/api/buybacks/${activeBuyback.requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        estimatedOffer: estOffer ? Number(estOffer) : activeBuyback.estimatedOffer,
        finalOffer: finOffer ? Number(finOffer) : activeBuyback.finalOffer,
        adminNotes: bbNote || activeBuyback.adminNotes,
      }),
    });
    if (res.ok) {
      const updated = (await res.json()) as BuybackRequest;
      setActiveBuyback(updated);
      await loadAdminQueues();
      onNotify(`Buyback ${updated.requestId} moved to ${status}.`);
    }
  };

  const handleConvertBuyback = async (b: BuybackRequest) => {
    const res = await fetch(`/api/buybacks/${b.requestId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade: 'B',
        newComparisonPrice: b.originalPurchasePrice || Math.round((b.finalOffer || 1500) * 2),
        sellingPrice: Math.round((b.finalOffer || 1500) * 1.25),
      }),
    });
    if (res.ok) {
      await Promise.all([loadAdminQueues(), onRefreshBootstrap()]);
      onNotify(`Converted ${b.requestId} into Refurbished Lab Pipeline unit.`);
    }
  };

  const handleOrderStatus = async (orderId: string, orderStatus: Order['orderStatus']) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus }),
    });
    if (res.ok) {
      await loadAdminQueues();
      onNotify(`Order ${orderId} marked ${orderStatus}.`);
    }
  };

  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/homepage-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cms),
    });
    if (res.ok) {
      await onRefreshBootstrap();
      onNotify('Homepage CMS settings published.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <p className="text-xs font-mono text-slate-500">Operations / KRONTON Console</p>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Inventory, Refurbishment & Buyback Administration
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate({ page: 'home' })}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 hover:border-slate-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <nav className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
            {(
              [
                ['overview', 'Overview', LayoutDashboard],
                ['inventory', 'Catalog & Pricing', Package],
                ['refurbishment', 'Refurbishment Lab', Wrench],
                ['buybacks', 'Buyback Queue', RefreshCw],
                ['orders', 'Orders & Returns', ShoppingBag],
                ['categories', 'Categories (15)', Layers],
                ['cms', 'Homepage CMS', Settings],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSection(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                  section === key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Panel */}
        <div className="lg:col-span-9 space-y-6">
          {section === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Order Volume</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {formatINR(totalRevenue)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 tabular-nums">{orders.length} orders logged</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Active SKUs</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {products.length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 tabular-nums">
                    {refurbUnits.length} refurbished · {products.filter((p) => p.division === 'kit').length} SMM kits
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Buyback Requests</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {buybacks.length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 tabular-nums">
                    {buybacks.filter((b) => b.status === 'Submitted').length} awaiting review
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Active Categories</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {categories.filter((c) => c.enabled).length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Dynamic taxonomy</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-display text-base font-bold text-slate-900 mb-3">
                  Refurbishment Pricing & Grade Guardrails
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  KRONTON targets 50%–70% of comparable new selling prices (Grade A ~70%, Grade B ~60%, Grade C ~50%), while allowing manual price overrides per unit inside Catalog & Pricing. Grade D units remain restricted to internal repair or parts recovery.
                </p>
              </div>
            </div>
          )}

          {section === 'inventory' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Catalog & Manual Price Control
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddProd(!showAddProd)}
                  className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Component</span>
                </button>
              </div>

              {showAddProd && (
                <form onSubmit={handleCreateProduct} className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Product Name *"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <select
                    value={pDiv}
                    onChange={(e) => setPDiv(e.target.value as ProductDivision)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="new">New Component</option>
                    <option value="refurbished">Refurbished Unit</option>
                    <option value="kit">SMM Kit</option>
                  </select>
                  <select
                    value={pCat}
                    onChange={(e) => setPCat(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Brand"
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      placeholder="Price ₹"
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      className="w-1/3 px-2 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      required
                      placeholder="MRP ₹"
                      value={pMrp}
                      onChange={(e) => setPMrp(e.target.value)}
                      className="w-1/3 px-2 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Stock"
                      value={pStock}
                      onChange={(e) => setPStock(e.target.value)}
                      className="w-1/3 px-2 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  {pDiv === 'refurbished' && (
                    <select
                      value={pGrade}
                      onChange={(e) => setPGrade(e.target.value as RefurbishedGrade)}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="A">Grade A (~70%)</option>
                      <option value="B">Grade B (~60%)</option>
                      <option value="C">Grade C (~50%)</option>
                    </select>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                  >
                    Save to Catalog
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 pr-4 font-semibold">SKU / Unit ID</th>
                      <th className="py-2.5 px-4 font-semibold">Product</th>
                      <th className="py-2.5 px-4 font-semibold">Division</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Stock</th>
                      <th className="py-2.5 pl-4 font-semibold text-right">Selling Price ₹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-4 font-mono text-slate-500">{p.unitId || p.sku}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-900 max-w-xs truncate">{p.name}</td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {p.division === 'refurbished' ? `Refurbished · Grade ${p.grade}` : p.division === 'kit' ? 'SMM Kit' : 'New'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{p.stock}</td>
                        <td className="py-2.5 pl-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono tabular-nums font-semibold text-slate-900">
                              {formatINR(p.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const adjusted = Math.max(50, Math.round(p.price * 0.95));
                                handleInlinePriceUpdate(p, adjusted);
                              }}
                              className="px-2 py-0.5 border border-slate-200 rounded text-[11px] text-slate-600 hover:border-blue-600 hover:text-blue-700"
                              title="Apply 5% manual markdown"
                            >
                              -5%
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'refurbishment' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  15-Point Refurbishment Lab Pipeline
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Advance units from acquisition through inspection, repair, grading (A/B/C/D), and publication.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {refurbUnits.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedRefurbId(u.id);
                      setRfStage(u.workflowStage || 'Final Functional Testing');
                      setRfGrade(u.grade || 'A');
                      setRfPrice(String(u.price));
                    }}
                    className={`p-4 text-left rounded-xl border transition-all ${
                      selectedRefurbId === u.id
                        ? 'border-blue-700 bg-blue-50/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between text-xs font-mono text-slate-500">
                      <span>{u.unitId}</span>
                      <span>Grade {u.grade} · {u.stockStatus}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{u.name}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Stage: <strong>{u.workflowStage || 'Published'}</strong> · {formatINR(u.price)}
                    </p>
                  </button>
                ))}
              </div>

              {selectedRefurbId && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Update Lab Stage & Certification</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Workflow Stage</label>
                      <select
                        value={rfStage}
                        onChange={(e) => setRfStage(e.target.value as RefurbishmentStage)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                      >
                        {REFURB_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Assign Grade</label>
                      <select
                        value={rfGrade}
                        onChange={(e) => setRfGrade(e.target.value as RefurbishedGrade)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="A">Grade A (~70%)</option>
                        <option value="B">Grade B (~60%)</option>
                        <option value="C">Grade C (~50%)</option>
                        <option value="D">Grade D (Parts Only / Hold)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Selling Price ₹</label>
                      <input
                        type="number"
                        value={rfPrice}
                        onChange={(e) => setRfPrice(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={rfNotes}
                    onChange={(e) => setRfNotes(e.target.value)}
                    placeholder="Technician inspection note (e.g. Verified 3.3V/5V rails and 4-hr thermal burn-in)"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleAdvanceRefurb(false)}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                    >
                      Log Lab Stage
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdvanceRefurb(true)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Publish to Refurbished Store</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === 'buybacks' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <h2 className="font-display text-lg font-bold text-slate-900">Customer Buyback Evaluation Queue</h2>
              <div className="space-y-3">
                {buybacks.map((b) => (
                  <div
                    key={b.requestId}
                    className="p-4 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs font-mono text-slate-500">
                        {b.requestId} · {b.status} · {b.fullName} ({b.city})
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{b.productName}</p>
                      <p className="text-xs text-slate-600">
                        Condition: {b.condition} · Qty {b.quantity} · Est: {b.estimatedOffer ? formatINR(b.estimatedOffer) : '—'} · Final: {b.finalOffer ? formatINR(b.finalOffer) : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveBuyback(b);
                          setEstOffer(b.estimatedOffer ? String(b.estimatedOffer) : '');
                          setFinOffer(b.finalOffer ? String(b.finalOffer) : '');
                          setBbNote(b.adminNotes || '');
                        }}
                        className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                      >
                        Evaluate
                      </button>
                      {!b.convertedToRefurbishedId && (
                        <button
                          type="button"
                          onClick={() => handleConvertBuyback(b)}
                          className="px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded-lg"
                        >
                          Convert to Refurbished Unit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {activeBuyback && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Evaluating {activeBuyback.requestId}: {activeBuyback.productName}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Known Defects: {activeBuyback.knownDefects} · Accessories: {activeBuyback.includedAccessories}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveBuyback(null)}
                      className="text-xs text-slate-500 hover:text-slate-900"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Estimated Offer ₹</label>
                      <input
                        type="number"
                        value={estOffer}
                        onChange={(e) => setEstOffer(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Final Post-Lab Offer ₹</label>
                      <input
                        type="number"
                        value={finOffer}
                        onChange={(e) => setFinOffer(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={bbNote}
                    onChange={(e) => setBbNote(e.target.value)}
                    placeholder="Evaluation / lab diagnostic remarks"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateBuyback('Estimated Offer Issued')}
                      className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                    >
                      Issue Estimated Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBuyback('Lab Inspection')}
                      className="px-3.5 py-2 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
                    >
                      Mark Lab Inspection
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBuyback('Final Offer Issued')}
                      className="px-3.5 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Issue Final Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBuyback('Payment Processed')}
                      className="px-3.5 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Mark Payout Processed
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">Orders & Fulfillment Desk</h2>
              <div className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <div key={o.orderId} className="py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-mono text-slate-500">{o.orderId}</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {o.customerName} · {o.city}, {o.state}
                      </p>
                      <p className="text-slate-600 mt-0.5 tabular-nums">
                        {o.items.length} line items · {formatINR(o.total)} · {o.paymentMethod}
                      </p>
                    </div>
                    <select
                      value={o.orderStatus}
                      onChange={(e) => handleOrderStatus(o.orderId, e.target.value as Order['orderStatus'])}
                      className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                    >
                      {['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Return Requested'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'categories' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-slate-900">Dynamic Category Taxonomy</h2>
              <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="New Category Name"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                >
                  Add Category
                </button>
              </form>

              <div className="divide-y divide-slate-100 text-xs">
                {categories.map((cat) => (
                  <div key={cat.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{cat.name}</p>
                      <p className="text-slate-500">{cat.subcategories.join(' · ') || cat.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      className={`px-3 py-1 rounded-md font-semibold border ${
                        cat.enabled
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50/60'
                          : 'border-slate-200 text-slate-400 bg-slate-50'
                      }`}
                    >
                      {cat.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'cms' && (
            <form onSubmit={handleSaveCms} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">Homepage Section & Banner CMS</h2>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Announcement Bar Copy</label>
                <input
                  type="text"
                  value={cms.announcementText}
                  onChange={(e) => setCms({ ...cms, announcementText: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hero Headline</label>
                <input
                  type="text"
                  value={cms.heroHeadline}
                  onChange={(e) => setCms({ ...cms, heroHeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hero Description</label>
                <textarea
                  rows={2}
                  value={cms.heroDescription}
                  onChange={(e) => setCms({ ...cms, heroDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                {(
                  [
                    ['showAnnouncement', 'Show Announcement Bar'],
                    ['showCategoriesSection', 'Show Shop by Category Section'],
                    ['showDealsSection', 'Show Featured Inventory & Deals'],
                    ['showBuybackSection', 'Show Quality Assurance & Buyback'],
                    ['showReviewsSection', 'Show Verified Customer Reviews'],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cms[field]}
                      onChange={(e) => setCms({ ...cms, [field]: e.target.checked })}
                      className="rounded border-slate-300 text-blue-700"
                    />
                    <span className="text-slate-700">{label}</span>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg"
              >
                Publish Homepage Changes
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
