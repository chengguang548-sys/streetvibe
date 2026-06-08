import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Trash2, ArrowRight, Tag, Percent, Info, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Cart() {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    coupon, 
    applyCoupon, 
    removeCoupon,
    getCartSubtotal,
    getCartDiscount,
    getCartTotal
  } = useStore();

  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    if (!promoCode.trim()) return;

    setIsActivating(true);
    try {
      const resp = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.toUpperCase(), subtotal: getCartSubtotal() })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setPromoError(data.error || 'Failed to apply coupon.');
      } else {
        applyCoupon(data.coupon);
        setPromoSuccess(`Promo Code Applied: flat ${data.coupon.discountType === 'percent' ? `${data.coupon.discountValue}%` : `₹${data.coupon.discountValue}`} discount applied!`);
        setPromoCode('');
      }
    } catch {
      setPromoError('Database validation error.');
    } finally {
      setIsActivating(false);
    }
  };

  const subtotal = getCartSubtotal();
  const discount = getCartDiscount();
  const shippingFee = subtotal > 999 ? 0 : 99;
  const gstInclusive = Math.round((subtotal * 18) / 118); // 18% inclusive GST
  const grandTotal = getCartTotal() + shippingFee;

  return (
    <div id="cart-page" className="pb-16 select-none bg-brand-white">
      {/* Clickable breadcrumbs */}
      <Breadcrumbs />

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="border-b border-brand-off pb-4 mb-8">
          <h1 className="font-montserrat font-black text-xl md:text-2xl tracking-tight text-brand-charcoal uppercase">
            MY SHOPPING BAG
          </h1>
          <p className="text-xs text-brand-gray pt-1 font-semibold leading-relaxed">
            Manage your premium wardrobe selections and apply promo discounts ({cart.reduce((ac, it) => ac + it.quantity, 0)} Items)
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-24 border border-brand-off bg-brand-off/30 rounded-lg flex flex-col items-center justify-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-brand-gray" />
            <h3 className="font-montserrat font-bold text-xs uppercase tracking-widest text-brand-charcoal animate-pulse">Your Bag is Empty</h3>
            <p className="text-xs text-brand-gray max-w-sm font-semibold leading-relaxed">Fill your shopping cart with StreetVibe organic shirts, tailored pants, and casual footwear collections.</p>
            <Link 
              to="/shop"
              className="bg-brand-charcoal text-white font-montserrat font-extrabold text-[10px] py-3.5 px-10 uppercase tracking-widest rounded shadow hover:bg-brand-gray duration-200 cursor-pointer"
            >
              Start Shopping Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart items table lists (7 Columns) */}
            <div className="lg:col-span-8 space-y-4">
              {cart.map((item) => {
                const itemPrice = item.product.discountPrice || item.product.price;
                const totalItemSum = itemPrice * item.quantity;
                return (
                  <div 
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-brand-off rounded hover:shadow-xs p-4 gap-4"
                  >
                    {/* Item identification */}
                    <div className="flex items-center space-x-4">
                      <Link to={`/product/${item.product.slug}`} className="w-[60px] h-[80px] shrink-0 rounded overflow-hidden bg-brand-off block border">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </Link>

                      <div className="space-y-1">
                        <Link 
                          to={`/product/${item.product.slug}`} 
                          className="font-montserrat font-extrabold text-xs text-brand-charcoal hover:text-brand-gray transition-colors line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-brand-gray uppercase tracking-wider">
                          <span>Size: <strong className="text-brand-charcoal">{item.size}</strong></span>
                          <span>|</span>
                          <span>Style: <strong className="text-brand-charcoal">{item.color}</strong></span>
                        </div>
                        <div className="flex items-center space-x-2 pt-0.5">
                          <span className="text-xs font-black text-brand-charcoal font-sans">₹{itemPrice}</span>
                          {item.product.discountPrice && (
                            <span className="text-[10px] line-through text-brand-gray font-sans">₹{item.product.price}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Operational counter & total sum */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-4">
                      <div className="flex items-center border border-brand-off rounded bg-brand-off scale-90">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.size, item.color, Math.max(1, item.quantity - 1))}
                          className="px-2.5 py-1 hover:bg-white text-brand-charcoal font-sans transition-colors font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold text-brand-charcoal font-mono">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                          className="px-2.5 py-1 hover:bg-white text-brand-charcoal font-sans transition-colors font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right sm:min-w-[80px]">
                        <span className="text-xs font-black text-brand-charcoal font-sans">₹{totalItemSum}</span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                        className="p-2 hover:bg-red-50 text-brand-gray hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Delete garment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Helper disclaimer of limits */}
              <div className="bg-brand-off/40 border border-brand-off/65 rounded p-4 flex items-start space-x-2.5 text-[11px] text-brand-gray font-semibold">
                <Info className="w-4 h-4 text-brand-sky shrink-0 mt-0.5" />
                <p className="leading-relaxed">Note: Ground delivery is self-scheduled within Bangalore, Karnataka. Flat dispatch fee of ₹99 applies for orders under ₹999. In-stock garments typically deliver within 3 days.</p>
              </div>
            </div>

            {/* Right Column: Order Pricing Summary (4 Columns) */}
            <div className="lg:col-span-4 bg-brand-off border border-brand-off/10 rounded overflow-hidden p-6 space-y-6">
              <h3 className="font-montserrat font-bold text-xs uppercase tracking-wider text-brand-charcoal pb-3 border-b-2 border-brand-sky">
                Order Billing Details
              </h3>

              {/* Coupon submissions */}
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold tracking-wider text-brand-gray uppercase">PROMO COUPON CODE</span>
                
                {coupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded text-xs font-semibold">
                    <div className="flex items-center space-x-2">
                      <Percent className="w-4 h-4 text-emerald-600" />
                      <span>Applied: <strong>{coupon.code}</strong></span>
                    </div>
                    <button onClick={removeCoupon} className="p-1 hover:bg-emerald-100 rounded text-emerald-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex space-x-1">
                    <input 
                      type="text" 
                      required
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Ex. WELCOME10 or SUPER50"
                      className="flex-1 bg-white border border-brand-gray/30 rounded px-2.5 py-1.5 text-xs text-brand-charcoal focus:outline-none focus:ring-1 focus:ring-brand-sky outline-none font-bold placeholder:font-medium uppercase"
                    />
                    <button 
                      type="submit" 
                      disabled={isActivating}
                      className="bg-brand-charcoal text-white font-montserrat font-bold text-xs uppercase px-4.5 py-1.5 hover:bg-brand-gray transition-colors rounded leading-none disabled:opacity-50"
                    >
                      {isActivating ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {promoError && <p className="text-[10px] text-red-500 font-bold leading-tight uppercase">* {promoError}</p>}
                {promoSuccess && <p className="text-[10px] text-emerald-600 font-bold leading-tight uppercase">* {promoSuccess}</p>}
                
                {/* Visual tag tip */}
                {!coupon && (
                  <span className="block text-[9px] text-brand-gray font-bold uppercase leading-none">
                    Tip: Use code <strong className="text-brand-charcoal underline">WELCOME10</strong> to try 10% discounts flat.
                  </span>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3.5 text-xs font-semibold text-brand-gray pt-2 border-t border-brand-off select-none pb-4">
                <div className="flex justify-between">
                  <span>Bag Subtotal:</span>
                  <span className="text-brand-charcoal font-bold font-sans">₹{subtotal}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount reduction:</span>
                    <span className="font-bold font-sans">- ₹{discount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping dispatch fee:</span>
                  <span className="text-brand-charcoal font-bold font-sans">
                    {shippingFee === 0 ? 'FREE Ground Shipping' : `₹${shippingFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-brand-gray font-medium border-t border-dashed border-brand-off pt-2">
                  <span>Included GST (18% value):</span>
                  <span>₹{gstInclusive}</span>
                </div>

                <div className="flex justify-between text-sm text-brand-charcoal font-black border-t-2 border-brand-charcoal pt-3">
                  <span>GRAND BILL TOTAL:</span>
                  <span className="font-sans">₹{grandTotal}</span>
                </div>
              </div>

              {/* Proceed */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-brand-charcoal hover:bg-brand-black text-[#B8E1F0] py-4 text-xs font-montserrat font-black uppercase tracking-widest rounded-lg transition-all shadow-md flex items-center justify-center space-x-2 hover:scale-[1.01] hover:shadow-lg cursor-pointer"
              >
                <span>PROCEED TO SECURED CHECKOUT</span>
                <ArrowRight className="w-4 h-4 text-brand-sky" />
              </button>

              <div className="text-center pt-2 select-none">
                <Link to="/shop" className="text-[10px] text-brand-gray hover:text-brand-charcoal underline font-bold uppercase">
                  Continue browsing and adding things
                </Link>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
