export interface Product {
  id: string; // mapping from DB ID or local generated
  name: string;
  slug: string;
  category: string; // shirts, pants, t-shirts, shoes, accessories
  brand: string;
  price: number;
  discountPrice?: number;
  description: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviewsCount: number;
  fabricDetails?: string;
  shippingInfo?: string;
  returnsInfo?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'admin';
  addresses?: Address[];
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
}

export interface OrderProduct {
  productId: string;
  productName: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Order {
  id?: string;
  orderId: string;
  userId?: string;
  customerName: string;
  email: string;
  phone: string;
  address: any;
  shippingAddress?: any;
  products: OrderProduct[];
  items?: any[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  amount?: number;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  status?: string;
  orderStatus: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minAmount: number;
  isActive: boolean;
}

export interface Newsletter {
  email: string;
  subscribedAt: string;
}

export interface Contact {
  name: string;
  email: string;
  message: string;
  createdAt: string;
}
