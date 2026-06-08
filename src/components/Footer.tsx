import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Twitter, ShieldCheck, RefreshCw, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  const { categories } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsSuccess, setNewsSuccess] = useState('');
  const [newsError, setNewsError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSub = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsSuccess('');
    setNewsError('');
    if (!newsletterEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await resp.json();
      if (resp.ok) {
        setNewsSuccess(data.message || 'Subscribed successfully!');
        setNewsletterEmail('');
      } else {
        setNewsError(data.error || 'Failed to subscribe.');
      }
    } catch {
      setNewsError('Database error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer id="global-footer" className="bg-brand-charcoal text-brand-white border-t border-brand-charcoal/20 select-none">
      
      {/* Upper Features Strip */}
      <div className="border-b border-brand-white/10 py-10 px-4 md:px-8 bg-brand-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start space-x-4">
            <Truck className="w-8 h-8 text-brand-sky shrink-0" />
            <div>
              <h4 className="font-montserrat font-bold text-xs uppercase tracking-widest text-brand-white">Free Dynamic Shipping</h4>
              <p className="text-[11px] text-brand-gray mt-1 leading-relaxed">Fulfilled and shipped within 24 hours for all orders above ₹999.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <RefreshCw className="w-8 h-8 text-brand-sky shrink-0" />
            <div>
              <h4 className="font-montserrat font-bold text-xs uppercase tracking-widest text-brand-white">Easy 14-Day Trade Returns</h4>
              <p className="text-[11px] text-brand-gray mt-1 leading-relaxed">Self-scheduled reverse pick-up service directly from your front gate.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <ShieldCheck className="w-8 h-8 text-brand-sky shrink-0" />
            <div>
              <h4 className="font-montserrat font-bold text-xs uppercase tracking-widest text-brand-white">100% Guarded Payments</h4>
              <p className="text-[11px] text-brand-gray mt-1 leading-relaxed">Secured endpoints utilizing Stripe, Razorpay and UPI tokenisation layers.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Mail className="w-8 h-8 text-brand-sky shrink-0" />
            <div>
              <h4 className="font-montserrat font-bold text-xs uppercase tracking-widest text-brand-white">Authentic Craftsmanship</h4>
              <p className="text-[11px] text-brand-gray mt-1 leading-relaxed">Organic cotton and split-grain leather stitched for comfort lifestyle.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        
        {/* Brand Summary */}
        <div className="md:col-span-4 space-y-4">
          <Link to="/" className="inline-block">
            <Logo variant="horizontal" color="light" size="md" className="hover:opacity-90 duration-250 transition-opacity" />
          </Link>
          <p className="text-xs text-brand-gray leading-relaxed max-w-sm font-medium">
            Discover clean, minimalist lifestyle apparel designed at the intersection of urban landscape mobility and classic relaxed tailoring. Designed for comfort, styled for high impact.
          </p>
          <div className="flex space-x-3.5 pt-2">
            <a href="https://www.instagram.com/supportstreetvibe/" target="_blank" rel="noreferrer" title="Instagram Profile" className="text-brand-gray hover:text-brand-white transition-colors duration-200">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook Page" className="text-brand-gray hover:text-brand-white transition-colors duration-200">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" title="Twitter Handle" className="text-brand-gray hover:text-brand-white transition-colors duration-200">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick links - Shop Categories */}
        <div className="md:col-span-2">
          <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-brand-white mb-5 border-l-2 border-brand-sky pl-3">
            Shop Catalog
          </h4>
          <ul className="space-y-3 text-xs text-brand-gray font-medium">
            {categories.map((cat) => (
              <li key={cat}>
                <Link to={`/shop/${cat}`} className="hover:text-brand-white transition-colors capitalize">
                  {cat === 'tshirts' ? 'T-Shirts collection' : `${cat} section`}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/shop" className="hover:text-brand-white transition-colors">
                View All Categories
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick links - Policies */}
        <div className="md:col-span-2">
          <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-brand-white mb-5 border-l-2 border-brand-sky pl-3">
            Service Policy
          </h4>
          <ul className="space-y-3 text-xs text-brand-gray font-medium">
            <li><span className="hover:text-brand-white cursor-pointer transition-colors">14-Day Returns Guideline</span></li>
            <li><span className="hover:text-brand-white cursor-pointer transition-colors">Fulfillment Timelines</span></li>
            <li><span className="hover:text-brand-white cursor-pointer transition-colors">UPI / Card Protection Rules</span></li>
            <li><span className="hover:text-brand-white cursor-pointer transition-colors">Grievance & Privacy Charter</span></li>
            <li><span className="hover:text-brand-white cursor-pointer transition-colors">Authentic Materials Pledge</span></li>
          </ul>
        </div>

        {/* Contact parameters */}
        <div className="md:col-span-4 space-y-4">
          <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-brand-white mb-1 border-l-2 border-brand-sky pl-3">
            Corporate Support
          </h4>
          <div className="space-y-3 text-xs text-brand-gray font-medium">
            <div className="flex items-center space-x-2.5">
              <MapPin className="w-4 h-4 text-brand-sky shrink-0" />
              <span>102 Premium Block, MG Road, Bangalore, Karnataka - 560001</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Phone className="w-4 h-4 text-brand-sky shrink-0" />
              <a href="tel:+918220895605" className="hover:text-brand-white transition-colors">+91 8220895605</a>
            </div>
            <div className="flex items-center space-x-2.5">
              <Mail className="w-4 h-4 text-brand-sky shrink-0" />
              <a href="mailto:supportstreetvibe@gmail.com" className="hover:text-brand-white transition-colors">supportstreetvibe@gmail.com</a>
            </div>
          </div>

          {/* Newsletter inside panel */}
          <div className="pt-4 border-t border-brand-white/10 space-y-2">
            <h5 className="font-montserrat font-bold text-xs uppercase tracking-widest text-[#B8E1F0]">GET 10% OFF YOUR FIRST ORDER</h5>
            <p className="text-[11px] text-brand-gray leading-relaxed font-semibold">Join the inside circle for exclusive announcements & early access drops.</p>
            
            <form onSubmit={handleSub} className="flex space-x-2 mt-2">
              <input 
                type="email" 
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your executive email ID"
                className="flex-1 bg-brand-black/40 border border-brand-gray/30 rounded px-3 py-2 text-xs text-brand-white focus:outline-none focus:ring-1 focus:ring-[#B8E1F0]"
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-brand-sky text-brand-charcoal font-montserrat font-extrabold text-xs uppercase px-4 py-2 hover:bg-brand-white transition-all rounded disabled:opacity-50"
              >
                {isSubmitting ? '...' : 'Join'}
              </button>
            </form>
            {newsSuccess && <p className="text-[11px] text-emerald-400 font-medium leading-tight">{newsSuccess}</p>}
            {newsError && <p className="text-[11px] text-red-400 font-medium leading-tight">{newsError}</p>}
          </div>
        </div>
      </div>

      {/* Copy-writing details footer bar */}
      <div className="bg-brand-black py-6 border-t border-brand-white/5 px-4 md:px-8 text-center text-[11px] text-brand-gray font-normal select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <p>© {new Date().getFullYear()} StreetVibe Private Limited. All licensing coordinates preserved.</p>
          <div className="flex space-x-6">
            <span className="hover:underline cursor-pointer">Sitemap</span>
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Refund Policies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
