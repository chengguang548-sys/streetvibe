import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { API_BASE_URL } from '../config/api';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User as UserIcon, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Menu, 
  ArrowRight,
  LogOut,
  Sliders,
  Check,
  ShoppingBag as BagIcon
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

export default function Header() {
  const {
    user,
    cart,
    wishlist,
    isCartOpen,
    setCartOpen,
    isSearchOpen,
    setSearchOpen,
    isAuthOpen,
    setAuthOpen,
    login,
    register,
    logout,
    removeFromCart,
    updateCartQuantity,
    getCartSubtotal,
    getTotalCartItems,
    appliedCoupon,
    validateAndApplyCoupon,
    removeCoupon
  } = useStore();

  const navigate = useNavigate();
  const location = useLocation();

  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Search drawer state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auth modal states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  // Listen to scrolls for Sticky transition
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync Search results
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/api/products?search=${encodeURIComponent(searchQuery)}`);
        const data = await resp.json();
        setSearchResults(data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Reset modal or search drawers on route shifts
  useEffect(() => {
    setSearchOpen(false);
    setCartOpen(false);
    setIsMobileMenuOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (authMode === 'login') {
      const res = await login(authEmail, authPassword);
      if (res.success) {
        setAuthSuccessMsg('Logged in successfully!');
        setTimeout(() => setAuthOpen(false), 900);
      } else {
        setAuthError(res.error || 'Invalid credentials');
      }
    } else {
      const res = await register(authEmail, authPassword, authFirstName, authLastName, authPhone);
      if (res.success) {
        setAuthSuccessMsg('Account created successfully!');
        setTimeout(() => setAuthOpen(false), 900);
      } else {
        setAuthError(res.error || 'Failed to register');
      }
    }
  };

  const handleApplyCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;

    const res = await validateAndApplyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.error || 'Invalid coupon code');
    } else {
      setCouponInput('');
    }
  };

  const autofillUser = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setAuthEmail('sheltonantony43@gmail.com');
      setAuthPassword('admin123');
    } else {
      setAuthEmail('customer@streetvibe.com');
      setAuthPassword('customer123');
    }
  };

  // Calculations
  const subtotal = getCartSubtotal();
  const totalItems = getTotalCartItems();
  const shippingThreshold = 999;
  const isFreeShipping = subtotal >= shippingThreshold;
  const shippingCharge = subtotal > 0 && !isFreeShipping ? 99 : 0;
  const taxCharge = Math.round(subtotal * 0.18); // 18% standard IGST
  const couponDiscount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercent) / 100) : 0;
  const finalTotal = subtotal - couponDiscount + shippingCharge + taxCharge;

  const categoriesList = [
    { name: 'Shirts', path: '/shop/shirts' },
    { name: 'Pants', path: '/shop/pants' },
    { name: 'T-Shirts', path: '/shop/tshirts' },
    { name: 'Shoes', path: '/shop/shoes' },
    { name: 'Accessories', path: '/shop/accessories' }
  ];

  return (
    <>
      {/* FIXED TOP WRAPPER TO PREVENT LAYOUT SHIFT AND GAP */}
      <div className="fixed top-0 left-0 w-full z-40">
        {/* 1. TOP ANNOUNCEMENT BAR */}
        <div 
          id="top-announcement" 
          className={`bg-brand-charcoal text-brand-white text-xs px-4 flex flex-wrap justify-between items-center font-montserrat font-medium tracking-wide transition-all duration-300 overflow-hidden ${
            isSticky 
              ? 'h-0 py-0 opacity-0' 
              : 'h-[32px] py-1.5 opacity-100 border-b border-brand-charcoal/10'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-brand-sky animate-pulse"></span>
            <span>FREE SHIPPING ABOVE ₹999</span>
          </div>
          <div className="hidden md:flex space-x-6 text-[11px]">
            <span>⚡ EASY 14-DAY RETURNS</span>
            <span>🔒 100% SECURE CHECKOUT</span>
            <span>⚙️ CUSTOMER SUPPORT</span>
          </div>
        </div>

        {/* 2. MAIN HEADER (WITH STICKY MINIFICATION) */}
        <header 
          id="main-nav"
          className={`w-full transition-all duration-300 bg-brand-white border-b border-brand-off ${
            isSticky 
              ? 'shadow-md py-2.5' 
              : 'py-3 md:py-4'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center relative">
            {/* Mobile Menu Icon */}
            <button 
              id="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-brand-charcoal focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* BRAND LOGO & TAGLINE */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 md:relative md:left-0 md:translate-x-0 md:top-auto md:translate-y-0 flex flex-col items-center md:items-start select-none z-10">
              <Link to="/" className="group flex items-center">
                <Logo variant="horizontal" color="original" size="md" className="group-hover:opacity-90 duration-250 transition-opacity" />
              </Link>
            </div>

          {/* DESKTOP NAVIGATION MENU */}
          <nav className="hidden md:flex items-center space-x-8 font-montserrat font-bold text-[13px] tracking-wider uppercase text-brand-black">
            <Link to="/" className="hover:text-brand-gray transition-colors">Home</Link>
            <Link to="/shop" className="hover:text-brand-gray transition-colors">Shop All</Link>
            
            {/* Elegant Mega Menu Dropdown */}
            <div className="relative group/mega">
              <span className="hover:text-brand-gray transition-colors cursor-pointer flex items-center space-x-1">
                Categories
              </span>
              <div className="absolute top-[18px] left-1/2 -translate-x-1/2 mt-3 w-[500px] bg-brand-white border border-brand-off p-6 rounded shadow-xl opacity-0 invisible group-hover/mega:opacity-100 group-hover/mega:visible transition-all duration-300 grid grid-cols-2 gap-4 z-50">
                <div className="border-r border-brand-off pr-4">
                  <h4 className="text-xs font-extrabold text-brand-gray tracking-widest uppercase mb-3">Shop Apparel</h4>
                  <div className="flex flex-col space-y-2 font-medium text-xs normal-case">
                    <Link to="/shop/shirts" className="hover:text-brand-gray transition-colors py-1">Premium Shirts</Link>
                    <Link to="/shop/pants" className="hover:text-brand-gray transition-colors py-1">Tailored Pants</Link>
                    <Link to="/shop/tshirts" className="hover:text-brand-gray transition-colors py-1">Heavybox T-Shirts</Link>
                  </div>
                </div>
                <div className="pl-2">
                  <h4 className="text-xs font-extrabold text-brand-gray tracking-widest uppercase mb-3">Essentials</h4>
                  <div className="flex flex-col space-y-2 font-medium text-xs normal-case">
                    <Link to="/shop/shoes" className="hover:text-brand-gray transition-colors py-1">Leather Shoes</Link>
                    <Link to="/shop/accessories" className="hover:text-brand-gray transition-colors py-1">Premium Accessories</Link>
                    <div className="border-t border-brand-off my-2 pt-2">
                      <Link to="/shop?sort=popular" className="text-brand-gray font-bold hover:underline">Polished Best Sellers</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Link to="/shop?tag=new-arrivals" className="hover:text-brand-gray transition-colors">New Arrivals</Link>
            <Link to="/shop?tag=sale" className="text-red-500 hover:text-red-700 transition-colors">Sale</Link>
            <Link to="/contact" className="hover:text-brand-gray transition-colors">Contact</Link>
          </nav>

          {/* DESKTOP INTEGRATED SYSTEM BUTTONS */}
          <div className="flex items-center space-x-2 xs:space-x-4">
            {/* Search Toggle */}
            <button 
              id="search-toggle-btn"
              onClick={() => setSearchOpen(!isSearchOpen)} 
              className="p-2 text-brand-charcoal hover:text-brand-gray transition-colors focus:outline-none"
              aria-label="Open Search"
            >
              <Search className="w-[19px] h-[19px]" />
            </button>

            {/* Wishlist Link - Hidden on mobile for clutter-free UI */}
            <Link 
              to="/wishlist" 
              className="hidden sm:block p-2 text-brand-charcoal hover:text-brand-gray transition-colors relative"
              aria-label="View Wishlist"
            >
              <Heart className="w-[19px] h-[19px]" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-charcoal text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Account Panel Link or Trigger - Hidden on mobile */}
            <div className="hidden sm:block">
              {user ? (
                <div className="flex items-center space-x-2">
                  <Link 
                    to="/profile" 
                    className="p-2 text-brand-charcoal hover:text-brand-gray transition-colors flex items-center space-x-1"
                    aria-label="Go to User Profile"
                  >
                    <UserIcon className="w-[19px] h-[19px]" />
                    <span className="hidden lg:inline text-xs font-bold leading-none truncate max-w-[80px]">
                      Hi, {user.firstName}
                    </span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-[10px] bg-brand-charcoal text-brand-white px-2 py-1 rounded font-extrabold uppercase tracking-widest font-montserrat">
                      Admin
                    </Link>
                  )}
                  <button 
                    onClick={logout} 
                    title="Logout Account" 
                    className="p-2 text-brand-gray hover:text-red-500 transition-colors focus:outline-none"
                  >
                    <LogOut className="w-[16px] h-[16px]" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setAuthMode('login'); setAuthOpen(true); }} 
                  className="p-2 text-brand-charcoal hover:text-brand-gray transition-colors focus:outline-none flex items-center space-x-1"
                  aria-label="Open Login Portal"
                >
                  <UserIcon className="w-[19px] h-[19px]" />
                  <span className="hidden lg:inline text-xs font-bold tracking-wider uppercase font-montserrat">Sign In</span>
                </button>
              )}
            </div>

            {/* Shopping Bag Icon with Drawer Trigger */}
            <button 
              id="cart-toggle-btn"
              onClick={() => setCartOpen(!isCartOpen)}
              className="p-2 text-brand-charcoal hover:text-brand-gray transition-colors relative focus:outline-none flex items-center"
              aria-label="Toggle Shopping Cart"
            >
              <ShoppingBag className="w-[20px] h-[20px]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-sky text-brand-charcoal text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-extrabold font-mono">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </div>

      {/* 3. INTERACTIVE DROPDOWN SEARCH DRAWER */}
      {isSearchOpen && (
        <div id="search-drawer" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-start">
          <div className="w-full bg-brand-white shadow-xl py-8 px-6 md:px-12 border-b border-brand-off transition-transform duration-500 transform translate-y-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-montserrat font-bold text-lg uppercase tracking-wide">Live Fuzzy Search Suggestions</h3>
                <button 
                  onClick={() => setSearchOpen(false)} 
                  className="p-2 text-brand-charcoal hover:bg-brand-off rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray w-5 h-5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query premium products, categories, e.g. Flannel Shirt, Suede Jogger, Shoes..."
                  className="w-full pl-12 pr-6 py-4 bg-brand-off rounded-lg text-brand-charcoal border-none font-sans text-base focus:ring-2 focus:ring-brand-sky focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Suggestions results lists */}
              <div className="max-h-[350px] overflow-y-auto mt-4 space-y-4">
                {isSearching && (
                  <div className="text-center py-6 text-brand-gray font-mono text-sm">Querying matching collections...</div>
                )}
                {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-6 text-brand-gray">No items match "{searchQuery}"</div>
                )}
                {searchResults.map((prod) => (
                  <Link 
                    key={prod.id}
                    to={`/product/${prod.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center space-x-4 p-2 hover:bg-brand-off rounded transition-colors group"
                  >
                    <img 
                      src={prod.images[0]} 
                      alt={prod.name} 
                      className="w-12 h-14 object-cover rounded bg-brand-off"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <h4 className="font-montserrat font-bold text-xs text-brand-charcoal group-hover:text-brand-gray transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-brand-gray font-medium capitalize">{prod.category} by StreetVibe</p>
                    </div>
                    <div className="text-right">
                      {prod.discountPrice ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-brand-charcoal">₹{prod.discountPrice}</span>
                          <span className="text-[10px] line-through text-brand-gray">₹{prod.price}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-brand-charcoal">₹{prod.price}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SHOPPING SLIDEOUT CART DRAWER */}
      {isCartOpen && (
        <div id="cart-drawer" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-brand-white shadow-2xl h-full flex flex-col transition-all">
            {/* Header */}
            <div className="p-6 border-b border-brand-off flex justify-between items-center bg-brand-off">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-brand-charcoal" />
                <h3 className="font-montserrat font-bold text-sm uppercase tracking-wider text-brand-charcoal">
                  Your Cart ({totalItems})
                </h3>
              </div>
              <button 
                onClick={() => setCartOpen(false)} 
                className="p-2 text-brand-charcoal hover:bg-brand-white rounded-full transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Indicator */}
            <div className="bg-brand-ice/40 px-6 py-3 border-b border-brand-off text-xs text-brand-charcoal select-none">
              {isFreeShipping ? (
                <div className="flex items-center space-x-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Congratulations! You qualify for <strong className="font-bold underline">FREE Standard Shipping</strong>.</span>
                </div>
              ) : (
                <p>
                  Add <strong className="font-bold">₹{shippingThreshold - subtotal}</strong> more to unlock <strong className="font-bold">FREE Standard Shipping</strong>.
                </p>
              )}
              {/* Progress bar container */}
              <div className="w-full bg-brand-off h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-brand-charcoal h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Cart list items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 select-none">
                  <BagIcon className="w-12 h-12 text-brand-gray" />
                  <p className="text-sm font-sans text-brand-gray">Your cart is currently empty.</p>
                  <Link 
                    to="/shop" 
                    onClick={() => setCartOpen(false)}
                    className="bg-brand-charcoal text-brand-white font-montserrat font-bold text-xs uppercase px-6 py-3 tracking-wider rounded duration-200 hover:bg-brand-gray"
                  >
                    Return To Shop
                  </Link>
                </div>
              ) : (
                cart.map((item) => {
                  const pPrice = item.product.discountPrice || item.product.price;
                  return (
                    <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex space-x-4 border-b border-brand-off pb-4">
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name} 
                        className="w-16 h-20 object-cover bg-brand-off rounded shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <Link 
                              to={`/product/${item.product.slug}`}
                              onClick={() => setCartOpen(false)}
                              className="font-montserrat font-extrabold text-xs text-brand-charcoal hover:text-brand-gray line-clamp-1"
                            >
                              {item.product.name}
                            </Link>
                            <button 
                              onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                              className="text-brand-gray hover:text-red-500 transition-colors p-1"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex space-x-3 text-[11px] text-brand-gray mt-1">
                            <span>Size: <strong>{item.size}</strong></span>
                            <span>Color: <strong>{item.color}</strong></span>
                          </div>
                        </div>

                        {/* Adjust Qty */}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center border border-brand-off rounded overflow-hidden bg-brand-off">
                            <button 
                              onClick={() => updateCartQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                              className="p-1.5 hover:bg-white text-brand-charcoal transition-colors focus:outline-none"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-bold text-brand-charcoal">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                              className="p-1.5 hover:bg-white text-brand-charcoal transition-colors focus:outline-none"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-brand-charcoal">
                            ₹{pPrice * item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Calculations and Coupon Summary */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-brand-off bg-brand-off space-y-4">
                {/* Coupon input */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 text-xs px-3 py-2 rounded border border-emerald-200">
                    <span className="font-medium">Coupon <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.discountPercent}% OFF)</span>
                    <button onClick={removeCoupon} className="font-extrabold text-red-500 hover:underline text-[10px]">REMOVE</button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCouponSubmit} className="flex space-x-2">
                    <input 
                      type="text" 
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Try: WELCOME15 or STREET10"
                      className="flex-1 bg-brand-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky focus:outline-none uppercase font-semibold"
                    />
                    <button 
                      type="submit" 
                      className="bg-brand-charcoal text-brand-white font-montserrat font-bold text-xs px-4 py-2 uppercase hover:bg-brand-gray rounded duration-200"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && (<p className="text-[11px] text-red-500 font-medium leading-none">{couponError}</p>)}

                {/* Pricing Summary */}
                <div className="space-y-1.5 text-xs text-brand-gray">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-brand-charcoal">₹{subtotal}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({appliedCoupon.discountPercent}%)</span>
                      <span className="font-bold">-₹{couponDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Standard Shipping</span>
                    <span className="font-bold text-brand-charcoal">
                      {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18% inclusive)</span>
                    <span className="font-bold text-brand-charcoal">₹{taxCharge}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-brand-charcoal pt-2 border-t border-brand-gray/20">
                    <span className="font-montserrat text-xs uppercase tracking-wide">Estimated Total</span>
                    <span className="font-mono">₹{finalTotal}</span>
                  </div>
                </div>

                {/* Checkout Trigger button */}
                <button 
                  onClick={() => {
                    setCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full bg-brand-charcoal text-brand-white font-montserrat font-bold text-xs uppercase py-3.5 tracking-widest rounded shadow-md hover:bg-brand-black transition-all flex items-center justify-center space-x-2 mt-4"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. USER AUTHENTICATION MODAL */}
      {isAuthOpen && (
        <div id="auth-modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-white rounded-lg shadow-2xl relative overflow-hidden">
            {/* Modal Closer */}
            <button 
              onClick={() => setAuthOpen(false)} 
              className="absolute top-4 right-4 p-2 text-brand-charcoal hover:bg-brand-off rounded-full transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Switch tabs layout */}
            <div className="flex border-b border-brand-off bg-brand-off">
              <button 
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`w-1/2 py-4 font-montserrat font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${
                  authMode === 'login' 
                    ? 'border-brand-charcoal bg-brand-white text-brand-charcoal' 
                    : 'border-transparent text-brand-gray'
                }`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`w-1/2 py-4 font-montserrat font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${
                  authMode === 'register' 
                    ? 'border-brand-charcoal bg-brand-white text-brand-charcoal' 
                    : 'border-transparent text-brand-gray'
                }`}
              >
                Join StreetVibe
              </button>
            </div>

            <div className="p-8">
              <h4 className="font-montserrat font-extrabold text-sm uppercase tracking-wider mb-2 text-center text-brand-charcoal">
                {authMode === 'login' ? 'Welcome Back To StreetVibe' : 'Create Premium Credentials'}
              </h4>
              <p className="text-xs text-brand-gray mb-6 text-center">Unlock order histories, delivery trackings, and stored wishlists.</p>

              {authError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded border border-red-200 mb-4 font-medium text-center">
                  {authError}
                </div>
              )}
              {authSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded border border-emerald-200 mb-4 font-medium text-center">
                  {authSuccessMsg}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-brand-gray uppercase tracking-widest mb-1">First Name</label>
                      <input 
                        type="text" 
                        required
                        value={authFirstName}
                        onChange={(e) => setAuthFirstName(e.target.value)}
                        className="w-full bg-brand-off border border-brand-off rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky focus:outline-none text-brand-charcoal"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-brand-gray uppercase tracking-widest mb-1">Last Name</label>
                      <input 
                        type="text" 
                        value={authLastName}
                        onChange={(e) => setAuthLastName(e.target.value)}
                        className="w-full bg-brand-off border border-brand-off rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky focus:outline-none text-brand-charcoal"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold text-brand-gray uppercase tracking-widest mb-1">Email ID</label>
                  <input 
                    type="email" 
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-brand-off border border-brand-off rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky focus:outline-none text-brand-charcoal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-brand-gray uppercase tracking-widest mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-brand-off border border-brand-off rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky focus:outline-none text-brand-charcoal"
                  />
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-extrabold text-brand-gray uppercase tracking-widest mb-1">Phone (Optional)</label>
                    <input 
                      type="text" 
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+91"
                      className="w-full bg-brand-off border border-brand-off rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky focus:outline-none text-brand-charcoal"
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-brand-charcoal text-brand-white font-montserrat font-bold text-xs uppercase py-3 tracking-widest rounded shadow hover:bg-brand-gray transition-colors mt-2"
                >
                  {authMode === 'login' ? 'Confirm Credentials' : 'Register Account'}
                </button>
              </form>

              {/* DEMO ACCOUNTS ACCELERATORS */}
              <div className="border-t border-brand-off mt-6 pt-5">
                <span className="block text-center text-[10px] uppercase font-extrabold tracking-widest text-brand-gray mb-3">
                  Click to instant login demo account
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => autofillUser('admin')}
                    className="border border-brand-charcoal/20 bg-brand-off text-brand-charcoal text-[11px] py-2 rounded hover:bg-brand-charcoal hover:text-brand-white duration-200 transition-all font-semibold"
                  >
                    🔐 Admin Demo
                  </button>
                  <button 
                    onClick={() => autofillUser('user')}
                    className="border border-brand-charcoal/20 bg-brand-off text-brand-charcoal text-[11px] py-2 rounded hover:bg-brand-charcoal hover:text-brand-white duration-200 transition-all font-semibold"
                  >
                    👤 Customer Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MOBILE SIDE PANEL NAVIGATION */}
      {isMobileMenuOpen && (
        <div id="mobile-menu-drawer" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-start">
          <div className="w-3/4 max-w-xs bg-brand-white h-full shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-8">
                <Logo variant="horizontal" color="original" size="sm" />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 text-brand-charcoal hover:bg-brand-off rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col space-y-4 font-montserrat font-bold text-sm tracking-wider uppercase text-brand-charcoal">
                <Link to="/" className="hover:text-brand-gray py-1">Home</Link>
                <Link to="/shop" className="hover:text-brand-gray py-1">Shop All</Link>
                <div className="border-t border-brand-off my-2 pt-2 text-[11px] text-brand-gray tracking-widest uppercase">
                  Apparel Catalog
                </div>
                {categoriesList.map((cat) => (
                  <Link 
                    key={cat.path}
                    to={cat.path} 
                    className="text-xs font-semibold pl-2 hover:text-brand-gray transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
                <div className="border-t border-brand-off my-2"></div>
                <Link to="/shop?tag=new-arrivals" className="hover:text-brand-gray py-1">New Arrivals</Link>
                <Link to="/shop?tag=sale" className="text-red-500 hover:text-red-700 py-1">Sale Discount</Link>
                <Link to="/contact" className="hover:text-brand-gray py-1">Contact Support</Link>
              </nav>
            </div>

            <div className="border-t border-brand-off pt-6">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-brand-charcoal" />
                    <span className="text-xs font-bold font-montserrat">{user.firstName} {user.lastName}</span>
                  </div>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                    className="w-full bg-brand-charcoal text-brand-white text-xs font-montserrat font-bold uppercase py-2 tracking-wider rounded text-center block"
                  >
                    Logout Account
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); setAuthMode('login'); setAuthOpen(true); }}
                  className="w-full bg-brand-charcoal text-brand-white text-xs font-montserrat font-bold uppercase py-3 tracking-wider rounded text-center block"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
