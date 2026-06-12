import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import HeroSlider from '../components/HeroSlider';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { 
  ChevronRight, 
  Sparkles, 
  TrendingUp, 
  Flame,
  Instagram,
  ArrowRight
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function Home() {
  const { categories } = useStore();
  const navigate = useNavigate();

  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Load Home section lists from API
  useEffect(() => {
    const fetchHomeItems = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_BASE_URL}/api/products?limit=50`);
        const data = await resp.json();
        const allProducts: Product[] = data.products || [];

        // filter collections
        setNewArrivals(allProducts.filter(p => p.isNewArrival).slice(0, 4));
        setBestSellers(allProducts.filter(p => p.isBestSeller).slice(0, 6));
        setTrending(allProducts.filter(p => p.isTrending).slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeItems();
  }, []);

  const handleQuickView = (prod: Product) => {
    setQuickViewProduct(prod);
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
  };

  const categoryCards = [
    {
      id: 'shirts',
      name: 'Premium Shirts',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
      count: '10 Items',
      path: '/shop/shirts'
    },
    {
      id: 'pants',
      name: 'Tailored Pants',
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80',
      count: '10 Items',
      path: '/shop/pants'
    },
    {
      id: 'tshirts',
      name: 'Street T-Shirts',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80',
      count: '10 Items',
      path: '/shop/tshirts'
    },
    {
      id: 'shoes',
      name: 'Raw Shoes',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',
      count: '10 Items',
      path: '/shop/shoes'
    },
    {
      id: 'accessories',
      name: 'Urban Accs',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      count: '10 Items',
      path: '/shop/accessories'
    }
  ];

  return (
    <div id="home-view" className="space-y-16 pb-16">
      
      {/* 1. HERO AUTO SLIDER */}
      <HeroSlider />

      {/* 2. SHOP CATEGORY SECTION GRID */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8">
          <div>
            <span className="text-[10px] tracking-[0.25em] font-montserrat uppercase font-extrabold text-brand-gray block mb-1">
              Curated Wardrobe Selects
            </span>
            <h2 className="text-xl md:text-2xl font-black font-montserrat tracking-tight">
              PRODUCT CATEGORIES
            </h2>
          </div>
          <Link to="/shop" className="text-xs font-bold text-brand-charcoal uppercase tracking-wider flex items-center hover:text-brand-gray transition-colors mt-2 md:mt-0 cursor-pointer">
            <span>Browse Full Catalog</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Bento/Carousel category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 select-none">
          {categoryCards.map((cat) => (
            <Link 
              key={cat.id} 
              to={cat.path}
              id={`cat-card-${cat.id}`}
              className="group flex flex-col bg-brand-off border border-brand-off rounded overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 pointer-events-auto cursor-pointer"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-brand-gray/10">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                  referrerPolicy="no-referrer"
                />
                {/* Visual glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-75 transition-opacity"></div>
                
                {/* Floating tags */}
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-brand-sky block mb-0.5">{cat.count}</span>
                  <h4 className="font-montserrat font-black text-xs uppercase tracking-wide leading-tight">
                    {cat.name}
                  </h4>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-end mb-8 border-b border-brand-off pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-charcoal" />
            <h2 className="text-lg md:text-xl font-extrabold font-montserrat uppercase tracking-tight">New Arrivals</h2>
          </div>
          <Link to="/shop?tag=new-arrivals" className="text-xs font-bold text-brand-gray hover:text-brand-charcoal transition-colors">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="bg-brand-off aspect-[3/4] rounded"></div>
                <div className="bg-brand-off h-4 w-2/3 rounded"></div>
                <div className="bg-brand-off h-3 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((prod) => (
              <ProductCard key={prod.id} product={prod} onQuickView={handleQuickView} />
            ))}
          </div>
        )}
      </section>

      {/* 4. PROMOTIONAL RED & WHITE TIMELINE BANNER (50% OFF) */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-red-600 text-white select-none relative overflow-hidden py-12 px-8 md:px-12 rounded-xl border border-red-700">
          {/* Vector Background Graphic */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-black"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-8 md:gap-4 text-center md:text-left">
            <div className="space-y-2">
              <span className="bg-white text-red-600 text-[10px] font-extrabold font-montserrat uppercase px-3.5 py-1 tracking-widest rounded-full leading-none">
                Limited Mid-Season Clearance
              </span>
              <h3 className="font-montserrat font-black text-3xl md:text-5xl uppercase tracking-tight leading-none">
                FLAT 50% DISCOUNT
              </h3>
              <p className="text-sm text-red-100 max-w-xl font-medium leading-relaxed">
                Elevate your street presence. Apply code <strong className="font-black underline bg-white/20 px-1 py-0.5 rounded text-white">SUPER50</strong> at checkout to redeem a flat fifty percent discount on purchases above ₹2999.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end space-y-4">
              <button 
                onClick={() => navigate('/shop')}
                className="bg-brand-white text-red-600 hover:bg-brand-charcoal hover:text-white font-montserrat font-black text-xs uppercase px-10 py-4 tracking-widest rounded shadow-xl hover:scale-105 active:scale-95 duration-200"
              >
                Shop Clearance
              </button>
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-200">
                *T&C apply. Limited sizes available.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BEST SELLERS */}
      <section className="bg-brand-off py-16 border-y border-brand-off/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-end mb-8 border-b border-brand-gray/10 pb-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-500 fill-current" />
              <h2 className="text-lg md:text-xl font-extrabold font-montserrat uppercase tracking-tight">Best Sellers</h2>
            </div>
            <Link to="/shop?sort=popular" className="text-xs font-bold text-brand-gray hover:text-brand-charcoal transition-colors">
              Browse All Hot Listings
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="bg-white aspect-[3/4] rounded"></div>
                  <div className="bg-white h-4 w-2/3 rounded"></div>
                  <div className="bg-white h-3 w-1/2 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {bestSellers.map((prod) => (
                <ProductCard key={prod.id} product={prod} onQuickView={handleQuickView} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. TRENDING GRID */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-end mb-8 border-b border-brand-off pb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-brand-charcoal" />
            <h2 className="text-lg md:text-xl font-extrabold font-montserrat uppercase tracking-tight">Trending Collection</h2>
          </div>
          <Link to="/shop?sort=popular" className="text-xs font-bold text-brand-gray hover:text-brand-charcoal transition-colors">
            Explore All Trends
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Static Fashion Editorial Promo model card */}
          <div className="md:col-span-4 relative overflow-hidden rounded bg-[#DCEFF7] p-8 aspect-square md:h-full flex flex-col justify-between border border-[#B8E1F0]">
            <div>
              <span className="text-[10px] tracking-widest font-extrabold font-montserrat uppercase text-brand-gray block">THE ALPINE EDIT</span>
              <h3 className="font-montserrat font-black text-2xl uppercase tracking-tight text-brand-charcoal mt-2 leading-tight">
                CLEAN SILHOUETTES.<br />COOL TONES.
              </h3>
              <p className="text-xs text-brand-gray max-w-xs mt-3 leading-relaxed font-semibold">
                Built for comfort, styled for high-velocity impact. Discover the icy shades of our summer accessories.
              </p>
            </div>
            <button 
              onClick={() => navigate('/shop/accessories')}
              className="mt-6 bg-brand-charcoal text-white hover:bg-brand-gray rounded px-6 py-3 font-montserrat font-bold text-xs uppercase tracking-widest self-start flex items-center space-x-1.5 transition-colors shadow"
            >
              <span>Explore Clean Goods</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 bottom-0 w-1/2 opacity-30 select-none pointer-events-none">
              <img src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&q=80" alt="glasses overlay" />
            </div>
          </div>

          <div className="md:col-span-8">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="bg-brand-off aspect-[3/4] rounded"></div>
                    <div className="bg-brand-off h-4 w-2/3 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {trending.map((prod) => (
                  <ProductCard key={prod.id} product={prod} onQuickView={handleQuickView} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. SOCIAL MEDIA CATWALK GALLERY (@STREETVIBE) */}
      <section className="bg-brand-off/40 py-16 border-t border-brand-off select-none">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-3">
          <a 
            href="https://www.instagram.com/supportstreetvibe/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center justify-center space-x-1.5 text-brand-gray hover:text-brand-charcoal hover:scale-105 transition-all duration-200"
          >
            <Instagram className="w-4 h-4 text-brand-charcoal" />
            <span className="text-xs font-black tracking-widest uppercase font-montserrat">@SUPPORTSTREETVIBE</span>
          </a>
          <h2 className="font-montserrat font-black text-2xl uppercase tracking-tight text-brand-charcoal">
            Follow Our Community
          </h2>
          <p className="text-xs text-brand-gray leading-none font-semibold">Tag your snapshots with #StreetVibeStyle to get featured on our feed.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 max-w-4xl mx-auto">
            <div className="aspect-square rounded overflow-hidden relative group border border-brand-off">
              <img src="https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=450&q=80" alt="Community outfit" className="w-full h-full object-cover group-hover:scale-105 duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">❤️ 125</div>
            </div>
            <div className="aspect-square rounded overflow-hidden relative group border border-brand-off">
              <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=450&q=80" alt="Community outfit" className="w-full h-full object-cover group-hover:scale-105 duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">❤️ 94</div>
            </div>
            <div className="aspect-square rounded overflow-hidden relative group border border-brand-off">
              <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=450&q=80" alt="Community outfit" className="w-full h-full object-cover group-hover:scale-105 duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">❤️ 210</div>
            </div>
            <div className="aspect-square rounded overflow-hidden relative group border border-brand-off">
              <img src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=450&q=80" alt="Community outfit" className="w-full h-full object-cover group-hover:scale-105 duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">❤️ 148</div>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMICS QUICKVIEW OVERLAY PORTAL */}
      <QuickViewModal product={quickViewProduct} onClose={handleCloseQuickView} />
    </div>
  );
}
