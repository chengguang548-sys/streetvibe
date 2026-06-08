import React from 'react';
import { useStore } from '../context/StoreContext';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useStore();

  const handleMoveToCart = (p: any) => {
    // Falls back to first sizing/color options
    const targetSize = p.sizes[0] || 'M';
    const targetCol = p.colors[0]?.name || 'Neutral';
    addToCart(p, targetSize, targetCol, 1);
    // Remove from wishlists standard practice
    toggleWishlist(p);
  };

  return (
    <div id="wishlist-page" className="pb-16 select-none bg-brand-white">
      {/* Clickable breadcrumb paths */}
      <Breadcrumbs />

      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-8">
        <div className="border-b border-brand-off pb-4 mb-8">
          <h1 className="font-montserrat font-black text-xl md:text-2xl tracking-tight text-brand-charcoal uppercase">
            MY STYLE WISHLIST
          </h1>
          <p className="text-xs text-brand-gray pt-1 font-semibold leading-relaxed">
            Keep track of premium garments you intend to include in future seasonal wardrobes ({wishlist.length} Items saved)
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-24 border border-brand-off bg-brand-off/30 rounded-lg flex flex-col items-center justify-center space-y-4">
            <Heart className="w-12 h-12 text-brand-gray" />
            <h3 className="font-montserrat font-bold text-xs uppercase tracking-widest text-brand-charcoal">Wishlist Empty</h3>
            <p className="text-xs text-brand-gray max-w-sm font-semibold leading-relaxed">Navigate our premium collections, mark garments with heart icons, and they will be retained here for seasonal orders.</p>
            <Link 
              to="/shop"
              className="bg-brand-charcoal text-white font-montserrat font-extrabold text-[10px] py-3 px-8 uppercase tracking-widest rounded shadow hover:bg-brand-gray duration-200 cursor-pointer"
            >
              Browse Shop Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlist.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-4 bg-white border border-brand-off rounded hover:shadow-sm duration-200"
              >
                {/* Thumb icon and titles */}
                <div className="flex items-center space-x-4">
                  <Link to={`/product/${item.slug}`} className="w-[60px] h-[75px] shrink-0 rounded overflow-hidden bg-brand-off block">
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </Link>

                  <div className="space-y-1">
                    <Link 
                      to={`/product/${item.slug}`} 
                      className="font-montserrat font-extrabold text-xs text-brand-charcoal hover:text-brand-gray transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <span className="text-[10px] font-bold text-brand-gray uppercase tracking-wider block">
                      {item.category} by StreetVibe
                    </span>
                    <div className="flex items-baseline space-x-1.5 pt-0.5">
                      {item.discountPrice ? (
                        <>
                          <span className="text-xs font-black text-brand-charcoal">₹{item.discountPrice}</span>
                          <span className="text-[10px] line-through text-brand-gray">₹{item.price}</span>
                        </>
                      ) : (
                        <span className="text-xs font-black text-brand-charcoal">₹{item.price}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wishlist management actions */}
                <div className="flex items-center space-x-4">
                  {/* Immediate move-to-cart */}
                  {item.inStock ? (
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="bg-brand-charcoal hover:bg-brand-gray text-white text-[10px] font-montserrat font-extrabold uppercase py-2.5 px-4 tracking-wider rounded-lg flex items-center space-x-1.5 duration-200 cursor-pointer shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Move To Cart</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1">Out of stock</span>
                  )}

                  {/* Remove completely */}
                  <button
                    onClick={() => toggleWishlist(item)}
                    className="p-2 border border-brand-gray/20 hover:border-red-400 hover:text-red-505 rounded-lg transition-colors text-brand-gray/80"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
