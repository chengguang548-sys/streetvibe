import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Product, Review } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { API_BASE_URL } from '../config/api';
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  Check, 
  Truck, 
  RefreshCcw, 
  ShieldCheck,
  ChevronDown,
  Sparkles,
  User as UserIcon,
  MessageSquareDiff
} from 'lucide-react';

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { 
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    addToRecentlyViewed, 
    recentlyViewed 
  } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector configs
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedNotify, setAddedNotify] = useState(false);

  // Tabs layout config
  const [activeTab, setActiveTab] = useState<'desc' | 'fabric' | 'shipping' | 'returns'>('desc');

  // Submit new review review
  const [rName, setRName] = useState('');
  const [rRating, setRRating] = useState('5');
  const [rComment, setRComment] = useState('');
  const [rSuccess, setRSuccess] = useState('');
  const [rError, setRError] = useState('');

  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Retrieve details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        // Clean fields
        setRSuccess('');
        setRError('');
        setRComment('');
        setRName('');

        const resp = await fetch(`${API_BASE_URL}/api/products/${slug}`);
        if (!resp.ok) {
          navigate('/shop');
          return;
        }
        const data = await resp.json();
        setProduct(data);
        setReviews(data.reviews || []);
        
        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        }
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0].name);
        }

        // Cache recently viewed log
        addToRecentlyViewed(data);

        // Fetch related products in category
        const relResp = await fetch(`${API_BASE_URL}/api/products?category=${data.category}&limit=5`);
        const relData = await relResp.json();
        // Skip current item
        const filteredRelated = (relData.products || []).filter((p: Product) => p.id !== data.id).slice(0, 4);
        setRelated(filteredRelated);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 animate-pulse space-y-12 select-none">
        <div className="h-6 w-1/3 bg-brand-off rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-brand-off aspect-[3/4] rounded"></div>
          <div className="space-y-6">
            <div className="h-8 w-2/3 bg-brand-off rounded"></div>
            <div className="h-5 w-1/4 bg-brand-off rounded"></div>
            <div className="h-20 w-full bg-brand-off rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 select-none">
        <p className="text-sm text-brand-gray">Unable to load details for this garment.</p>
        <Link to="/shop" className="text-brand-charcoal underline mt-2 block font-extrabold text-xs uppercase">Return To Catalog</Link>
      </div>
    );
  }

  // Magnifying visual effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.5)',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transform: 'scale(1)' });
  };

  const handleAddToCartSubmit = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedNotify(true);
    setTimeout(() => setAddedNotify(false), 2000);
  };

  const handleBuyNowSubmit = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    navigate('/checkout');
  };

  const handleReviewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRSuccess('');
    setRError('');

    if (!rComment.trim()) {
      setRError('Critique body cannot be blank.');
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/api/products/${product.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: parseFloat(rRating),
          comment: rComment,
          userName: rName.trim() || 'Verified Buyer'
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setRError(data.error || 'Failed to record critique.');
      } else {
        setRSuccess('Review registered! Thank you for rating StreetVibe.');
        setReviews((prev) => [data.review, ...prev]);
        // Update product configurations locally
        product.rating = data.updatedRating;
        product.reviewsCount = data.reviewsCount;
        setRComment('');
        setRName('');
      }
    } catch {
      setRError('Database critique write failure.');
    }
  };

  const isFav = isInWishlist(product.id);
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div id="product-detail-view" className="pb-16 select-none bg-brand-white">
      
      {/* Dynamic clickable breadcrumb link */}
      <Breadcrumbs categoryName={product.category.charAt(0).toUpperCase() + product.category.slice(1)} categoryPath={`/shop/${product.category}`} customItemName={product.name} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Gallery Image display column (6 Columns) */}
        <div className="md:col-span-6 flex flex-col md:flex-row gap-4 max-h-[80vh] md:sticky md:top-[120px]">
          
          {/* Sub Row thumbnail buttons carousel */}
          <div className="flex md:flex-col order-2 md:order-1 gap-2.5 overflow-x-auto md:overflow-x-visible shrink-0 select-none pb-2 md:pb-0">
            {product.images.map((img) => (
              <button
                key={img}
                onClick={() => setActiveImage(img)}
                className={`w-[60px] h-[75px] md:w-[70px] md:h-[90px] overflow-hidden rounded bg-brand-off border cursor-pointer ${
                  activeImage === img ? 'border-brand-charcoal ring-1 ring-brand-charcoal' : 'border-brand-off hover:border-brand-gray'
                }`}
              >
                <img src={img} alt="thumb detail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>

          {/* Primary zoom-box container */}
          <div className="order-1 md:order-2 flex-1 rounded bg-[#F3F6F8]/45 border border-brand-off flex items-center justify-center overflow-hidden aspect-[3/4]">
            <div 
              className="w-full h-full cursor-zoom-in relative select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img 
                src={activeImage} 
                alt={product.name} 
                style={zoomStyle}
                className="w-full h-full object-cover transition-transform duration-100 ease-out"
                referrerPolicy="no-referrer"
              />
              {/* Mark percentage discounts explicitly inside gallery */}
              {product.discountPrice && (
                <span className="absolute top-4 left-4 bg-red-600 text-white font-montserrat font-extrabold text-[11px] px-3 py-1 uppercase tracking-wider rounded">
                  {discountPercent}% OFF CLEARANCE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Configurations detail panel (6 Columns) */}
        <div className="md:col-span-6 space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.25em] font-montserrat uppercase font-extrabold text-brand-gray block">
              {product.category} by StreetVibe
            </span>
            <h1 className="font-montserrat font-black text-2xl md:text-3xl text-brand-charcoal uppercase leading-tight select-all">
              {product.name}
            </h1>

            {/* Pricing block */}
            <div className="flex items-center space-x-3.5 pt-1.5">
              {product.discountPrice ? (
                <>
                  <span className="text-2xl font-black text-brand-charcoal">₹{product.discountPrice}</span>
                  <span className="text-base line-through text-brand-gray">₹{product.price}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-3 py-1 font-montserrat font-bold tracking-wider uppercase rounded">
                    Sale Pricing Applied
                  </span>
                </>
              ) : (
                <span className="text-xl font-black text-brand-charcoal">₹{product.price}</span>
              )}
            </div>

            {/* Rating Stars average summary */}
            <div className="flex items-center space-x-3 pb-2 border-b border-brand-off select-none">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-current text-amber-400" />
                <span className="text-xs font-black text-brand-charcoal ml-1">{product.rating}</span>
              </div>
              <span className="text-xs text-brand-gray">|</span>
              <span className="text-xs text-brand-gray font-semibold hover:underline cursor-pointer">{reviews.length} Verified Buyer critiques</span>
            </div>
          </div>

          <p className="text-xs md:text-sm text-brand-gray leading-relaxed font-semibold">
            {product.description}
          </p>

          {/* Sizing Select with dynamic options validation */}
          <div className="space-y-3.5 select-none">
            <div className="flex justify-between items-center text-[10px] font-extrabold text-brand-gray tracking-wider uppercase">
              <span>Select Sizing: <strong className="text-brand-charcoal ml-1">{selectedSize}</strong></span>
              <span className="underline hover:text-brand-charcoal cursor-pointer">Sizing Guide Chart</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-[48px] h-[38px] text-xs font-extrabold border rounded-lg uppercase flex items-center justify-center transition-all ${
                    selectedSize === size
                      ? 'bg-brand-charcoal border-brand-charcoal text-white scale-95 shadow-md'
                      : 'border-brand-gray/30 text-brand-charcoal hover:border-brand-charcoal bg-transparent'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color finishing */}
          <div className="space-y-3 select-none">
            <span className="block text-[10px] font-extrabold text-brand-gray tracking-wider uppercase">
              Color Style Selector: <strong className="text-brand-charcoal ml-1">{selectedColor}</strong>
            </span>
            <div className="flex gap-4">
              {product.colors.map((col) => {
                const isSelected = selectedColor === col.name;
                return (
                  <button
                    key={col.name}
                    onClick={() => setSelectedColor(col.name)}
                    className={`w-8 h-8 rounded-full border border-brand-off/50 flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 ${
                      isSelected ? 'ring-2 ring-brand-charcoal ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3.5] mix-blend-difference" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector and stock warning levels */}
          <div className="space-y-3.5 select-none">
            <span className="block text-[10px] font-extrabold text-brand-gray tracking-wider uppercase">Quantity</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-brand-off rounded overflow-hidden bg-brand-off">
                <button 
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-[18px] py-2.5 hover:bg-white text-brand-charcoal transition-colors focus:outline-none font-bold"
                >
                  -
                </button>
                <span className="px-[18px] text-xs font-bold text-brand-charcoal">{quantity}</span>
                <button 
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-[18px] py-2.5 hover:bg-white text-brand-charcoal transition-colors focus:outline-none font-bold"
                >
                  +
                </button>
              </div>

              <div>
                {product.inStock ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-brand-charcoal">Available in inventories</span>
                    <span className="text-[10px] text-brand-gray">Fulfillment completed from Bangalore depot.</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest leading-none">SOLD OUT IN STOCK COLLECTIONS</span>
                )}
              </div>
            </div>
          </div>

          {/* Main Action buying buttons */}
          <div className="space-y-3 pt-4 border-t border-brand-off">
            {addedNotify ? (
              <div className="bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded-lg p-4 font-montserrat font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center space-x-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>ADDED TO SHOPPING CART BAG! SLIDEOUT SECURED</span>
              </div>
            ) : product.inStock ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCartSubmit}
                  className="flex-1 bg-brand-off hover:bg-brand-gray border border-brand-charcoal text-brand-charcoal hover:text-white py-4 text-xs font-montserrat font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  <span>Add To Cart Bag</span>
                </button>
                
                <button
                  onClick={handleBuyNowSubmit}
                  className="flex-1 bg-brand-charcoal hover:bg-brand-black text-brand-white py-4 text-xs font-montserrat font-bold uppercase tracking-widest rounded-lg transition-all shadow-md cursor-pointer hover:shadow-lg hover:scale-101"
                >
                  Buy It Right Now
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full bg-brand-gray/30 text-brand-charcoal/50 py-4 font-montserrat font-semibold uppercase tracking-wider rounded-lg cursor-not-allowed text-xs"
              >
                OUT OF STOCK IN INVENTORY
              </button>
            )}

            {/* Quick favorites trigger */}
            <button 
              onClick={() => toggleWishlist(product)}
              className="w-full py-1.5 flex items-center justify-center space-x-2 text-xs font-bold tracking-wider text-brand-charcoal uppercase hover:text-brand-gray transition-colors cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'text-red-400 fill-current' : ''}`} />
              <span>{isFav ? 'Retained in Wishlist catalog' : 'Save To Wishlist Catalog'}</span>
            </button>
          </div>

          {/* Informative service parameters strip */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-brand-off text-center text-[10px] text-brand-gray font-semibold select-none">
            <div className="flex flex-col items-center space-y-1">
              <Truck className="w-5 h-5 text-brand-gray" />
              <span>Bangalore Dispatch</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <RefreshCcw className="w-5 h-5 text-brand-gray" />
              <span>14-Day reverse trade</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <ShieldCheck className="w-5 h-5 text-brand-gray" />
              <span>18% inclusive GST</span>
            </div>
          </div>

          {/* 11. TABBED ACCORDION CONTAINER */}
          <div className="border border-brand-off rounded overflow-hidden bg-brand-off/15 text-xs select-none">
            <div className="flex border-b border-brand-off bg-brand-off">
              {[
                { id: 'desc', label: 'Item description' },
                { id: 'fabric', label: 'Fabric Details' },
                { id: 'shipping', label: 'Shipping Rules' },
                { id: 'returns', label: 'Returns policy' }
              ].map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setActiveTab(tb.id as any)}
                  className={`flex-1 py-3.5 text-[10px] font-montserrat font-bold uppercase tracking-widest text-center border-b-2 transition-all ${
                    activeTab === tb.id 
                      ? 'border-brand-charcoal text-brand-charcoal bg-white' 
                      : 'border-transparent text-brand-gray hover:text-brand-charcoal'
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            <div className="p-5 font-semibold text-brand-gray leading-relaxed bg-white">
              {activeTab === 'desc' && (
                <p>{product.description} All apparel garments designed and packaged in our Bangalore styling facilities.</p>
              )}
              {activeTab === 'fabric' && (
                <p>{product.fabricDetails || 'Tailored with organic long-staple cotton fiber blends optimized for structural resilience.'}</p>
              )}
              {activeTab === 'shipping' && (
                <p>{product.shippingInfo || 'Standard deliveries to leading capital districts fulfilled in under 3 business days.'}</p>
              )}
              {activeTab === 'returns' && (
                <p>{product.returnsInfo || 'Hassle-free trade returns. Self-schedule return requests easily inside your Customer Dashboard profile area.'}</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* VERIFIED BUYERS REVIEWS EDITORS & CRITIQUE LISTS */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-16 border-t border-brand-off pt-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Customer critiques list */}
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-center space-x-2 border-b border-brand-off pb-3">
            <span className="bg-brand-charcoal text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded font-montserrat">VERIFIED CUSTOMERS</span>
            <h2 className="font-montserrat font-black text-sm uppercase tracking-wider text-brand-charcoal">Critiques and Opinions ({reviews.length})</h2>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {reviews.length === 0 ? (
              <div className="py-12 text-center bg-brand-off/40 border border-brand-off rounded flex flex-col items-center justify-center space-y-1">
                <UserIcon className="w-8 h-8 text-brand-gray" />
                <p className="text-xs text-brand-gray">No verified reviews recorded for this product yet.</p>
                <span className="text-[10px] text-brand-gray">Be the first client to register a rating below!</span>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-[#F3F6F8]/30 border border-brand-off/60 rounded relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-montserrat font-bold text-xs text-brand-charcoal flex items-center space-x-1.5 capitalize">
                        <span>{rev.userName}</span>
                        <span className="text-[#B8E1F0] text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 bg-brand-charcoal rounded leading-none">Buyer</span>
                      </h4>
                      <span className="text-[9px] text-brand-gray font-semibold font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center text-amber-400 text-xs font-bold font-mono">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-400 mr-1" />
                      <span>{rev.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-brand-gray leading-relaxed font-semibold">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: submit reviews editor */}
        <div className="md:col-span-5 bg-brand-off border border-brand-off/10 rounded p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquareDiff className="w-5 h-5 text-brand-charcoal" />
            <h3 className="font-montserrat font-bold text-xs uppercase tracking-widest text-brand-charcoal">Write Product Critique</h3>
          </div>

          {rError && <div className="bg-red-50 text-red-700 text-xs p-3 rounded mb-3 border border-red-200">{rError}</div>}
          {rSuccess && <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded mb-3 border border-emerald-200">{rSuccess}</div>}

          <form onSubmit={handleReviewFormSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-gray mb-1">Your Name (Optional)</label>
              <input 
                type="text" 
                value={rName}
                onChange={(e) => setRName(e.target.value)}
                placeholder="Ex. Alex S."
                className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold text-brand-charcoal"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-gray mb-1">Rating Star Selection</label>
              <select 
                value={rRating}
                onChange={(e) => setRRating(e.target.value)}
                className="w-full bg-white border border-brand-gray/30 rounded p-2 text-xs focus:outline-none font-extrabold text-brand-charcoal"
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars - Timeless Excellence</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars - Very Satisfied</option>
                <option value="3">⭐⭐⭐ 3 Stars - Average Wearing</option>
                <option value="2">⭐⭐ 2 Stars - Minor material notes</option>
                <option value="1">⭐ 1 Star - Unsuitable styling</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-gray mb-1">Critique Comment</label>
              <textarea 
                required
                rows={4}
                value={rComment}
                onChange={(e) => setRComment(e.target.value)}
                placeholder="Tell other shoppers details about fit sizing, materials feel, stitch details, and general wearing satisfaction."
                className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-medium text-brand-charcoal"
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full bg-brand-charcoal text-brand-white font-montserrat font-bold text-xs uppercase py-3 tracking-widest rounded shadow hover:bg-brand-gray duration-200"
            >
              Submit Critique Review
            </button>
          </form>
        </div>
      </section>

      {/* 13. RELATED CHANNELS SECTION */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-16 border-t border-brand-off pt-12 select-none">
          <div className="flex items-center space-x-2 mb-8">
            <Sparkles className="w-5 h-5 text-brand-charcoal" />
            <h2 className="text-sm md:text-md uppercase tracking-wider font-extrabold font-montserrat text-brand-charcoal">Related Products Recomendations</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((prod) => (
              <ProductCard key={prod.id} product={prod} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        </section>
      )}

      {/* 14. RECENTLY VIEWED CONTAINER */}
      {recentlyViewed.length > 1 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-16 border-t border-brand-off pt-12 select-none bg-[#F3F6F8]/10 py-8 rounded border border-brand-off/40">
          <div className="flex items-center space-x-2 mb-6">
            <div className="h-2 w-2 rounded-full bg-brand-gray"></div>
            <h2 className="text-xs uppercase tracking-wider font-bold font-montserrat text-brand-gray">Recently Viewed Products</h2>
          </div>
          {/* List thumbnails horizontally */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {recentlyViewed
              .filter((p) => p.id !== product.id)
              .slice(0, 6)
              .map((p) => (
                <Link 
                  key={p.id}
                  to={`/product/${p.slug}`}
                  className="flex flex-col space-y-1 border border-brand-off p-2 rounded bg-white hover:shadow transition-all group"
                >
                  <img src={p.images[0]} alt="recent view" className="aspect-[3/4] object-cover rounded bg-brand-off w-full h-[120px]" referrerPolicy="no-referrer" />
                  <span className="text-[10px] font-bold text-brand-charcoal truncate group-hover:text-brand-gray">{p.name}</span>
                  <span className="text-[10px] text-brand-gray font-semibold font-mono">₹{p.price}</span>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Global Quick View portal */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
