import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import Breadcrumbs from '../components/Breadcrumbs';
import { SlidersHorizontal, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function Shop() {
  const { category: urlCategory } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { categories } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // States mirroring URL / filters query
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
  const [sizes, setSizes] = useState<string[]>(searchParams.get('sizes')?.split(',').filter(Boolean) || []);
  const [colors, setColors] = useState<string[]>(searchParams.get('colors')?.split(',').filter(Boolean) || []);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync category changes with page resetting
  useEffect(() => {
    setPage(1);
  }, [urlCategory]);

  // Load and fetch from server on dependency shift
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        let endpoint = `${API_BASE_URL}/api/products?page=${page}&limit=12&sort=${sort}`;
        
        // Category path override
        if (urlCategory && urlCategory !== 'all') {
          endpoint += `&category=${urlCategory}`;
        }
        
        if (sizes.length > 0) {
          endpoint += `&sizes=${sizes.join(',')}`;
        }
        
        if (colors.length > 0) {
          endpoint += `&colors=${colors.join(',')}`;
        }

        if (minPrice) {
          endpoint += `&minPrice=${minPrice}`;
        }

        if (maxPrice) {
          endpoint += `&maxPrice=${maxPrice}`;
        }

        if (inStock) {
          endpoint += `&inStock=true`;
        }

        // Tags handles
        const tag = searchParams.get('tag');
        if (tag === 'new-arrivals') {
          endpoint = `${API_BASE_URL}/api/products?isNewArrival=true&limit=12&sort=${sort}`;
        } else if (tag === 'sale') {
          endpoint = `${API_BASE_URL}/api/products?limit=50&sort=${sort}`; // Front will filter sale on load
        }

        const resp = await fetch(endpoint);
        const data = await resp.json();
        
        let fetchedProducts = data.products || [];

        // Manual front filters for specialized tag listings
        if (tag === 'sale') {
          fetchedProducts = fetchedProducts.filter((p: Product) => p.discountPrice !== undefined);
        }

        setProducts(fetchedProducts);
        setTotalCount(data.totalCount || fetchedProducts.length);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [urlCategory, sort, sizes, colors, minPrice, maxPrice, inStock, page, searchParams]);

  // Update URL Search Parameters
  const syncParams = (newFilters: Record<string, string | boolean | string[]>) => {
    const nextParams = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        if (val.length > 0) nextParams.set(key, val.join(','));
        else nextParams.delete(key);
      } else if (typeof val === 'boolean') {
        if (val) nextParams.set(key, 'true');
        else nextParams.delete(key);
      } else if (val) {
        nextParams.set(key, String(val));
      } else {
        nextParams.delete(key);
      }
    });

    setSearchParams(nextParams);
  };

  const handleSizeToggle = (size: string) => {
    const nextArr = sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size];
    setSizes(nextArr);
    setPage(1);
    syncParams({ sizes: nextArr });
  };

  const handleColorToggle = (color: string) => {
    const nextArr = colors.includes(color) ? colors.filter((c) => c !== color) : [...colors, color];
    setColors(nextArr);
    setPage(1);
    syncParams({ colors: nextArr });
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    syncParams({ minPrice, maxPrice });
  };

  const handleClearAll = () => {
    setSort('latest');
    setSizes([]);
    setColors([]);
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setPage(1);
    navigate(urlCategory ? `/shop/${urlCategory}` : '/shop');
  };

  const activeCategoryLabel = urlCategory
    ? categories.includes(urlCategory)
      ? urlCategory.toUpperCase()
      : 'SHOP ALL'
    : 'SHOP ALL';

  const sizeListPool = ['S', 'M', 'L', 'XL', 'XXL', '7', '8', '9', '10', '11'];
  
  const colorListPool = [
    { name: 'Sky Blue', hex: '#B8E1F0' },
    { name: 'Ice Blue', hex: '#DCEFF7' },
    { name: 'Charcoal Black', hex: '#061114' },
    { name: 'Alpine White', hex: '#F3F6F8' },
    { name: 'Slate Gray', hex: '#485152' },
    { name: 'Sand Beige', hex: '#E6DFD3' },
    { name: 'Olive Drab', hex: '#556B2F' }
  ];

  return (
    <div id="shop-catalog-view" className="pb-16 select-none">
      
      {/* Clickable Breadcrumbs on top of page */}
      <Breadcrumbs categoryName={urlCategory ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1) : undefined} categoryPath={urlCategory ? `/shop/${urlCategory}` : undefined} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        
        {/* Upper catalog header with results count and sort filter options */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-brand-off pb-6 mb-8 gap-4">
          <div>
            <h1 className="font-montserrat font-black text-2xl tracking-tight text-brand-charcoal select-all uppercase">
              {activeCategoryLabel}
            </h1>
            <p className="text-xs text-brand-gray font-medium pt-1">
              Displaying {totalCount} premium lifestyle garments matched in inventory
            </p>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
            {/* Mobile filters toggler */}
            <button 
              onClick={() => setIsMobileFiltersOpen(true)}
              className="md:hidden flex items-center space-x-1.5 border border-brand-gray/30 px-4 py-2.5 rounded hover:bg-brand-off duration-200"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs font-bold uppercase font-montserrat">Catalog Filters</span>
            </button>

            {/* Sorting */}
            <div className="flex items-center space-x-2 bg-brand-off px-3.5 py-2.5 rounded border border-brand-off/10 text-xs">
              <span className="font-montserrat font-bold text-xs text-brand-gray uppercase tracking-wider">Sort:</span>
              <select 
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                  syncParams({ sort: e.target.value });
                }}
                className="bg-transparent text-brand-charcoal font-bold font-montserrat focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider pl-1"
              >
                <option value="latest">Latest Arrivals</option>
                <option value="popular">Popularity Index</option>
                <option value="price-low">Price: Low - High</option>
                <option value="price-high">Price: High - Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* DESKTOP SIDEBAR FILTERS PANEL */}
          <aside className="hidden md:block md:col-span-3 space-y-8 select-none">
            {/* Header clear shortcut */}
            <div className="flex justify-between items-center bg-brand-off border border-brand-off/10 p-3.5 rounded">
              <span className="text-xs font-montserrat font-extrabold text-brand-charcoal tracking-wider uppercase">Active Filters</span>
              <button 
                onClick={handleClearAll}
                className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-widest cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Sub Categories Quick Switcher */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-widest font-montserrat border-l-2 border-brand-sky pl-2.5">
                Sub Categories
              </h3>
              <div className="flex flex-col space-y-1.5 text-xs text-brand-gray font-semibold">
                <button 
                  onClick={() => navigate('/shop')}
                  className={`text-left hover:text-brand-charcoal transition-all font-bold ${!urlCategory ? 'text-brand-charcoal pl-1' : ''}`}
                >
                  Shop All Collections
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => navigate(`/shop/${cat}`)}
                    className={`text-left hover:text-brand-charcoal transition-all capitalize ${urlCategory === cat ? 'text-brand-charcoal pl-1 font-black underline' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizing Checkbox Array */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-widest font-montserrat border-l-2 border-brand-sky pl-2.5">
                Sizing Matrix
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {sizeListPool.map((sz) => {
                  const isChecked = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      onClick={() => handleSizeToggle(sz)}
                      className={`w-[44px] h-[36px] font-bold text-xs uppercase rounded transition-all border flex items-center justify-center cursor-pointer ${
                        isChecked 
                          ? 'bg-brand-charcoal border-brand-charcoal text-white scale-95' 
                          : 'border-brand-gray/35 text-brand-charcoal bg-transparent hover:border-brand-charcoal'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors circular previews */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-widest font-montserrat border-l-2 border-brand-sky pl-2.5">
                Lifestyle Tones
              </h3>
              <div className="grid grid-cols-4 gap-3.5">
                {colorListPool.map((color) => {
                  const isChecked = colors.includes(color.name);
                  return (
                    <div 
                      key={color.name}
                      onClick={() => handleColorToggle(color.name)}
                      className={`flex flex-col items-center space-y-1 cursor-pointer group`}
                    >
                      <div 
                        className={`w-6 h-6 rounded-full border border-brand-off flex items-center justify-center duration-200 hover:scale-110 active:scale-95 ${
                          isChecked ? 'ring-2 ring-brand-charcoal ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      ></div>
                      <span className={`text-[9px] text-center font-bold truncate max-w-[55px] ${isChecked ? 'text-brand-charcoal underline' : 'text-brand-gray group-hover:text-brand-charcoal'}`}>
                        {color.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price slider inputs */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-widest font-montserrat border-l-2 border-brand-sky pl-2.5">
                Price Range
              </h3>
              <form onSubmit={handlePriceSubmit} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-brand-gray uppercase tracking-widest mb-0.5">Min ₹</label>
                    <input 
                      type="number" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full bg-brand-off border border-brand-gray/30 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-brand-gray uppercase tracking-widest mb-0.5">Max ₹</label>
                    <input 
                      type="number" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="9999"
                      className="w-full bg-brand-off border border-brand-gray/30 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-brand-charcoal text-brand-white text-[10px] font-montserrat font-bold uppercase py-2 tracking-widest shadow hover:bg-brand-gray rounded transition-colors"
                >
                  Apply Price Filters
                </button>
              </form>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-widest font-montserrat border-l-2 border-brand-sky pl-2.5">
                Inventory Check
              </h3>
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-brand-gray hover:text-brand-charcoal">
                <input 
                  type="checkbox" 
                  checked={inStock}
                  onChange={(e) => {
                    setInStock(e.target.checked);
                    setPage(1);
                    syncParams({ inStock: e.target.checked });
                  }}
                  className="rounded text-brand-charcoal border-brand-gray/30 focus:ring-0 cursor-pointer w-4 h-4 bg-brand-off"
                />
                <span>Exclude Out-Of-Stock Items</span>
              </label>
            </div>
          </aside>

          {/* MAIN PRODUCT CATALOG GRID (9 COLS) */}
          <main className="col-span-1 md:col-span-9 space-y-12 select-all pointer-events-auto">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="bg-brand-off aspect-[3/4] rounded"></div>
                    <div className="bg-brand-off h-4 w-2/3 rounded"></div>
                    <div className="bg-brand-off h-3 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 px-4 bg-brand-off/40 border border-brand-off rounded h-[400px] flex flex-col justify-center items-center space-y-4">
                <SlidersHorizontal className="w-12 h-12 text-brand-gray" />
                <h3 className="font-montserrat font-extrabold text-sm uppercase tracking-wide">No Matches Found</h3>
                <p className="text-xs text-brand-gray max-w-sm leading-relaxed">We could not locate any products matching your specific sizes, prices, colors, or Category combinations in our StreetVibe catalog.</p>
                <button 
                  onClick={handleClearAll}
                  className="bg-brand-charcoal text-brand-white font-montserrat font-bold text-xs uppercase px-6 py-2.5 tracking-wider rounded border border-brand-charcoal hover:bg-brand-gray"
                >
                  Wipe Filters Filter List
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6" id="products-catalog-grid">
                  {products.map((prod) => (
                    <ProductCard key={prod.id} product={prod} onQuickView={setQuickViewProduct} />
                  ))}
                </div>

                {/* 12. STANDARD PAGINATION BAR */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 pt-6 border-t border-brand-off">
                    <button 
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 border border-brand-gray/20 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-off duration-200"
                    >
                      <ChevronLeft className="w-4 h-4 text-brand-charcoal" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                      <button
                        key={pNum}
                        onClick={() => { setPage(pNum); syncParams({ page: String(pNum) }); }}
                        className={`w-[36px] h-[36px] text-xs font-montserrat font-extrabold rounded ${
                          page === pNum
                            ? 'bg-brand-charcoal text-white font-black scale-95 shadow'
                            : 'bg-brand-off border border-brand-off/10 text-brand-charcoal hover:bg-brand-gray/15'
                        }`}
                      >
                        {pNum}
                      </button>
                    ))}

                    <button 
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 border border-brand-gray/20 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-off duration-200"
                    >
                      <ChevronRight className="w-4 h-4 text-brand-charcoal" />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE INTEGRATED SLIDEOUT FILTERS PANEL */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end md:hidden">
          <div className="w-4/5 max-w-sm bg-brand-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <span className="font-montserrat font-bold text-sm uppercase tracking-wider text-brand-charcoal">Filters Catalog</span>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 text-brand-charcoal focus:outline-none">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub categories quick list */}
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold tracking-wider text-brand-gray uppercase">Catalog Sections</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {categories.map((cat) => (
                    <button 
                      key={cat}
                      className={`text-left p-2 rounded truncate transition-colors capitalize ${
                        urlCategory === cat ? 'bg-brand-charcoal text-white' : 'bg-brand-off hover:bg-brand-gray/20 text-brand-charcoal'
                      }`}
                      onClick={() => {
                        setIsMobileFiltersOpen(false);
                        navigate(`/shop/${cat}`);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size selections */}
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold tracking-wider text-brand-gray uppercase font-montserrat">Size Filter</span>
                <div className="flex flex-wrap gap-1.5">
                  {sizeListPool.map((sz) => {
                    const isChecked = sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        onClick={() => handleSizeToggle(sz)}
                        className={`w-10 h-10 font-bold text-xs uppercase border rounded flex items-center justify-center transition-all ${
                          isChecked ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-gray/30 text-brand-charcoal'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors selection */}
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold tracking-wider text-brand-gray uppercase font-montserrat">Color Filter</span>
                <div className="flex flex-wrap gap-2">
                  {colorListPool.map((color) => {
                    const isChecked = colors.includes(color.name);
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleColorToggle(color.name)}
                        className={`w-7 h-7 rounded-full border border-brand-off ${
                          isChecked ? 'ring-2 ring-brand-charcoal ring-offset-2 scale-105 shadow' : ''
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      ></button>
                    );
                  })}
                </div>
              </div>

              {/* Price filter inputs */}
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold tracking-wider text-brand-gray uppercase font-montserrat">Price Range (₹)</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input 
                    type="number" 
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="bg-brand-off border border-brand-gray/30 rounded p-2 focus:outline-none"
                  />
                  <input 
                    type="number" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="bg-brand-off border border-brand-gray/30 rounded p-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-brand-off">
              <button 
                onClick={() => {
                  syncParams({ minPrice, maxPrice });
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full bg-brand-charcoal text-brand-white font-montserrat font-bold text-xs uppercase py-3.5 tracking-widest rounded shadow"
              >
                Apply Parameters
              </button>
              <button 
                onClick={() => {
                  handleClearAll();
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full border border-brand-gray/30 text-brand-charcoal font-montserrat font-bold text-xs uppercase py-2.5 tracking-widest mt-2 rounded"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED QUICKVIEW OVERLAY PORTAL */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
