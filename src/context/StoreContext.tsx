import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, User, CartItem, Coupon, Address, Order } from '../types';

interface StoreContextType {
  user: User | null;
  token: string | null;
  cart: CartItem[];
  wishlist: Product[];
  recentlyViewed: Product[];
  categories: string[];
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isAuthOpen: boolean;
  appliedCoupon: Coupon | null;
  coupon: Coupon | null;
  applyCoupon: (coupon: Coupon) => void;
  getCartDiscount: () => number;
  getCartTotal: () => number;
  
  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateAddresses: (addresses: Address[]) => Promise<boolean>;

  // Cart actions
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  getTotalCartItems: () => number;
  getCartSubtotal: () => number;

  // Wishlist actions
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  moveToCartFromWishlist: (product: Product, size: string, color: string) => void;

  // Coupon actions
  validateAndApplyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;

  // Modals
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;

  // General loggers
  addToRecentlyViewed: (product: Product) => void;
  createCheckoutOrder: (orderData: Partial<Order>) => Promise<Order>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('streetvibe_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('streetvibe_token'));
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('streetvibe_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('streetvibe_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    const saved = localStorage.getItem('streetvibe_recent');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories] = useState<string[]>(['shirts', 'pants', 'tshirts', 'shoes', 'accessories']);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem('streetvibe_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('streetvibe_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('streetvibe_recent', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Auth Operations
  const login = async (email: string, password: string) => {
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Login failure' };
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('streetvibe_user', JSON.stringify(data.user));
      localStorage.setItem('streetvibe_token', data.token);
      setAuthOpen(false);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Server network error' };
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, phone })
      });
      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Registration failure' };
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('streetvibe_user', JSON.stringify(data.user));
      localStorage.setItem('streetvibe_token', data.token);
      setAuthOpen(false);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Server network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('streetvibe_user');
    localStorage.removeItem('streetvibe_token');
    setAppliedCoupon(null);
  };

  const updateAddresses = async (addresses: Address[]) => {
    if (!user) return false;
    try {
      const resp = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, addresses })
      });
      if (!resp.ok) return false;
      const updatedUser = await resp.json();
      setUser(updatedUser);
      localStorage.setItem('streetvibe_user', JSON.stringify(updatedUser));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Cart Operations
  const addToCart = (product: Product, size: string, color: string, quantity = 1) => {
    setCart((prev) => {
      const existIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      );
      if (existIdx !== -1) {
        const copy = [...prev];
        copy[existIdx].quantity += quantity;
        return copy;
      }
      return [...prev, { product, size, color, quantity }];
    });
    setCartOpen(true); // Open drawer on addition automatically
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size && item.color === color)));
  };

  const updateCartQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prev) => {
      return prev.map((item) => {
        if (item.product.id === productId && item.size === size && item.color === color) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const getTotalCartItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCartSubtotal = () =>
    cart.reduce((sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity, 0);

  // Wishlist Operations
  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id);
      if (idx !== -1) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => wishlist.some((item) => item.id === productId);

  const moveToCartFromWishlist = (product: Product, size: string, color: string) => {
    addToCart(product, size, color, 1);
    toggleWishlist(product);
  };

  // Coupons
  const validateAndApplyCoupon = async (code: string) => {
    try {
      const resp = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, amount: getCartSubtotal() })
      });
      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error };
      }
      setAppliedCoupon({
        code: data.code,
        discountPercent: data.discountPercent,
        minAmount: 0,
        isActive: true
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Database coupon error' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const coupon = appliedCoupon;
  const applyCoupon = (cp: Coupon) => {
    setAppliedCoupon(cp);
  };

  const getCartDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getCartSubtotal();
    return Math.round((subtotal * appliedCoupon.discountPercent) / 100);
  };

  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    const discount = getCartDiscount();
    return Math.max(0, subtotal - discount);
  };

  // Recently Viewed tracker (limits storage to modern 6 elements)
  const addToRecentlyViewed = (product: Product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item.id !== product.id);
      return [product, ...filtered].slice(0, 6);
    });
  };

  // Place full Mongo Order
  const createCheckoutOrder = async (orderData: Partial<Order>): Promise<Order> => {
    const finalPayload = {
      ...orderData,
      userId: user?.id || undefined,
      cartItems: cart
    };

    const resp = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload)
    });
    
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Unable to store e-commerce checkout order');
    }

    const order = await resp.json();
    clearCart(); // Clean cart on checkout success
    return order;
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        token,
        cart,
        wishlist,
        recentlyViewed,
        categories,
        isCartOpen,
        isSearchOpen,
        isAuthOpen,
        appliedCoupon,
        coupon,
        applyCoupon,
        getCartDiscount,
        getCartTotal,
        login,
        register,
        logout,
        updateAddresses,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getTotalCartItems,
        getCartSubtotal,
        toggleWishlist,
        isInWishlist,
        moveToCartFromWishlist,
        validateAndApplyCoupon,
        removeCoupon,
        setCartOpen,
        setSearchOpen,
        setAuthOpen,
        addToRecentlyViewed,
        createCheckoutOrder
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be run inside a genuine StoreProvider');
  }
  return context;
};
