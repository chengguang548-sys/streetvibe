import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Contact from './pages/Contact';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-brand-white text-brand-charcoal antialiased">
          
          {/* Main sticky navigation header containing search drawers, auth logins, and shopping bags */}
          <Header />

          {/* Core content wrapper */}
          <main className="flex-grow pt-[93px] md:pt-[101px]" id="app-main-content">
            <Routes>
              {/* Home Landing */}
              <Route path="/" element={<Home />} />
              
              {/* Shop Catalogs */}
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:category" element={<Shop />} />
              
              {/* Product Specifications & reviews */}
              <Route path="/product/:slug" element={<ProductDetails />} />
              
              {/* Wishlist item transfers */}
              <Route path="/wishlist" element={<Wishlist />} />
              
              {/* Dynamic Bag modifiers & applied promo codes */}
              <Route path="/cart" element={<Cart />} />
              
              {/* Secure multi-step sandbox payments */}
              <Route path="/checkout" element={<Checkout />} />
              
              {/* Client historical orders & tracking dashboards */}
              <Route path="/profile" element={<Profile />} />
              
              {/* Admin KPI analytics dashboard and inventory restock tools */}
              <Route path="/admin" element={<AdminPanel />} />
              
              {/* Boutique support contact lines */}
              <Route path="/contact" element={<Contact />} />
              
              {/* Wildcard fallback routing */}
              <Route path="*" element={<Home />} />
            </Routes>
          </main>

          {/* Social communities catwalk links and policies strip footer */}
          <Footer />

        </div>
      </BrowserRouter>
    </StoreProvider>
  );
}
