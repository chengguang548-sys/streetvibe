import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { API_BASE_URL } from '../config/api';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please provide all mandatory message parameters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccess(data.message || 'Thank you! Message recorded.');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setError(data.error || 'Failed to dispatch message.');
      }
    } catch {
      setError('Database dispatch error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="contact-page" className="pb-16 select-none bg-brand-white">
      {/* Dynamic breadcrumb */}
      <Breadcrumbs />

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Contact details (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div>
            <span className="text-[10px] tracking-[0.25em] font-montserrat uppercase font-extrabold text-brand-gray block mb-1">
              Connect With Us
            </span>
            <h1 className="font-montserrat font-black text-2xl uppercase tracking-tight text-brand-charcoal">
              CORPORATE SUPPORT HUB
            </h1>
            <p className="text-xs text-brand-gray pt-1 font-semibold leading-relaxed">
              Have comments regarding garment sizing, delivery times, customized orders, or trade return reverse pickups? Connect with our Bangalore crew directly.
            </p>
          </div>

          <div className="space-y-4 text-xs font-semibold text-brand-gray">
            <div className="flex items-start space-x-3 p-4 bg-brand-off/45 rounded-lg border">
              <MapPin className="w-5 h-5 text-brand-sky shrink-0 mt-0.5" />
              <div>
                <h4 className="text-brand-charcoal font-bold font-montserrat uppercase">Headquarter Depot Coordinates</h4>
                <p className="mt-1 leading-relaxed">102 Premium Block, MG Road, Bangalore, Karnataka - 560001</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-brand-off/45 rounded-lg border">
              <Phone className="w-5 h-5 text-brand-sky shrink-0 mt-0.5" />
              <div>
                <h4 className="text-brand-charcoal font-bold font-montserrat uppercase">Helpline Support Lines</h4>
                <p className="mt-1 leading-relaxed">
                  <a href="tel:+918220895605" className="hover:text-brand-sky transition-colors font-bold text-brand-charcoal">+91 8220895605</a> (Mon-Sat, 9:00 AM - 6:00 PM IST)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-brand-off/45 rounded-lg border">
              <Mail className="w-5 h-5 text-brand-sky shrink-0 mt-0.5" />
              <div>
                <h4 className="text-brand-charcoal font-bold font-montserrat uppercase">Electronic Mail coordinates</h4>
                <p className="mt-1 leading-relaxed font-bold text-brand-charcoal">
                  <a href="mailto:supportstreetvibe@gmail.com" className="hover:text-brand-sky transition-colors">supportstreetvibe@gmail.com</a> (Responds inside 24 hours)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form submissions (7 cols) */}
        <div className="md:col-span-7 bg-brand-off border rounded-lg p-6 md:p-8 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <HelpCircle className="w-5 h-5 text-brand-charcoal animate-pulse" />
            <h2 className="font-montserrat font-extrabold text-xs uppercase tracking-widest text-[#061114]">SUBMIT CLIENT QUERY FORM</h2>
          </div>

          {error && <div className="bg-red-50 text-red-700 font-semibold p-4 rounded-lg mb-4 text-xs border border-red-200">{error}</div>}
          {success && <div className="bg-emerald-50 text-emerald-800 font-semibold p-4 rounded-lg mb-4 text-xs border border-emerald-300">{success}</div>}

          <form onSubmit={handleContactSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] font-extrabold text-brand-gray uppercase mb-1">Your Name *</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Austin Reed"
                className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2.5 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold text-brand-charcoal"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-brand-gray uppercase mb-1">Valid Email ID *</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="austin.reed@example.com"
                className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2.5 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold text-brand-charcoal"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-brand-gray uppercase mb-1">Message Body *</label>
              <textarea 
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Indicate questions/sizing assistance preferences here..."
                className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-medium text-brand-charcoal leading-relaxed"
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-charcoal hover:bg-brand-black text-[#B8E1F0] font-montserrat font-extrabold text-xs uppercase py-3.5 tracking-widest rounded-lg flex items-center justify-center space-x-1.5 duration-200 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 shrink-0 text-brand-sky" />
              <span>{isSubmitting ? 'Dispatching Message...' : 'SEND MESSAGE SECURELY'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
