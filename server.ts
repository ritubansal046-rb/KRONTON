import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { SEED_DB } from './src/data/seedData.ts';
import type {
  BuybackRequest,
  Category,
  KrontonDatabase,
  Order,
  Product,
  RefurbishedGrade,
  RefurbishmentStage,
  Review,
  SupportTicket,
  UserAccount,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'kronton-db.json');

function loadDb(): KrontonDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_DB, null, 2), 'utf-8');
    return structuredClone(SEED_DB);
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as KrontonDatabase;
  } catch {
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_DB, null, 2), 'utf-8');
    return structuredClone(SEED_DB);
  }
}

function saveDb(db: KrontonDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

function formatNowIst(): string {
  const now = new Date();
  return now.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Bootstrap storefront payload
  app.get('/api/bootstrap', (_req, res) => {
    const db = loadDb();
    res.json({
      categories: db.categories.sort((a, b) => a.order - b.order),
      products: db.products,
      reviews: db.reviews,
      homepageConfig: db.homepageConfig,
    });
  });

  // Categories
  app.get('/api/categories', (_req, res) => {
    const db = loadDb();
    res.json(db.categories.sort((a, b) => a.order - b.order));
  });

  app.post('/api/categories', (req, res) => {
    const db = loadDb();
    const body = req.body as Partial<Category>;
    if (!body.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      slug,
      name: body.name,
      description: body.description || '',
      imageUrl: body.imageUrl || '/src/assets/images/hero_electronics_workbench_1794888809589.jpg',
      subcategories: body.subcategories || [],
      attributes: body.attributes || [],
      order: body.order ?? db.categories.length + 1,
      enabled: body.enabled ?? true,
    };
    db.categories.push(newCat);
    saveDb(db);
    res.status(201).json(newCat);
  });

  app.patch('/api/categories/:id', (req, res) => {
    const db = loadDb();
    const idx = db.categories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Category not found' });
    db.categories[idx] = { ...db.categories[idx], ...req.body };
    saveDb(db);
    res.json(db.categories[idx]);
  });

  // Products
  app.get('/api/products', (_req, res) => {
    const db = loadDb();
    res.json(db.products);
  });

  app.post('/api/products', (req, res) => {
    const db = loadDb();
    const p = req.body as Partial<Product>;
    if (!p.name || !p.division || typeof p.price !== 'number') {
      return res.status(400).json({ error: 'Name, division, and numeric price are required' });
    }
    const mrp = p.mrp || p.price;
    const discountPercent = mrp > 0 ? Math.max(0, Math.round(((mrp - p.price) / mrp) * 100)) : 0;
    const stock = p.stock ?? 1;
    const created: Product = {
      id: `prod-${Date.now()}`,
      division: p.division,
      name: p.name,
      sku: p.sku || `KRN-${p.division.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
      brand: p.brand || 'KRONTON',
      manufacturer: p.manufacturer || p.brand || 'KRONTON Partner',
      modelNumber: p.modelNumber || 'STD-01',
      categoryId: p.categoryId || 'cat-mcu',
      subcategory: p.subcategory || 'General',
      shortDescription: p.shortDescription || p.name,
      description: p.description || p.shortDescription || p.name,
      images:
        p.images && p.images.length > 0
          ? p.images
          : ['/src/assets/images/cat_microcontrollers_1794888810576.jpg'],
      specifications: p.specifications || {},
      datasheetSummary: p.datasheetSummary || `${p.name} Technical Datasheet`,
      mrp,
      price: p.price,
      discountPercent,
      gstRate: p.gstRate ?? 18,
      hsnCode: p.hsnCode || '85423100',
      stock,
      stockStatus:
        p.stockStatus || (stock <= 0 ? 'Out of Stock' : stock <= 3 ? 'Low Stock' : 'In Stock'),
      warranty: p.warranty || (p.division === 'refurbished' ? '6-Month KRONTON Refurbished Warranty' : '12-Month Warranty'),
      returnEligible: p.returnEligible ?? true,
      estimatedDelivery: p.estimatedDelivery || '2–4 business days across India',
      isFeatured: p.isFeatured ?? true,
      isNewArrival: p.isNewArrival ?? true,
      isBestSeller: p.isBestSeller ?? false,
      rating: p.rating ?? 4.8,
      reviewCount: p.reviewCount ?? 0,
      unitId: p.division === 'refurbished' ? p.unitId || `KRN-RF-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      grade: p.grade,
      newComparisonPrice: p.newComparisonPrice,
      physicalCondition: p.physicalCondition,
      functionalTestSummary: p.functionalTestSummary,
      testingStatus: p.testingStatus,
      knownLimitations: p.knownLimitations,
      repairHistory: p.repairHistory,
      workflowStage: p.workflowStage || (p.division === 'refurbished' ? 'Published' : undefined),
      refurbishmentHistory: p.refurbishmentHistory,
      includedComponents: p.includedComponents,
      intendedApplications: p.intendedApplications,
      difficultyLevel: p.difficultyLevel,
      documentationSummary: p.documentationSummary,
    };
    db.products.unshift(created);
    saveDb(db);
    res.status(201).json(created);
  });

  app.patch('/api/products/:id', (req, res) => {
    const db = loadDb();
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    const existing = db.products[idx];
    const updated = { ...existing, ...req.body } as Product;
    const baseCompare = updated.division === 'refurbished' && updated.newComparisonPrice ? updated.newComparisonPrice : updated.mrp;
    if (baseCompare > 0) {
      updated.discountPercent = Math.max(0, Math.round(((baseCompare - updated.price) / baseCompare) * 100));
    }
    if (typeof req.body.stock === 'number' && !req.body.stockStatus) {
      updated.stockStatus =
        updated.stock <= 0 ? 'Out of Stock' : updated.stock <= 3 ? 'Low Stock' : 'In Stock';
    }
    db.products[idx] = updated;
    saveDb(db);
    res.json(updated);
  });

  app.delete('/api/products/:id', (req, res) => {
    const db = loadDb();
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== req.params.id);
    if (db.products.length === before) return res.status(404).json({ error: 'Product not found' });
    saveDb(db);
    res.json({ ok: true });
  });

  // Refurbishment 15-point lab pipeline advancement
  app.post('/api/refurbished/:id/advance', (req, res) => {
    const db = loadDb();
    const idx = db.products.findIndex((p) => p.id === req.params.id && p.division === 'refurbished');
    if (idx === -1) return res.status(404).json({ error: 'Refurbished unit not found' });

    const { stage, technician, notes, grade, price, testingStatus, publish } = req.body as {
      stage: RefurbishmentStage;
      technician: string;
      notes: string;
      grade?: RefurbishedGrade;
      price?: number;
      testingStatus?: Product['testingStatus'];
      publish?: boolean;
    };

    const unit = db.products[idx];
    const history = unit.refurbishmentHistory || [];
    history.push({
      stage: stage || 'Final Functional Testing',
      date: new Date().toISOString().slice(0, 10),
      technician: technician || 'R. Nair',
      notes: notes || 'Inspection check recorded.',
    });

    unit.workflowStage = publish ? 'Published' : stage || unit.workflowStage;
    if (grade) unit.grade = grade;
    if (typeof price === 'number' && price > 0) {
      unit.price = price;
      if (unit.newComparisonPrice && unit.newComparisonPrice > 0) {
        unit.discountPercent = Math.max(
          0,
          Math.round(((unit.newComparisonPrice - price) / unit.newComparisonPrice) * 100)
        );
      }
    }
    if (testingStatus) unit.testingStatus = testingStatus;
    if (publish) {
      if (unit.grade === 'D') {
        return res.status(400).json({ error: 'Grade D units cannot be published for regular refurbished resale.' });
      }
      unit.testingStatus = 'Passed All Tests';
      unit.stock = Math.max(1, unit.stock);
      unit.stockStatus = 'In Stock';
      unit.warranty = '6-Month KRONTON Refurbished Warranty';
    }
    unit.refurbishmentHistory = history;
    db.products[idx] = unit;
    saveDb(db);
    res.json(unit);
  });

  // Buyback endpoints
  app.get('/api/buybacks', (req, res) => {
    const db = loadDb();
    const email = req.query.email as string | undefined;
    const list = email
      ? db.buybackRequests.filter((b) => b.email.toLowerCase() === email.toLowerCase())
      : db.buybackRequests;
    res.json(list);
  });

  app.get('/api/buybacks/:requestId', (req, res) => {
    const db = loadDb();
    const found = db.buybackRequests.find(
      (b) => b.requestId.toLowerCase() === req.params.requestId.toLowerCase()
    );
    if (!found) return res.status(404).json({ error: 'Buyback request ID not found' });
    res.json(found);
  });

  app.post('/api/buybacks', (req, res) => {
    const db = loadDb();
    const body = req.body as Partial<BuybackRequest>;
    if (!body.fullName || !body.email || !body.mobile || !body.productName || !body.condition) {
      return res.status(400).json({ error: 'Required customer and product fields are missing.' });
    }
    if (!body.legalOwnerConfirmed || !body.notStolenConfirmed || !body.accurateInfoConfirmed || !body.termsAccepted) {
      return res.status(400).json({ error: 'All ownership and terms declarations must be confirmed.' });
    }
    const requestId = `BBK-2026-${Math.floor(4200 + Math.random() * 5700)}`;
    const newReq: BuybackRequest = {
      requestId,
      userId: body.userId,
      fullName: body.fullName,
      email: body.email,
      mobile: body.mobile,
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      pinCode: body.pinCode || '',
      categoryId: body.categoryId || 'cat-mcu',
      productName: body.productName,
      brand: body.brand || 'Generic',
      modelNumber: body.modelNumber || 'N/A',
      description: body.description || '',
      quantity: Math.max(1, Number(body.quantity) || 1),
      purchaseDate: body.purchaseDate,
      originalPurchasePrice: body.originalPurchasePrice ? Number(body.originalPurchasePrice) : undefined,
      invoiceRef: body.invoiceRef,
      expectedSellingPrice: body.expectedSellingPrice ? Number(body.expectedSellingPrice) : undefined,
      condition: body.condition,
      images:
        body.images && body.images.length > 0
          ? body.images
          : ['/src/assets/images/cat_microcontrollers_1794888810576.jpg'],
      knownDefects: body.knownDefects || 'None disclosed',
      functionalStatus: body.functionalStatus || 'Functional',
      includedAccessories: body.includedAccessories || 'Standard unit only',
      reasonForSelling: body.reasonForSelling || 'Unused / Surplus',
      comments: body.comments || '',
      payoutMethod: body.payoutMethod || 'UPI',
      legalOwnerConfirmed: true,
      notStolenConfirmed: true,
      accurateInfoConfirmed: true,
      termsAccepted: true,
      status: 'Submitted',
      estimatedOffer: null,
      finalOffer: null,
      adminNotes: 'Awaiting initial engineering valuation.',
      timeline: [
        {
          status: 'Submitted',
          timestamp: formatNowIst(),
          note: 'Buyback submission logged and assigned unique Request ID.',
        },
      ],
      createdAt: new Date().toISOString(),
    };
    db.buybackRequests.unshift(newReq);
    saveDb(db);
    res.status(201).json(newReq);
  });

  app.patch('/api/buybacks/:requestId', (req, res) => {
    const db = loadDb();
    const idx = db.buybackRequests.findIndex(
      (b) => b.requestId.toLowerCase() === req.params.requestId.toLowerCase()
    );
    if (idx === -1) return res.status(404).json({ error: 'Buyback request not found' });
    const reqObj = db.buybackRequests[idx];
    const { status, estimatedOffer, finalOffer, adminNotes, note } = req.body as Partial<BuybackRequest> & {
      note?: string;
    };
    if (status && status !== reqObj.status) {
      reqObj.status = status;
      reqObj.timeline.push({
        status,
        timestamp: formatNowIst(),
        note: note || adminNotes || `Status updated to ${status}.`,
      });
    }
    if (typeof estimatedOffer === 'number') reqObj.estimatedOffer = estimatedOffer;
    if (typeof finalOffer === 'number') reqObj.finalOffer = finalOffer;
    if (typeof adminNotes === 'string') reqObj.adminNotes = adminNotes;
    db.buybackRequests[idx] = reqObj;
    saveDb(db);
    res.json(reqObj);
  });

  app.post('/api/buybacks/:requestId/respond', (req, res) => {
    const db = loadDb();
    const idx = db.buybackRequests.findIndex(
      (b) => b.requestId.toLowerCase() === req.params.requestId.toLowerCase()
    );
    if (idx === -1) return res.status(404).json({ error: 'Buyback request not found' });
    const { decision } = req.body as { decision: 'accept' | 'reject' };
    const reqObj = db.buybackRequests[idx];
    if (decision === 'accept') {
      reqObj.status = 'Offer Accepted';
      reqObj.timeline.push({
        status: 'Offer Accepted',
        timestamp: formatNowIst(),
        note: `Customer accepted final payout offer of ₹${reqObj.finalOffer ?? reqObj.estimatedOffer}.`,
      });
    } else {
      reqObj.status = 'Offer Rejected';
      reqObj.timeline.push({
        status: 'Offer Rejected',
        timestamp: formatNowIst(),
        note: 'Customer declined offer. Return shipping arranged per Buyback Terms.',
      });
    }
    db.buybackRequests[idx] = reqObj;
    saveDb(db);
    res.json(reqObj);
  });

  app.post('/api/buybacks/:requestId/convert', (req, res) => {
    const db = loadDb();
    const idx = db.buybackRequests.findIndex(
      (b) => b.requestId.toLowerCase() === req.params.requestId.toLowerCase()
    );
    if (idx === -1) return res.status(404).json({ error: 'Buyback request not found' });
    const reqObj = db.buybackRequests[idx];
    const { grade, newComparisonPrice, sellingPrice } = req.body as {
      grade: RefurbishedGrade;
      newComparisonPrice: number;
      sellingPrice: number;
    };
    const unitId = `KRN-RF-2026-${Math.floor(300 + Math.random() * 699)}`;
    const newProduct: Product = {
      id: `prod-ref-${Date.now()}`,
      division: 'refurbished',
      unitId,
      grade: grade || 'B',
      newComparisonPrice: newComparisonPrice || Math.round((sellingPrice || 1000) * 1.65),
      name: `${reqObj.productName} — Lab Tested Refurbished (${unitId})`,
      sku: `KRN-RF-${unitId.slice(-4)}`,
      brand: reqObj.brand,
      manufacturer: reqObj.brand,
      modelNumber: reqObj.modelNumber,
      categoryId: reqObj.categoryId,
      subcategory: 'Buyback Acquired',
      shortDescription: `Grade ${grade || 'B'} tested unit acquired via buyback ${reqObj.requestId}.`,
      description: reqObj.description,
      images: reqObj.images,
      specifications: {
        'Unit Serial': unitId,
        'Buyback Origin': reqObj.requestId,
        'Included Accessories': reqObj.includedAccessories,
      },
      datasheetSummary: `KRONTON Refurbishment Certificate ${unitId}`,
      mrp: newComparisonPrice || Math.round((sellingPrice || 1000) * 1.65),
      price: sellingPrice || 999,
      discountPercent: newComparisonPrice
        ? Math.max(0, Math.round(((newComparisonPrice - sellingPrice) / newComparisonPrice) * 100))
        : 40,
      gstRate: 18,
      hsnCode: '85423100',
      stock: grade === 'D' ? 0 : reqObj.quantity,
      stockStatus: grade === 'D' ? 'Parts Only' : 'Under Inspection',
      warranty: grade === 'D' ? 'Parts Only / No Warranty' : '6-Month KRONTON Refurbished Warranty',
      returnEligible: grade !== 'D',
      estimatedDelivery: '2–4 business days across India',
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      rating: 4.8,
      reviewCount: 0,
      physicalCondition: reqObj.knownDefects || 'Inspected upon receiving from buyback.',
      functionalTestSummary: 'Pending final bench stress verification.',
      testingStatus: 'Under Inspection',
      knownLimitations: reqObj.knownDefects || 'Disclosed prior to publication.',
      repairHistory: [`Acquired via ${reqObj.requestId}`],
      workflowStage: 'Receiving',
      refurbishmentHistory: [
        {
          stage: 'Product Acquisition',
          date: new Date().toISOString().slice(0, 10),
          technician: 'Buyback Intake',
          notes: `Converted from ${reqObj.requestId}`,
        },
      ],
    };
    db.products.unshift(newProduct);
    reqObj.convertedToRefurbishedId = newProduct.id;
    reqObj.status = 'Completed';
    reqObj.timeline.push({
      status: 'Completed',
      timestamp: formatNowIst(),
      note: `Converted into Refurbished Lab Pipeline unit ${unitId}.`,
    });
    db.buybackRequests[idx] = reqObj;
    saveDb(db);
    res.status(201).json({ buyback: reqObj, product: newProduct });
  });

  // Orders
  app.get('/api/orders', (req, res) => {
    const db = loadDb();
    const email = req.query.email as string | undefined;
    const list = email
      ? db.orders.filter((o) => o.email.toLowerCase() === email.toLowerCase())
      : db.orders;
    res.json(list);
  });

  app.get('/api/orders/:orderId', (req, res) => {
    const db = loadDb();
    const found = db.orders.find(
      (o) => o.orderId.toLowerCase() === req.params.orderId.toLowerCase()
    );
    if (!found) return res.status(404).json({ error: 'Order ID not found' });
    res.json(found);
  });

  app.post('/api/orders', (req, res) => {
    const db = loadDb();
    const body = req.body as Partial<Order>;
    if (!body.customerName || !body.email || !body.phone || !body.address || !body.pinCode || !body.items?.length) {
      return res.status(400).json({ error: 'Complete shipping address, contact info, and cart items are required.' });
    }

    // Validate stock and deduct atomically
    for (const item of body.items) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (!prod) return res.status(400).json({ error: `Product ${item.name} no longer exists.` });
      if (prod.stock < item.qty) {
        return res.status(400).json({ error: `Insufficient stock for ${prod.name}. Available: ${prod.stock}.` });
      }
    }

    for (const item of body.items) {
      const idx = db.products.findIndex((p) => p.id === item.productId);
      db.products[idx].stock = Math.max(0, db.products[idx].stock - item.qty);
      if (db.products[idx].stock === 0) {
        db.products[idx].stockStatus = 'Out of Stock';
      } else if (db.products[idx].stock <= 3) {
        db.products[idx].stockStatus = 'Low Stock';
      }
    }

    const subtotal = body.items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const shippingFee = subtotal >= 1499 ? 0 : 79;
    const gstAmount = Math.round((subtotal * 18) / 118); // GST included breakdown
    const total = subtotal + shippingFee;
    const orderId = `KRN-ORD-2026-${Math.floor(1100 + Math.random() * 8800)}`;

    const newOrder: Order = {
      orderId,
      userId: body.userId,
      customerName: body.customerName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city || '',
      state: body.state || '',
      pinCode: body.pinCode,
      gstin: body.gstin,
      items: body.items,
      subtotal,
      gstAmount,
      shippingFee,
      total,
      paymentMethod: body.paymentMethod || 'UPI',
      paymentStatus: body.paymentMethod === 'Cash on Delivery (COD)' ? 'Pending COD' : 'Paid',
      orderStatus: 'Confirmed',
      trackingTimeline: [
        {
          status: 'Confirmed',
          timestamp: formatNowIst(),
          location: 'KRONTON Bengaluru Order Desk',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);
    saveDb(db);
    res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:orderId', (req, res) => {
    const db = loadDb();
    const idx = db.orders.findIndex((o) => o.orderId.toLowerCase() === req.params.orderId.toLowerCase());
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    const { orderStatus, location } = req.body as { orderStatus: Order['orderStatus']; location?: string };
    if (orderStatus && orderStatus !== db.orders[idx].orderStatus) {
      db.orders[idx].orderStatus = orderStatus;
      db.orders[idx].trackingTimeline.push({
        status: orderStatus,
        timestamp: formatNowIst(),
        location: location || 'KRONTON Logistics Hub',
      });
    }
    saveDb(db);
    res.json(db.orders[idx]);
  });

  app.post('/api/orders/:orderId/return', (req, res) => {
    const db = loadDb();
    const idx = db.orders.findIndex((o) => o.orderId.toLowerCase() === req.params.orderId.toLowerCase());
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    const { reason } = req.body as { reason: string };
    db.orders[idx].orderStatus = 'Return Requested';
    db.orders[idx].returnRequest = {
      reason: reason || 'Customer requested return / replacement.',
      status: 'Inspection Scheduled',
      requestedAt: new Date().toISOString(),
    };
    db.orders[idx].trackingTimeline.push({
      status: 'Return Requested',
      timestamp: formatNowIst(),
      location: 'Customer Return Desk',
    });
    saveDb(db);
    res.json(db.orders[idx]);
  });

  // Reviews
  app.post('/api/reviews', (req, res) => {
    const db = loadDb();
    const body = req.body as Partial<Review>;
    if (!body.productId || !body.authorName || !body.comment || !body.rating) {
      return res.status(400).json({ error: 'Product, author, rating, and comment are required.' });
    }
    const rev: Review = {
      id: `rev-${Date.now()}`,
      productId: body.productId,
      authorName: body.authorName,
      authorRole: body.authorRole || 'Verified Maker',
      rating: Math.min(5, Math.max(1, Number(body.rating))),
      title: body.title || 'Verified Product Review',
      comment: body.comment,
      verifiedPurchase: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.reviews.unshift(rev);
    const pIdx = db.products.findIndex((p) => p.id === body.productId);
    if (pIdx !== -1) {
      const prodRevs = db.reviews.filter((r) => r.productId === body.productId);
      const avg = prodRevs.reduce((acc, r) => acc + r.rating, 0) / prodRevs.length;
      db.products[pIdx].reviewCount = prodRevs.length;
      db.products[pIdx].rating = Math.round(avg * 10) / 10;
    }
    saveDb(db);
    res.status(201).json(rev);
  });

  // Support Tickets
  app.get('/api/support', (_req, res) => {
    const db = loadDb();
    res.json(db.supportTickets);
  });

  app.post('/api/support', (req, res) => {
    const db = loadDb();
    const body = req.body as Partial<SupportTicket>;
    if (!body.name || !body.email || !body.subject || !body.message) {
      return res.status(400).json({ error: 'All support ticket fields are required.' });
    }
    const ticket: SupportTicket = {
      id: `TKT-2026-${Math.floor(200 + Math.random() * 799)}`,
      name: body.name,
      email: body.email,
      orderOrBuybackId: body.orderOrBuybackId,
      subject: body.subject,
      message: body.message,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    db.supportTickets.unshift(ticket);
    saveDb(db);
    res.status(201).json(ticket);
  });

  app.patch('/api/support/:id', (req, res) => {
    const db = loadDb();
    const idx = db.supportTickets.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
    db.supportTickets[idx] = { ...db.supportTickets[idx], ...req.body };
    saveDb(db);
    res.json(db.supportTickets[idx]);
  });

  // Auth (Account lookup / registration)
  app.post('/api/auth/login', (req, res) => {
    const db = loadDb();
    const { email, role } = req.body as { email?: string; role?: 'customer' | 'admin' };
    if (role === 'admin') {
      const admin = db.users.find((u) => u.role === 'admin')!;
      return res.json(admin);
    }
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      return res.status(404).json({ error: 'No account found with this email. Please register first.' });
    }
    res.json(existing);
  });

  app.post('/api/auth/register', (req, res) => {
    const db = loadDb();
    const body = req.body as Partial<UserAccount>;
    if (!body.name || !body.email || !body.mobile) {
      return res.status(400).json({ error: 'Full name, email, and mobile number are required.' });
    }
    const existing = db.users.find((u) => u.email.toLowerCase() === body.email!.toLowerCase());
    if (existing) return res.json(existing);
    const created: UserAccount = {
      id: `usr-${Date.now()}`,
      name: body.name,
      email: body.email,
      mobile: body.mobile,
      role: 'customer',
      city: body.city || 'Bengaluru',
      state: body.state || 'Karnataka',
      pinCode: body.pinCode || '560001',
      address: body.address || '',
    };
    db.users.push(created);
    saveDb(db);
    res.status(201).json(created);
  });

  // Homepage CMS Config
  app.patch('/api/homepage-config', (req, res) => {
    const db = loadDb();
    db.homepageConfig = { ...db.homepageConfig, ...req.body };
    saveDb(db);
    res.json(db.homepageConfig);
  });

  // Newsletter
  app.post('/api/newsletter', (req, res) => {
    const db = loadDb();
    const { email } = req.body as { email?: string };
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address required.' });
    }
    if (!db.newsletterSubscribers.includes(email.toLowerCase())) {
      db.newsletterSubscribers.push(email.toLowerCase());
      saveDb(db);
    }
    res.json({ ok: true, email });
  });

  // Static / Vite integration
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KRONTON server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
