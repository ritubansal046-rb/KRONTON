import React, { useState } from 'react';
import { CheckCircle2, Search, ShieldAlert, Upload, X } from 'lucide-react';
import { BuybackCondition, BuybackRequest, Category, UserAccount } from '../types';
import { formatINR } from '../utils/format';

interface BuybackViewProps {
  categories: Category[];
  currentUser: UserAccount | null;
  initialTab?: 'sell' | 'track';
  initialTrackId?: string;
  onNotify: (msg: string) => void;
}

const CONDITIONS: BuybackCondition[] = [
  'Brand New / Unused',
  'Like New',
  'Good Working Condition',
  'Minor Physical Defects',
  'Partially Functional',
  'Not Working',
  'For Parts Only',
];

export const BuybackView: React.FC<BuybackViewProps> = ({
  categories,
  currentUser,
  initialTab = 'sell',
  initialTrackId = '',
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'sell' | 'track'>(initialTab);
  const [submittedRequest, setSubmittedRequest] = useState<BuybackRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Submission Form State
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [stateName, setStateName] = useState(currentUser?.state || '');
  const [pinCode, setPinCode] = useState(currentUser?.pinCode || '');

  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-mcu');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [originalPurchasePrice, setOriginalPurchasePrice] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [expectedSellingPrice, setExpectedSellingPrice] = useState('');
  const [condition, setCondition] = useState<BuybackCondition>('Good Working Condition');
  const [knownDefects, setKnownDefects] = useState('');
  const [functionalStatus, setFunctionalStatus] = useState('');
  const [includedAccessories, setIncludedAccessories] = useState('');
  const [reasonForSelling, setReasonForSelling] = useState('');
  const [comments, setComments] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'Bank Transfer' | 'Store Credit'>('UPI');
  const [images, setImages] = useState<string[]>([]);

  const [legalOwnerConfirmed, setLegalOwnerConfirmed] = useState(false);
  const [notStolenConfirmed, setNotStolenConfirmed] = useState(false);
  const [accurateInfoConfirmed, setAccurateInfoConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Tracker state
  const [trackQuery, setTrackQuery] = useState(initialTrackId || 'BBK-2026-4109');
  const [trackedRequest, setTrackedRequest] = useState<BuybackRequest | null>(null);
  const [trackError, setTrackError] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 5 - images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev.slice(0, 4), reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalOwnerConfirmed || !notStolenConfirmed || !accurateInfoConfirmed || !termsAccepted) {
      onNotify('Please confirm all four ownership and accuracy declarations before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/buybacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          fullName,
          email,
          mobile,
          address,
          city,
          state: stateName,
          pinCode,
          categoryId,
          productName,
          brand,
          modelNumber,
          description,
          quantity,
          purchaseDate: purchaseDate || undefined,
          originalPurchasePrice: originalPurchasePrice ? Number(originalPurchasePrice) : undefined,
          invoiceRef: invoiceRef || undefined,
          expectedSellingPrice: expectedSellingPrice ? Number(expectedSellingPrice) : undefined,
          condition,
          images,
          knownDefects,
          functionalStatus,
          includedAccessories,
          reasonForSelling,
          comments,
          payoutMethod,
          legalOwnerConfirmed,
          notStolenConfirmed,
          accurateInfoConfirmed,
          termsAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Could not submit buyback request.');
        return;
      }
      setSubmittedRequest(data as BuybackRequest);
      setTrackQuery(data.requestId);
      setTrackedRequest(data as BuybackRequest);
      onNotify(`Buyback request ${data.requestId} submitted successfully.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackLookup = async (idToFind: string) => {
    const clean = idToFind.trim();
    if (!clean) return;
    setTrackingLoading(true);
    setTrackError('');
    try {
      const res = await fetch(`/api/buybacks/${encodeURIComponent(clean)}`);
      if (!res.ok) {
        setTrackedRequest(null);
        setTrackError(`No buyback request found with ID "${clean}".`);
        return;
      }
      const data = (await res.json()) as BuybackRequest;
      setTrackedRequest(data);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleOfferDecision = async (requestId: string, decision: 'accept' | 'reject') => {
    const res = await fetch(`/api/buybacks/${encodeURIComponent(requestId)}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) {
      const updated = (await res.json()) as BuybackRequest;
      setTrackedRequest(updated);
      onNotify(
        decision === 'accept'
          ? `Final offer accepted for ${requestId}. Payout queued via ${updated.payoutMethod}.`
          : `Offer declined for ${requestId}. Return logistics initiated.`
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header & Mode Switch */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-blue-700 mb-2">KRONTON Direct C2B Buyback Program</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
            Sell Your Components to KRONTON
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Turn unused development boards, sensors, robotics hardware, and lab tools into direct UPI or bank payouts. Submit component photos, receive a transparent valuation, and track inspection end-to-end.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('sell')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'sell' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Start Selling
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('track');
              if (!trackedRequest && trackQuery) handleTrackLookup(trackQuery);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'track' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Track Buyback Request
          </button>
        </div>
      </div>

      {/* 4-Step Process Explainer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          ['01. Submit Specs & Photos', 'Enter component model, condition, and clear photos of labels, pins, and ports.'],
          ['02. Estimated Valuation', 'KRONTON engineers review market demand and issue an estimated INR quote.'],
          ['03. Pickup & Lab Testing', 'Reverse courier pickup followed by electrical continuity and functional bench verification.'],
          ['04. Final Offer & Payout', 'Accept the final offer for same-day UPI / Bank transfer, or request free return if declined.'],
        ].map(([title, desc]) => (
          <div key={title} className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {activeTab === 'sell' ? (
        submittedRequest ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Buyback Request Submitted
            </h2>
            <p className="text-sm text-slate-600">
              Your submission for <strong>{submittedRequest.productName}</strong> has been logged. Keep your Request ID for live tracking:
            </p>
            <div className="py-3 px-6 bg-slate-50 border border-slate-200 rounded-lg inline-block font-mono text-lg font-bold text-slate-900">
              {submittedRequest.requestId}
            </div>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('track');
                  handleTrackLookup(submittedRequest.requestId);
                }}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg"
              >
                Track Request Live
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedRequest(null);
                  setProductName('');
                  setBrand('');
                  setModelNumber('');
                  setDescription('');
                  setImages([]);
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Submit Another Component
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Customer Details */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900">1. Seller Contact & Pickup Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 98XXXXXXXX"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">State & PIN *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-1/2 px-2.5 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        pattern="[0-9]{6}"
                        placeholder="PIN"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        className="w-1/2 px-2.5 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Product Details */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900">2. Component Details & Condition</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Raspberry Pi 4 Model B 4GB"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Brand *</label>
                    <input
                      type="text"
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Raspberry Pi / Arduino / NVIDIA"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Model No. *</label>
                      <input
                        type="text"
                        required
                        value={modelNumber}
                        onChange={(e) => setModelNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Condition Grade *</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as BuybackCondition)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Payout Method</label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value as typeof payoutMethod)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="UPI">Instant UPI Transfer</option>
                      <option value="Bank Transfer">NEFT / IMPS Bank Transfer</option>
                      <option value="Store Credit">KRONTON Store Credit (+5% bonus)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Purchase Date (opt.)</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Original Price ₹ (opt.)</label>
                    <input
                      type="number"
                      value={originalPurchasePrice}
                      onChange={(e) => setOriginalPurchasePrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Ref (opt.)</label>
                    <input
                      type="text"
                      value={invoiceRef}
                      onChange={(e) => setInvoiceRef(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Expected Price ₹ (opt.)</label>
                    <input
                      type="number"
                      value={expectedSellingPrice}
                      onChange={(e) => setExpectedSellingPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Product Description & Functional Status *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe usage history, ports/pins tested, and overall condition..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Known Defects</label>
                    <input
                      type="text"
                      value={knownDefects}
                      onChange={(e) => setKnownDefects(e.target.value)}
                      placeholder="e.g. None, or bent pin 14"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Included Accessories</label>
                    <input
                      type="text"
                      value={includedAccessories}
                      onChange={(e) => setIncludedAccessories(e.target.value)}
                      placeholder="Cable, heatsink, box"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Reason for Selling</label>
                    <input
                      type="text"
                      value={reasonForSelling}
                      onChange={(e) => setReasonForSelling(e.target.value)}
                      placeholder="Project completed / surplus"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </section>

              {/* Photos */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900">
                  3. Component Photographs (Up to 5)
                </h2>
                <p className="text-xs text-slate-500">
                  Include clear shots of front, back, model label, GPIO/connector pins, and any visible wear.
                </p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-blue-600 hover:bg-slate-50 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">Click to select component photos</span>
                  <span className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {images.map((src, i) => (
                      <div key={i} className="relative w-24 h-20 rounded-lg overflow-hidden border border-slate-200">
                        <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-0.5 bg-slate-900/80 text-white rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Declarations & Submit */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 sticky top-24">
                <h2 className="font-display text-base font-bold text-slate-900">
                  4. Legal Ownership & Terms Declaration
                </h2>
                <div className="space-y-3 text-xs text-slate-700">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={legalOwnerConfirmed}
                      onChange={(e) => setLegalOwnerConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-700"
                    />
                    <span>I confirm I am the legal owner or authorized seller of these components.</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notStolenConfirmed}
                      onChange={(e) => setNotStolenConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-700"
                    />
                    <span>I confirm the hardware is not stolen, counterfeit, or unlawfully acquired.</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accurateInfoConfirmed}
                      onChange={(e) => setAccurateInfoConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-700"
                    />
                    <span>All declared specifications, functional status, and defects are accurate.</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-700"
                    />
                    <span>I agree to KRONTON’s Buyback Inspection & Return Terms.</span>
                  </label>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    Final offers are confirmed only after physical bench verification at KRONTON Bengaluru Lab. If you decline the final offer, we ship the component back to your pickup address.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {submitting ? 'Submitting Request...' : 'Submit Buyback Request'}
                </button>
              </div>
            </aside>
          </form>
        )
      ) : (
        /* Buyback Request Tracker */
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">Track Buyback Request</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your Request ID (e.g., <button type="button" onClick={() => { setTrackQuery('BBK-2026-4109'); handleTrackLookup('BBK-2026-4109'); }} className="font-mono text-blue-700 underline">BBK-2026-4109</button> or <button type="button" onClick={() => { setTrackQuery('BBK-2026-4112'); handleTrackLookup('BBK-2026-4112'); }} className="font-mono text-blue-700 underline">BBK-2026-4112</button>)
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTrackLookup(trackQuery);
              }}
              className="flex gap-2 w-full sm:w-auto"
            >
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="BBK-2026-XXXX"
                className="flex-1 sm:w-56 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Lookup</span>
              </button>
            </form>
          </div>

          {trackingLoading && <p className="text-xs text-slate-500">Fetching buyback status...</p>}
          {trackError && <p className="text-xs text-rose-600 font-medium">{trackError}</p>}

          {trackedRequest && (
            <div className="pt-6 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-slate-500">{trackedRequest.requestId}</p>
                    <h3 className="text-lg font-bold text-slate-900">{trackedRequest.productName}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {trackedRequest.brand} · Model {trackedRequest.modelNumber} · Qty {trackedRequest.quantity} · {trackedRequest.condition}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-blue-700">{trackedRequest.status}</span>
                    <p className="text-xs text-slate-500">Payout: {trackedRequest.payoutMethod}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Expected Price</p>
                    <p className="text-sm font-bold font-mono tabular-nums text-slate-900">
                      {trackedRequest.expectedSellingPrice ? formatINR(trackedRequest.expectedSellingPrice) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Estimated Offer</p>
                    <p className="text-sm font-bold font-mono tabular-nums text-slate-900">
                      {trackedRequest.estimatedOffer ? formatINR(trackedRequest.estimatedOffer) : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Final Lab Offer</p>
                    <p className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                      {trackedRequest.finalOffer ? formatINR(trackedRequest.finalOffer) : 'Pending Inspection'}
                    </p>
                  </div>
                </div>

                {trackedRequest.adminNotes && (
                  <div className="p-4 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <strong className="text-slate-900">Lab Evaluation Note:</strong> {trackedRequest.adminNotes}
                  </div>
                )}

                {trackedRequest.status === 'Final Offer Issued' && (
                  <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Action Required: Respond to Final Offer ({formatINR(trackedRequest.finalOffer || 0)})
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Accept to trigger payout via {trackedRequest.payoutMethod}, or decline for return shipping.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOfferDecision(trackedRequest.requestId, 'accept')}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                      >
                        Accept Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOfferDecision(trackedRequest.requestId, 'reject')}
                        className="px-4 py-2 bg-white border border-slate-300 hover:border-rose-400 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5">
                <h4 className="text-xs font-semibold text-slate-900 mb-3">Evaluation & Transit Timeline</h4>
                <div className="space-y-3">
                  {trackedRequest.timeline.map((step, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                      <div className="flex justify-between gap-2 font-semibold text-slate-900">
                        <span>{step.status}</span>
                        <span className="font-mono text-slate-400">{step.timestamp}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{step.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
