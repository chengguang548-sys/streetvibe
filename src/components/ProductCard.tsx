import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Eye, Heart, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  key?: React.Key;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const [hoveredIndex, setHoveredIndex] = useState(0);

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Use first size and first color available by default as fallback
    const defaultSize = product.sizes[0] || 'M';
    const defaultColor = product.colors[0]?.name || 'Neutral';
    addToCart(product, defaultSize, defaultColor, 1);
  };

  const isFav = isInWishlist(product.id);

  return (
    <div 
      className="group flex flex-col bg-white border border-brand-off rounded overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 relative select-none"
      onMouseEnter={() => product.images[1] && setHoveredIndex(1)}
      onMouseLeave={() => setHoveredIndex(0)}
    >
      {/* Image Gallery wrapper */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-off">
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          {/* Main or secondary hover image */}
          <img 
            src={product.images[hoveredIndex] || product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Dynamic Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col space-y-1.5 z-10">
          {product.discountPrice && (
            <span className="bg-red-500 font-montserrat font-extrabold text-[10px] text-brand-white px-2 py-1 tracking-wide uppercase rounded">
              {discountPercent}% OFF
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-brand-charcoal font-montserrat font-extrabold text-[10px] text-brand-white px-2 py-1 tracking-wide uppercase rounded">
              New
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-[#B8E1F0] font-montserrat font-extrabold text-[10px] text-brand-charcoal px-2 py-1 tracking-wide uppercase rounded border border-brand-sky/20">
              Hot
            </span>
          )}
          {!product.inStock && (
            <span className="bg-brand-gray/90 font-montserrat font-extrabold text-[10px] text-brand-white px-2 py-1 tracking-wide uppercase rounded">
              Sold Out
            </span>
          )}
        </div>

        {/* Floating Quick Action Overlays bottom drawer */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center space-x-2 z-10">
          {/* Quick Add to Cart button */}
          {product.inStock && (
            <button 
              onClick={handleQuickAdd}
              id={`prod-card-add-${product.id}`}
              className="p-2.5 bg-brand-white hover:bg-brand-charcoal text-brand-charcoal hover:text-brand-white rounded-full transition-colors shadow-lg focus:outline-none"
              title="Quick Add To Cart"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Quick View trigger */}
          <button 
            onClick={() => onQuickView(product)}
            className="p-2.5 bg-brand-white hover:bg-brand-charcoal text-brand-charcoal hover:text-brand-white rounded-full transition-colors shadow-lg focus:outline-none"
            title="Quick Details View"
          >
            <Eye className="w-4.5 h-4.5" />
          </button>

          {/* Wishlist triggers */}
          <button 
            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
            className={`p-2.5 rounded-full transition-colors shadow-lg focus:outline-none ${
              isFav 
                ? 'bg-brand-charcoal text-brand-white hover:bg-brand-gray' 
                : 'bg-brand-white text-brand-charcoal hover:bg-brand-charcoal hover:text-brand-white'
            }`}
            title={isFav ? "Saved in wishlists" : "Save to wishlist"}
          >
            <Heart className={`w-4.5 h-4.5 ${isFav ? 'fill-current text-red-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Information block */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Category */}
          <span className="text-[10px] font-bold font-montserrat uppercase tracking-wider text-brand-gray block">
            {product.category} by StreetVibe
          </span>

          {/* Title */}
          <Link 
            to={`/product/${product.slug}`}
            className="font-montserrat font-extrabold text-xs text-brand-charcoal hover:text-brand-gray line-clamp-1 transition-colors leading-snug"
          >
            {product.name}
          </Link>

          {/* Star review ratings */}
          <div className="flex items-center space-x-1.5 pt-0.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-[11px] font-bold text-brand-charcoal">{product.rating}</span>
            <span className="text-[10px] text-brand-gray">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Pricing Layout */}
        <div className="flex justify-between items-baseline pt-3 border-t border-brand-off/10 mt-3 select-none">
          {product.discountPrice ? (
            <div className="flex items-baseline space-x-1.5">
              <span className="text-sm font-black text-brand-charcoal">₹{product.discountPrice}</span>
              <span className="text-xs line-through text-brand-gray">₹{product.price}</span>
            </div>
          ) : (
            <span className="text-sm font-black text-brand-charcoal">₹{product.price}</span>
          )}

          {/* Stock inventory warning */}
          {product.inStock && product.stockCount < 10 && (
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider animate-pulse leading-none">
              Only {product.stockCount} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
