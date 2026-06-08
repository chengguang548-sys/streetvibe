import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  customItemName?: string;
  categoryName?: string;
  categoryPath?: string;
}

export default function Breadcrumbs({ customItemName, categoryName, categoryPath }: BreadcrumbsProps) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Generate Items schema
  const schemaItems = [
    { name: 'Home', url: `${window.location.origin}/` }
  ];

  if (categoryName) {
    schemaItems.push({
      name: categoryName,
      url: `${window.location.origin}${categoryPath || '/shop'}`
    });
  } else if (pathnames.includes('shop')) {
    schemaItems.push({
      name: 'Shop',
      url: `${window.location.origin}/shop`
    });
    
    // Check for category page subpath
    const remainder = pathnames.slice(pathnames.indexOf('shop') + 1);
    remainder.forEach((seg, i) => {
      schemaItems.push({
        name: seg.charAt(0).toUpperCase() + seg.slice(1),
        url: `${window.location.origin}/shop/${seg}`
      });
    });
  } else if (pathnames.includes('wishlist')) {
    schemaItems.push({ name: 'Wishlist', url: `${window.location.origin}/wishlist` });
  } else if (pathnames.includes('profile')) {
    schemaItems.push({ name: 'Profile Account', url: `${window.location.origin}/profile` });
  } else if (pathnames.includes('checkout')) {
    schemaItems.push({ name: 'Secure checkout', url: `${window.location.origin}/checkout` });
  } else if (pathnames.includes('contact')) {
    schemaItems.push({ name: 'Contact', url: `${window.location.origin}/contact` });
  }

  if (customItemName) {
    schemaItems.push({
      name: customItemName,
      url: window.location.href
    });
  }

  // Schema LD-JSON Code Injection
  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': schemaItems.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };

  return (
    <div className="bg-brand-off py-3.5 border-b border-brand-off/10 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <nav className="flex items-center space-x-1.5 md:space-x-2 text-xs font-montserrat font-semibold tracking-wider text-brand-gray uppercase">
          <Link to="/" className="hover:text-brand-charcoal transition-colors">Home</Link>
          
          <ChevronRight className="w-3.5 h-3.5 text-brand-gray/50" />

          {categoryName ? (
            <>
              <Link to={categoryPath || '/shop'} className="hover:text-brand-charcoal transition-colors">
                {categoryName}
              </Link>
              {customItemName && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-gray/50" />
                  <span className="text-brand-charcoal truncate font-black max-w-[120px] md:max-w-xs">{customItemName}</span>
                </>
              )}
            </>
          ) : pathnames.includes('shop') ? (
            <>
              <Link to="/shop" className="hover:text-brand-charcoal transition-colors">Shop</Link>
              {pathnames.slice(1).map((seg, idx, arr) => {
                const categoryRoute = `/shop/${seg}`;
                const innerLabel = seg.charAt(0).toUpperCase() + seg.slice(1);
                const isLast = idx === arr.length - 1 && !customItemName;

                return (
                  <React.Fragment key={seg}>
                    <ChevronRight className="w-3.5 h-3.5 text-brand-gray/50" />
                    {isLast ? (
                      <span className="text-brand-charcoal font-black">{innerLabel}</span>
                    ) : (
                      <Link to={categoryRoute} className="hover:text-brand-charcoal transition-colors">
                        {innerLabel}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
              {customItemName && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-gray/50" />
                  <span className="text-brand-charcoal truncate font-black max-w-[120px] md:max-w-xs">{customItemName}</span>
                </>
              )}
            </>
          ) : (
            // Handle unique directories (wishlist, profiles, contact, checkouts)
            pathnames.map((seg, idx, arr) => {
              const capitalized = seg.charAt(0).toUpperCase() + seg.slice(1);
              const isLast = idx === arr.length - 1;
              return (
                <React.Fragment key={seg}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-brand-gray/50" />}
                  <span className={`text-brand-charcoal ${isLast ? 'font-black' : ''}`}>
                    {capitalized === 'Profile' ? 'My Account' : capitalized === 'Product' ? 'Detail' : capitalized}
                  </span>
                </React.Fragment>
              );
            })
          )}
        </nav>

        {/* Dynamic SEO schema tag */}
        <script type="application/ld+json">
          {JSON.stringify(ldJson)}
        </script>
      </div>
    </div>
  );
}
