export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface Category extends CategoryRef {
  icon: string | null;
  position: number;
  _count?: { products: number };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  image: string;
  stock: number;
  hidden?: boolean;
  description?: string;
  specs?: Record<string, string> | null;
  categoryId?: number;
  category: CategoryRef;
}

export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  code: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  guestName: string | null;
  guestPhone: string | null;
  guestAddress: string | null;
  items: OrderItem[];
  user?: { id: number; name: string; email: string; phone: string | null } | null;
}

export interface Suggestion {
  product: Product;
  reason: string;
}

export interface SuggestResult {
  suggestions: Suggestion[];
  source: 'ai' | 'keyword';
}

export interface AdminStats {
  orders: Record<OrderStatus, number>;
  totalOrders: number;
  revenue: number;
  productCount: number;
  customerCount: number;
  lowStockThreshold: number;
  lowStock: Array<{ id: number; name: string; stock: number; hidden: boolean }>;
  recentOrders: Array<{
    id: number;
    code: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
    guestName: string | null;
    user: { name: string } | null;
  }>;
}
