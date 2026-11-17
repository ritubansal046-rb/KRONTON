export type ProductDivision = 'new' | 'refurbished' | 'kit';

export type RefurbishedGrade = 'A' | 'B' | 'C' | 'D';

export type RefurbishmentStage =
  | 'Product Acquisition'
  | 'Receiving'
  | 'Unique ID Assigned'
  | 'Physical Inspection'
  | 'Electrical Inspection'
  | 'Functional Testing'
  | 'Fault Identification'
  | 'Approved Repair'
  | 'Cleaning'
  | 'Final Functional Testing'
  | 'Condition Grading'
  | 'Photography'
  | 'Pricing Approval'
  | 'Inventory Approval'
  | 'Published';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  subcategories: string[];
  attributes: string[];
  order: number;
  enabled: boolean;
}

export interface RefurbishmentLogEntry {
  stage: RefurbishmentStage;
  date: string;
  technician: string;
  notes: string;
}

export interface KitComponentItem {
  name: string;
  qty: number;
  spec: string;
}

export interface Product {
  id: string;
  division: ProductDivision;
  name: string;
  sku: string;
  brand: string;
  manufacturer: string;
  modelNumber: string;
  categoryId: string;
  subcategory: string;
  shortDescription: string;
  description: string;
  images: string[];
  specifications: Record<string, string>;
  datasheetSummary: string;
  mrp: number;
  price: number;
  discountPercent: number;
  gstRate: number;
  hsnCode: string;
  stock: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Under Inspection' | 'Parts Only';
  warranty: string;
  returnEligible: boolean;
  estimatedDelivery: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  rating: number;
  reviewCount: number;
  // Refurbished specific
  unitId?: string;
  grade?: RefurbishedGrade;
  newComparisonPrice?: number;
  linkedNewProductId?: string;
  physicalCondition?: string;
  functionalTestSummary?: string;
  testingStatus?: 'Passed All Tests' | 'Under Inspection' | 'Repair Required';
  knownLimitations?: string;
  repairHistory?: string[];
  workflowStage?: RefurbishmentStage;
  refurbishmentHistory?: RefurbishmentLogEntry[];
  // SMM Kit specific
  includedComponents?: KitComponentItem[];
  intendedApplications?: string[];
  difficultyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  documentationSummary?: string;
}

export type BuybackCondition =
  | 'Brand New / Unused'
  | 'Like New'
  | 'Good Working Condition'
  | 'Minor Physical Defects'
  | 'Partially Functional'
  | 'Not Working'
  | 'For Parts Only';

export type BuybackStatus =
  | 'Submitted'
  | 'Initial Review'
  | 'Estimated Offer Issued'
  | 'Pickup / Transit'
  | 'Lab Inspection'
  | 'Final Offer Issued'
  | 'Offer Accepted'
  | 'Offer Rejected'
  | 'Payment Processed'
  | 'Completed';

export interface BuybackRequest {
  requestId: string;
  userId?: string;
  fullName: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  categoryId: string;
  productName: string;
  brand: string;
  modelNumber: string;
  description: string;
  quantity: number;
  purchaseDate?: string;
  originalPurchasePrice?: number;
  invoiceRef?: string;
  expectedSellingPrice?: number;
  condition: BuybackCondition;
  images: string[];
  knownDefects: string;
  functionalStatus: string;
  includedAccessories: string;
  reasonForSelling: string;
  comments: string;
  payoutMethod: 'UPI' | 'Bank Transfer' | 'Store Credit';
  legalOwnerConfirmed: boolean;
  notStolenConfirmed: boolean;
  accurateInfoConfirmed: boolean;
  termsAccepted: boolean;
  status: BuybackStatus;
  estimatedOffer: number | null;
  finalOffer: number | null;
  adminNotes: string;
  convertedToRefurbishedId?: string;
  timeline: { status: string; timestamp: string; note: string }[];
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  division: ProductDivision;
  unitId?: string;
  grade?: RefurbishedGrade;
  price: number;
  qty: number;
  gstRate: number;
  imageUrl: string;
}

export type OrderStatus =
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Return Requested';

export interface Order {
  orderId: string;
  userId?: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  gstin?: string;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'UPI' | 'Card / NetBanking' | 'Cash on Delivery (COD)';
  paymentStatus: 'Paid' | 'Pending COD';
  orderStatus: OrderStatus;
  trackingTimeline: { status: string; timestamp: string; location: string }[];
  returnRequest?: { reason: string; status: string; requestedAt: string };
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  authorRole: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  orderOrBuybackId?: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'customer' | 'admin';
  city: string;
  state: string;
  pinCode: string;
  address: string;
}

export interface HomepageConfig {
  announcementText: string;
  showAnnouncement: boolean;
  heroHeadline: string;
  heroDescription: string;
  showCategoriesSection: boolean;
  showDealsSection: boolean;
  showKitsSection: boolean;
  showBuybackSection: boolean;
  showReviewsSection: boolean;
}

export interface KrontonDatabase {
  categories: Category[];
  products: Product[];
  buybackRequests: BuybackRequest[];
  orders: Order[];
  reviews: Review[];
  supportTickets: SupportTicket[];
  users: UserAccount[];
  homepageConfig: HomepageConfig;
  newsletterSubscribers: string[];
}
