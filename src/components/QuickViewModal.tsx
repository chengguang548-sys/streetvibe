import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { X, ShoppingBag, Heart, Star, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickViewProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const navigate = useNavigate();

  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedNotify, setAddedNotify] = useState(false);

  // Set default configurations
  useEffect(() => {
    if (product) {
      setActiveImage(product.images[0]);
      setSelectedSize(product.sizes[0] || 'M');
      setSelectedColor(product.colors[0]?.name || '');
      setQuantity(1);
      setAddedNotify(false);
    }
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedNotify(true);
    setTimeout(() => {
      setAddedNotify(false);
      onClose();
    }, 1500);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    onClose();
    navigate('/checkout');
  };

  const isFav = isInWishlist(product.id);
  const pPrice = product.discountPrice || product.price;

  return (
    <div id="quickview-overlay" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-brand-white rounded-lg shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Modal Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-brand-white hover:bg-brand-off border border-brand-off text-brand-charcoal hover:scale-105 active:scale-95 duration-200 rounded-full z-15 focus:outline-none"
          title="Close details popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side Images section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between border-r border-brand-off bg-[#F3F6F8]/30 max-h-[45vh] md:max-h-full overflow-y-auto">
          {/* Main Visual box */}
          <div className="bg-white rounded aspect-[3/4] w-full flex items-center justify-center overflow-hidden border border-brand-off relative">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="object-cover w-full h-full max-h-[350px] md:max-h-full"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Sub Row Carousel Items */}
          <div className="grid grid-cols-4 gap-2.5 mt-3.5 select-none">
            {product.images.map((img) => (
              <button
                key={img}
                onClick={() => setActiveImage(img)}
                className={`aspect-[3/4] overflow-hidden rounded bg-white border cursor-pointer ${
                  activeImage === img ? 'border-brand-charcoal scale-95 ring-1 ring-brand-charcoal' : 'border-brand-off hover:border-brand-gray'
                }`}
              >
                <img src={img} alt="detail asset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side Settings configurator */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-[90vh]">
          <div className="space-y-4">
            {/* Category header */}
            <span className="text-[10px] tracking-[0.2em] font-montserrat uppercase font-extrabold text-brand-gray block">
              {product.category} by StreetVibe
            </span>

            {/* Title */}
            <h3 className="font-montserrat font-extrabold text-lg text-brand-charcoal md:text-xl leading-tight">
              {product.name}
            </h3>

            {/* Price section */}
            <div className="flex items-center space-x-3.5 pt-1">
              {product.discountPrice ? (
                <>
                  <span className="text-xl font-extrabold text-brand-charcoal font-sans">₹{product.discountPrice}</span>
                  <span className="text-sm line-through text-brand-gray font-sans">₹{product.price}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider font-montserrat">
                    Sale Promo
                  </span>
                </>
              ) : (
                <span className="text-lg font-extrabold text-brand-charcoal font-sans">₹{product.price}</span>
              )}
            </div>

            {/* Rating Stars */}
            <div className="flex items-center space-x-2 pb-1.5 border-b border-brand-off">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-current text-amber-400" />
              </div>
              <span className="text-xs font-bold text-brand-charcoal">{product.rating}</span>
              <span className="text-xs text-brand-gray">({product.reviewsCount} customer reviews)</span>
            </div>

            {/* Description */}
            <p className="text-xs text-brand-gray leading-relaxed font-semibold">
              {product.description}
            </p>

            {/* Size Configurations */}
            <div className="space-y-2 select-none">
              <span className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider">
                Select Sizing: <strong className="text-brand-charcoal ml-1">{selectedSize}</strong>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[40px] h-[36px] px-2 text-xs font-extrabold border rounded uppercase flex items-center justify-center transition-all ${
                      selectedSize === size
                        ? 'bg-brand-charcoal border-brand-charcoal text-white scale-95'
                        : 'border-brand-gray/30 text-brand-charcoal hover:border-brand-charcoal bg-transparent'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color configurations */}
            <div className="space-y-2 select-none">
              <span className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider">
                Style Finish: <strong className="text-brand-charcoal ml-1">{selectedColor}</strong>
              </span>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border cursor-pointer hover:scale-105 active:scale-95 duration-200 relative ${
                      selectedColor === color.name ? 'ring-2 ring-brand-charcoal ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {selectedColor === color.name && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3] mix-blend-difference" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2 select-none">
              <span className="block text-[10px] font-extrabold text-brand-gray uppercase tracking-wider">Quantity</span>
              <div className="flex items-center space-x-3.5">
                <div className="flex items-center border border-brand-off rounded overflow-hidden bg-brand-off">
                  <button 
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-3.5 py-2 hover:bg-white text-brand-charcoal font-sans transition-colors focus:outline-none text-xs font-black"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold text-brand-charcoal">{quantity}</span>
                  <button 
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-3.5 py-2 hover:bg-white text-brand-charcoal font-sans transition-colors focus:outline-none text-xs font-black"
                  >
                    +
                  </button>
                </div>
                {/* Stock Warning details */}
                <span className="text-[11px] font-bold text-brand-gray">
                  {product.inStock ? `${product.stockCount} units available in inventory` : 'Out of stock'}
                </span>
              </div>
            </div>
          </div>

          {/* Action trigger operations row */}
          <div className="pt-6 border-t border-brand-off mt-6 space-y-3.5">
            {addedNotify ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded p-3 text-xs font-bold font-montserrat text-center uppercase tracking-wider flex items-center justify-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>ADDED TO SHOPPING CART SUCCESSFULLY!</span>
              </div>
            ) : product.inStock ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-brand-off hover:bg-brand-gray border border-brand-charcoal text-brand-charcoal hover:text-white py-3.5 text-xs font-montserrat font-bold uppercase tracking-wider rounded transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-brand-charcoal hover:bg-brand-black text-brand-white py-3.5 text-xs font-montserrat font-bold uppercase tracking-wider rounded transition-all duration-200"
                >
                  Buy It Now
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full bg-brand-gray/30 text-brand-charcoal/50 py-3 text-sm font-montserrat font-semibold uppercase tracking-wider rounded cursor-not-allowed select-none"
              >
                OUT OF STOCK
              </button>
            )}

            {/* Add to wishlist shortcut */}
            <button 
              onClick={() => toggleWishlist(product)}
              className="w-full flex items-center justify-center space-x-2 text-xs font-bold text-brand-charcoal uppercase tracking-wider hover:text-brand-gray transition-colors cursor-pointer pt-1"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'text-red-400 fill-current' : ''}`} />
              <span>{isFav ? 'Added to Wishlists' : 'Save To Wishlist'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
