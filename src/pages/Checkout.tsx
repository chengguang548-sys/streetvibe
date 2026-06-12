import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, CheckCircle, Printer, ArrowLeft, ArrowRight, Sparkles, Building, KeyRound, QrCode } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { API_BASE_URL } from '../config/api';

export default function Checkout() {
  const { 
    cart, 
    coupon, 
    getCartSubtotal, 
    getCartDiscount, 
    getCartTotal, 
    clearCart,
    user 
  } = useStore();

  const navigate = useNavigate();

  // Redirect if cart is empty and no checkout is active
  useEffect(() => {
    if (cart.length === 0 && !orderSuccessRecord) {
      navigate('/cart');
    }
  }, [cart]);

  // Step indicator state
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [state, setState] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('');

  // Shipping Speed Option
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'stripe' | 'razorpay' | 'upi'>('cod');
  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Order state outcomes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessRecord, setOrderSuccessRecord] = useState<any | null>(null);
  const [submittingError, setSubmittingError] = useState('');

  // Calculations
  const subtotalValue = getCartSubtotal();
  const promotionDiscount = getCartDiscount();
  const transportCost = shippingMethod === 'standard' 
    ? (subtotalValue > 999 ? 0 : 99) 
    : 199;
  const netPayableBill = getCartTotal() + transportCost;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingError('');
    if (activeStep === 1) {
      if (!email || !phone || !firstName || !address || !pinCode) {
        setSubmittingError('Missing mandatory contact address parameters.');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      setActiveStep(3);
    }
  };

  const handlePrevStep = () => {
    setActiveStep((prev) => (prev > 1 ? prev - 1 : 1) as any);
  };

  const handleOrderSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingError('');
    setIsSubmitting(true);

    if (paymentMethod === 'stripe' && !orderSuccessRecord) {
      if (!cardNo || !cardExpiry || !cardCvv) {
        setSubmittingError('Missing Credit Card transaction details.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          items: cart.map((it) => ({
            productId: it.product.id,
            name: it.product.name,
            quantity: it.quantity,
            price: it.product.discountPrice || it.product.price,
            size: it.size,
            color: it.color,
            image: it.product.images[0]
          })),
          amount: netPayableBill,
          shippingAddress: {
            firstName,
            lastName,
            email,
            phone,
            address,
            apartment,
            city,
            state,
            pinCode
          },
          couponCode: coupon?.code || null,
          discountAmount: promotionDiscount,
          shippingFee: transportCost,
          paymentMethod,
          paymentDetails: paymentMethod === 'stripe' ? { last4: cardNo.slice(-4) } : {}
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setSubmittingError(data.error || 'Failed to authorize checkout transactions.');
      } else {
        // Success order created
        setOrderSuccessRecord(data.order);
        clearCart(); // Evaporate cart state on success validation rules
      }
    } catch {
      setSubmittingError('Network transactional database storage error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Printable layout
  const handlePrint = () => {
    window.print();
  };

  if (orderSuccessRecord) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8 select-none" id="success-receipt-pane">
        <div className="flex flex-col items-center justify-center space-y-3.5">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <span className="bg-brand-charcoal text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded">
            TRANSACTIONS MUTED & SECURED
          </span>
          <h1 className="font-montserrat font-black text-2xl uppercase tracking-tight text-brand-charcoal">
            ORDER COMPLETED SUCCESS!
          </h1>
          <p className="text-xs text-brand-gray max-w-md font-semibold leading-relaxed">
            Payment successfully processed. Your unique receipt tracking reference is <strong className="text-brand-charcoal select-all text-sm font-mono block mt-1 bg-brand-off p-2 rounded border border-brand-off">{orderSuccessRecord.id}</strong>
          </p>
        </div>

        {/* Dynamic estimated arrivals */}
        <div className="p-6 bg-[#F3F6F8]/45 border rounded-lg text-left text-xs font-semibold space-y-4 max-w-xl mx-auto">
          <div className="flex justify-between items-center pb-3.5 border-b select-none">
            <span className="font-montserrat font-black text-brand-charcoal uppercase">Estimated Dispatch Timeline</span>
            <span className="text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">Fulfillment Hub</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-brand-gray text-[10px] block uppercase">DELIVERING TO:</span>
              <p className="text-brand-charcoal pt-0.5">{orderSuccessRecord.shippingAddress.firstName} {orderSuccessRecord.shippingAddress.lastName}</p>
              <p className="text-brand-gray text-[11px] truncate">{orderSuccessRecord.shippingAddress.address}</p>
            </div>
            <div>
              <span className="text-brand-gray text-[10px] block uppercase">DELIVERY EXPECTED:</span>
              <p className="text-brand-charcoal pt-0.5 font-bold font-mono">
                {new Date(Date.now() + 350 * 60 * 60 * 1000).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <span className="text-[10px] text-brand-gray uppercase">Standard courier tracking active</span>
            </div>
          </div>
        </div>

        {/* Option keys */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 justify-center items-center">
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-1.5 border border-brand-gray/30 text-xs font-bold text-brand-charcoal uppercase px-6 py-3 rounded-lg hover:bg-brand-off transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice Bill</span>
          </button>
          
          <Link
            to="/profile"
            className="bg-brand-charcoal text-white hover:bg-brand-gray text-xs font-montserrat font-bold uppercase tracking-widest px-8 py-3.5 rounded-lg shadow-md duration-200 cursor-pointer"
          >
            Track Orders in Account
          </Link>

          <Link
            to="/"
            className="text-xs text-brand-gray underline hover:text-brand-charcoal font-bold uppercase"
          >
            Back to main catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id="checkout-page" className="pb-16 select-none bg-brand-white">
      {/* Clickable paths */}
      <Breadcrumbs />

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form steps processes (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Visual Progress Header steps Indicator */}
          <div className="flex justify-between items-center border-b border-brand-off pb-4 select-none text-xs font-montserrat font-extrabold text-brand-gray uppercase">
            <div className={`flex items-center space-x-1.5 ${activeStep >= 1 ? 'text-brand-charcoal font-black' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeStep >= 1 ? 'bg-brand-charcoal text-white' : 'bg-brand-off border text-brand-gray'}`}>1</span>
              <span>Information</span>
            </div>
            <div className="h-0.5 w-12 bg-brand-off"></div>
            <div className={`flex items-center space-x-1.5 ${activeStep >= 2 ? 'text-brand-charcoal font-black' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeStep >= 2 ? 'bg-brand-charcoal text-white' : 'bg-brand-off border text-brand-gray'}`}>2</span>
              <span>Shipping</span>
            </div>
            <div className="h-0.5 w-12 bg-brand-off"></div>
            <div className={`flex items-center space-x-1.5 ${activeStep >= 3 ? 'text-brand-charcoal font-black' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeStep >= 3 ? 'bg-brand-charcoal text-white' : 'bg-brand-off border text-brand-gray'}`}>3</span>
              <span>Secure Payment</span>
            </div>
          </div>

          {submittingError && (
            <div className="bg-red-50 text-red-700 text-xs p-3 px-4 rounded-lg border border-red-200">
              * {submittingError}
            </div>
          )}

          {/* STEP 1: BILLING & SHIPPING CONTACT DATA INFO */}
          {activeStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div className="space-y-4">
                <h2 className="font-montserrat font-extrabold text-sm uppercase tracking-wider text-brand-charcoal flex items-center space-x-2">
                  <KeyRound className="w-4.5 h-4.5 text-brand-sky" />
                  <span>Contact Coordinates</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider mb-1">Email Coordinates *</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.buyer@gmail.com"
                      className="w-full bg-brand-off border border-brand-gray/30 rounded px-3 py-2.5 text-xs text-brand-charcoal focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider mb-1">Active Indian Mobile No *</label>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-brand-off border border-brand-gray/30 rounded px-3 py-2.5 text-xs text-brand-charcoal focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-montserrat font-extrabold text-sm uppercase tracking-wider text-brand-charcoal flex items-center space-x-2">
                  <Building className="w-4.5 h-4.5 text-brand-sky" />
                  <span>Ground Delivery Destination</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider mb-1">First Name *</label>
                    <input 
                      type="text" 
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex"
                      className="w-full bg-brand-off border border-brand-gray/30 rounded px-3 py-2.5 text-xs text-brand-charcoal focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                      className="w-full bg-brand-off border border-brand-gray/30 rounded px-3 py-2.5 text-xs text-brand-charcoal focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider mb-1">Street Address Line 1 *</label>
                  <input 
                    type="text" 
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat No 102, Silicon Heights, Residency Road"
                    className="w-full bg-brand-off border border-brand-gray/30 rounded px-3 py-2.5 text-xs text-brand-charcoal focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider mb-1">Apartment, Floor, Suite (Optional)</label>
                  <input 
                    type="text" 
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Block G, 4th Floor"
                    className="w-full bg-brand-off border border-brand-gray/30 rounded px-3 py-2.5 text-xs text-brand-charcoal focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider mb-1">City Depot Location</label>
                    <input 
                      type="text" 
                      disabled
                      value={city}
                      className="w-full bg-brand-off/60 border border-brand-gray/25 rounded px-3 py-2.5 text-xs text-brand-charcoal/80 outline-none font-bold cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider mb-1">State Code</label>
                    <input 
                      type="text" 
                      disabled
                      value={state}
                      className="w-full bg-brand-off/60 border border-brand-gray/25 rounded px-3 py-2.5 text-xs text-brand-charcoal/80 outline-none font-bold cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider mb-1">PIN / ZIP Code *</label>
                    <input 
                      type="text" 
                      required
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="560001"
                      className="w-full bg-brand-off border border-brand-gray/30 rounded px-3 py-2.5 text-xs text-brand-charcoal focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-charcoal hover:bg-brand-gray text-white py-3.5 text-xs font-montserrat font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center space-x-2 shadow cursor-pointer"
              >
                <span>Proceed to Shipping Courier speed</span>
                <ArrowRight className="w-4 h-4 text-brand-sky" />
              </button>
            </form>
          )}

          {/* STEP 2: DISPATCH SHIPPING OPTIONS */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <h2 className="font-montserrat font-extrabold text-sm uppercase tracking-wider text-brand-charcoal flex items-center space-x-2">
                <Truck className="w-5 h-5 text-brand-sky" />
                <span>Shipping Courier Velocities</span>
              </h2>

              <div className="space-y-3.5 text-xs">
                {/* Standard option */}
                <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                  shippingMethod === 'standard' 
                    ? 'border-brand-charcoal bg-[#F3F6F8]/30 ring-1 ring-brand-charcoal' 
                    : 'border-brand-off hover:border-brand-gray'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="shipping"
                      checked={shippingMethod === 'standard'}
                      onChange={() => setShippingMethod('standard')}
                      className="text-brand-charcoal focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <div>
                      <span className="block font-bold text-brand-charcoal">Standard Ground Depot Transport</span>
                      <span className="block text-[10px] text-brand-gray">Expected deliveries inside 3 business days.</span>
                    </div>
                  </div>
                  <span className="font-bold text-brand-charcoal font-sans">
                    {subtotalValue > 999 ? 'FREE Shipping' : '₹99 flat'}
                  </span>
                </label>

                {/* Instant express */}
                <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                  shippingMethod === 'express' 
                    ? 'border-brand-charcoal bg-[#F3F6F8]/30 ring-1 ring-brand-charcoal' 
                    : 'border-brand-off hover:border-brand-gray'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="shipping"
                      checked={shippingMethod === 'express'}
                      onChange={() => setShippingMethod('express')}
                      className="text-brand-charcoal focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <div>
                      <span className="block font-bold text-brand-charcoal">Dedicated Fast Air Mail Delivery (Priority Dispatch)</span>
                      <span className="block text-[10px] text-brand-gray">Guaranteed same-day packing & priority tracking code dispatch.</span>
                    </div>
                  </div>
                  <span className="font-bold text-brand-charcoal font-sans">₹199 fast express</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handlePrevStep}
                  className="w-full bg-brand-off hover:bg-brand-gray/20 border text-brand-charcoal py-3.5 text-xs font-montserrat font-bold uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className="w-full bg-brand-charcoal hover:bg-brand-gray text-white py-3.5 text-xs font-montserrat font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Select Payment</span>
                  <ArrowRight className="w-4 h-4 text-brand-sky" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENTS MATRIX SANDBOX */}
          {activeStep === 3 && (
            <form onSubmit={handleOrderSubmissionSubmit} className="space-y-6">
              <h2 className="font-montserrat font-extrabold text-sm uppercase tracking-wider text-brand-charcoal flex items-center space-x-2">
                <CreditCard className="w-4.5 h-4.5 text-brand-sky" />
                <span>Secured Transaction Gateway (Sandbox Simulation)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-semibold">
                {/* Cash on delivery */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                    paymentMethod === 'cod' ? 'border-brand-charcoal bg-brand-charcoal text-[#B8E1F0] font-black' : 'border-brand-off hover:border-brand-gray text-brand-charcoal'
                  }`}
                >
                  <Truck className="w-5 h-5 shrink-0" />
                  <span>Cash (COD)</span>
                </button>

                {/* Stripe */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                    paymentMethod === 'stripe' ? 'border-brand-charcoal bg-brand-charcoal text-[#B8E1F0] font-black' : 'border-brand-off hover:border-brand-gray text-brand-charcoal'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>Stripe Security</span>
                </button>

                {/* Razorpay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                    paymentMethod === 'razorpay' ? 'border-brand-charcoal bg-brand-charcoal text-[#B8E1F0] font-black' : 'border-brand-off hover:border-brand-gray text-brand-charcoal'
                  }`}
                >
                  <CreditCard className="w-5 h-5 shrink-0" />
                  <span>Razorpay API</span>
                </button>

                {/* UPI QR */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                    paymentMethod === 'upi' ? 'border-brand-charcoal bg-brand-charcoal text-[#B8E1F0] font-black' : 'border-brand-off hover:border-brand-gray text-brand-charcoal'
                  }`}
                >
                  <QrCode className="w-5 h-5 shrink-0" />
                  <span>GPay / UPI QR</span>
                </button>
              </div>

              {/* Conditional payment properties panels */}
              {paymentMethod === 'stripe' && (
                <div className="p-5 bg-brand-off border rounded-lg space-y-4 text-xs font-semibold select-none">
                  <span className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-widest">VISA / MASTERCARD CREDENTIALS</span>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-brand-gray mb-1">CARD NUMBER</label>
                      <input 
                        type="text" 
                        required
                        maxLength={16}
                        value={cardNo}
                        onChange={(e) => setCardNo(e.target.value.replace(/\D/g, ''))}
                        placeholder="4111 2222 3333 4444"
                        className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-brand-gray mb-1">EXPIRY DATE</label>
                        <input 
                          type="text" 
                          required
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-brand-gray mb-1">CVV SECURE CODE</label>
                        <input 
                          type="password" 
                          required
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="***"
                          className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'razorpay' && (
                <div className="p-4 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs leading-relaxed font-semibold">
                  <p><strong>Secure Razorpay Subsystem Trigger Active:</strong> Sandbox mode. The transaction is instantly mapped and registered inside the database coordinates securely.</p>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="p-4 bg-brand-off/95 border border-brand-gray/25 rounded-lg text-center space-y-3 select-none flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase font-bold text-brand-gray tracking-widest pl-1">Scan QR Code using PhonePe / GPay</span>
                  <div className="p-2 border bg-white rounded">
                    {/* Simulated vector QR layout */}
                    <div className="w-28 h-28 bg-[repeating-linear-gradient(45deg,_#000_0px,_#000_10px,_#aaa_10px,_#aaa_20px)] rounded" title="Simulated Scan point"></div>
                  </div>
                  <p className="text-[10px] text-brand-gray font-medium">Auto-confirms immediately upon secure gateway validation ping.</p>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="p-4 bg-yellow-50 text-yellow-905 border border-yellow-250 rounded-lg text-xs leading-relaxed font-semibold">
                  <p><strong>Cash On Delivery Option:</strong> Pay with physical cash, UPI, or mobile banking scanner upon receipt from courier agent at door. Fast dispatch verified.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full bg-brand-off hover:bg-brand-gray/20 border text-brand-charcoal py-3.5 text-xs font-montserrat font-bold uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-charcoal hover:bg-brand-black text-[#B8E1F0] py-3.5 text-xs font-montserrat font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Securing order...' : 'SUBMIT SECURE ORDER'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Right Column: Mini Bill itemized checkouts (5 cols) */}
        <div className="lg:col-span-5 bg-brand-off/55 border rounded-lg p-5 space-y-6 md:sticky md:top-[120px]">
          <h3 className="font-montserrat font-bold text-xs uppercase tracking-wider text-brand-charcoal pb-2 border-b">
            Payment Summary
          </h3>

          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
            {cart.map((it) => {
              const itPrice = it.product.discountPrice || it.product.price;
              return (
                <div key={`${it.product.id}-${it.size}-${it.color}`} className="flex items-center justify-between text-xs font-bold gap-4">
                  <div className="flex items-center space-x-3.5">
                    <img src={it.product.images[0]} alt="thumb receipt" className="w-[45px] h-[60px] object-cover rounded border bg-brand-off shrink-0" referrerPolicy="no-referrer" />
                    <div className="space-y-0.5 truncate max-w-[120px] md:max-w-[200px]">
                      <h4 className="text-brand-charcoal truncate font-black capitalize">{it.product.name}</h4>
                      <span className="text-[10px] text-brand-gray uppercase">{it.size} | {it.color} (x{it.quantity})</span>
                    </div>
                  </div>
                  <span className="font-sans text-brand-charcoal">₹{itPrice * it.quantity}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-brand-off pt-4 space-y-3.5 text-xs font-semibold text-brand-gray select-none">
            <div className="flex justify-between">
              <span>Bag Subtotal:</span>
              <span className="text-brand-charcoal font-sans">₹{subtotalValue}</span>
            </div>

            {promotionDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Applied Code discount:</span>
                <span className="font-sans">- ₹{promotionDiscount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Estimated shipping:</span>
              <span className="text-brand-charcoal font-sans">
                {transportCost === 0 ? 'FREE Transport' : `₹${transportCost}`}
              </span>
            </div>

            <div className="flex justify-between text-sm font-black text-brand-charcoal border-t-2 pt-3">
              <span>GRAND PAYABLE BILL:</span>
              <span className="font-sans">₹{netPayableBill}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
