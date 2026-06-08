import fs from 'fs';
import path from 'path';
import { Product, User, Order, Review, Coupon, Address, Newsletter, Contact } from '../src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure db directory and file exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface DatabaseSchema {
  users: User[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  newsletters: Newsletter[];
  contacts: Contact[];
  banners: any[];
}

// Pre-defined Unsplash premium apparel images
const UN_IMAGES = {
  shirts: [
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
    'https://images.unsplash.com/photo-1620012253295-c05ce3e85773?w=600&q=80',
    'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&q=80',
    'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80'
  ],
  pants: [
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80',
    'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&q=80',
    'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&q=80',
    'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=600&q=80'
  ],
  tshirts: [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80',
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&q=80',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80'
  ],
  shoes: [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',
    'https://images.unsplash.com/photo-1626244501212-3937229c428e?w=600&q=80',
    'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&q=80',
    'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'
  ],
  accessories: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    'https://images.unsplash.com/photo-1627124118123-2654b3ab2231?w=600&q=80'
  ]
};

const DEFAULT_COUPONS: Coupon[] = [
  { code: 'STREET10', discountPercent: 10, minAmount: 499, isActive: true },
  { code: 'VIBESTYLE20', discountPercent: 20, minAmount: 1499, isActive: true },
  { code: 'WELCOME15', discountPercent: 15, minAmount: 0, isActive: true },
  { code: 'SUPER50', discountPercent: 50, minAmount: 2999, isActive: true }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin',
    email: 'sheltonantony43@gmail.com', // Pre-populated with user's email
    firstName: 'Shelton',
    lastName: 'Antony',
    phone: '+919876543210',
    role: 'admin',
    addresses: [
      {
        firstName: 'Shelton',
        lastName: 'Antony',
        company: 'StreetVibe Tech',
        street: '102 Luxury Block, Mg Road',
        apartment: 'Apt 4B',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India'
      }
    ]
  },
  {
    id: 'usr_customer_demo',
    email: 'customer@streetvibe.com',
    firstName: 'Alex',
    lastName: 'Vibe',
    phone: '+919988776655',
    role: 'user',
    addresses: []
  }
];

// Helper to generate 50 ultra-premium fashion products
function generateProducts(): Product[] {
  const list: Product[] = [];
  const categories = ['shirts', 'pants', 'tshirts', 'shoes', 'accessories'];
  
  const prefixes = {
    shirts: ['Premium Cotton', 'Silk-Blend', 'Nordic Linen', 'Minimalist Collared', 'Classic Oxford', 'Urban Overshirt', 'Studio Drape', 'Vintage Corduroy', 'Sleek Fit', 'Elite Flannel'],
    pants: ['Relaxed Pleated', 'Chino Tailored', 'Urban Cargo', 'Stretch Slim-Fit', 'Draped Linen', 'Heavy Canvas', 'Athletic Tech', 'Brutalist Denims', 'Classic Straight', 'Cropped Minimal'],
    tshirts: ['Signature Heavyweight', 'Asymmetric Relaxed', 'Studio Boxy', 'Luxe Pima Cotton', 'Classic Crewneck', 'Vintage Washed', 'Droptail Curved', 'Tactical Ribbed', 'Branded Graphic', 'Elevated Mockneck'],
    shoes: ['Architect Low-Top', 'Heritage Suede Trainer', 'Raw Leather Sneaker', 'Chelsea Suede Boot', 'Classic Commuter Slip-On', 'Street Knit Jogger', 'Minimalist Derby', 'Retro Court Sneaker', 'All-Weather Utility', 'Aero Lightweight'],
    accessories: ['Modular Street Pack', 'Aviator Carbon Sunglasses', 'Slate Leather Wallet', 'Chrono Minimalist Watch', 'Sterling Steel Necklace', 'Technical Webbing Belt', 'Knit Essential Beanie', 'Travel Duffle Bag', 'Silver Signet Ring', 'Leather Key Organiser']
  };

  const fabricDescriptions = {
    shirts: 'Crafted from 100% long-staple organic Egyptian cotton, delivering maximum breathability, a structured drape, and a soft-brushed cloud-like feel. Featuring standard European pearl-buttons and dynamic seam stitching.',
    pants: 'Engineered with active-stretch twill and durable single-weave cotton fibers designed to hold structure. Double-stitched pockets and premium matte hardware provide a lasting, clean utilities profile.',
    tshirts: 'Woven using ultra-premium heavy double-knit Pima cotton (260GSM). Pre-shrunk with a customized bio-wash finish for timeless quality, soft feel, and resilient neck line recovery.',
    shoes: 'Upper structured in full-grain Italian calf leather and natural split-suedes. Mounted on an anatomical Ortholite padded footbed and long-lasting volcanic raw rubber cupsoles.',
    accessories: 'Curated using top-tier materials: marine-grade 316L stainless steel, aerospace aluminum, and water-repellent Cordura ballistics to complete any premium modern silhouette.'
  };

  const colorPool = [
    { name: 'Sky Blue', hex: '#B8E1F0' },
    { name: 'Ice Blue', hex: '#DCEFF7' },
    { name: 'Charcoal Black', hex: '#061114' },
    { name: 'Alpine White', hex: '#F3F6F8' },
    { name: 'Slate Gray', hex: '#485152' },
    { name: 'Sand Beige', hex: '#E6DFD3' },
    { name: 'Olive Drab', hex: '#556B2F' }
  ];

  let idCounter = 1;
  
  categories.forEach((cat) => {
    const isProductShoes = cat === 'shoes';
    const isProductAcc = cat === 'accessories';
    
    // Generate exactly 10 premium items for each of the 5 categories = 50 items
    for (let i = 0; i < 10; i++) {
      const name = `${prefixes[cat as keyof typeof prefixes][i]} ${cat.slice(0, -1).toUpperCase()}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const basePrice = cat === 'shoes' ? 3999 : cat === 'shirts' ? 1899 : cat === 'pants' ? 2499 : cat === 'tshirts' ? 999 : 1299;
      // Add incremental variation to pricing
      const finalBasePrice = basePrice + (i * 200);
      // Give some items a great discount
      const hasDiscount = i % 3 === 0;
      const discountPrice = hasDiscount ? Math.round(finalBasePrice * 0.8) : undefined;
      
      // Determine sizes
      let sizes = ['S', 'M', 'L', 'XL', 'XXL'];
      if (isProductShoes) {
        sizes = ['7', '8', '9', '10', '11'];
      } else if (isProductAcc) {
        sizes = ['O/S']; // One Size
      }

      // Pick 2 image variants from pool
      const catImages = UN_IMAGES[cat as keyof typeof UN_IMAGES];
      const image1 = catImages[i % catImages.length];
      const image2 = catImages[(i + 1) % catImages.length];
      const image3 = catImages[(i + 2) % catImages.length];

      // Ratings
      const ratings = parseFloat((4.0 + (i % 10) * 0.1).toFixed(1));
      const reviews = 12 + (i * 7);

      // Distribute tags
      const isNewArrival = i < 3;
      const isBestSeller = i >= 3 && i < 6;
      const isTrending = i >= 6;

      list.push({
        id: `prod_${idCounter++}`,
        name,
        slug,
        category: cat,
        brand: 'StreetVibe',
        price: finalBasePrice,
        discountPrice,
        description: `The definining statement of the season. ${name} represents our commitment to minimalist high-fashion silhouettes. Perfect for styling across variable temperatures. Pairs effortlessly.`,
        images: [image1, image2, image3],
        sizes,
        colors: [
          colorPool[i % colorPool.length],
          colorPool[(i + 1) % colorPool.length],
          colorPool[(i + 2) % colorPool.length]
        ],
        inStock: i % 8 !== 0, // Most are in stock
        stockCount: i % 8 === 0 ? 0 : 45 - i * 3,
        rating: ratings,
        reviewsCount: reviews,
        fabricDetails: fabricDescriptions[cat as keyof typeof fabricDescriptions],
        shippingInfo: 'Free Standard Shipping above ₹999. Shipped within 24-48 hours via premium express couriers. Estimated delivery window: 2-4 business days.',
        returnsInfo: 'Easy returns and exchanges within 14 days of delivery. Reverse pick-up is scheduled automatically upon request.',
        isNewArrival,
        isBestSeller,
        isTrending
      });
    }
  });

  return list;
}

class LowStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: DEFAULT_USERS,
      products: [],
      orders: [],
      reviews: [],
      coupons: DEFAULT_COUPONS,
      newsletters: [],
      contacts: [],
      banners: []
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure products are populated with at least 50 if empty
        if (!this.data.products || this.data.products.length === 0) {
          this.data.products = generateProducts();
          this.save();
        }
        // Ensure coupons are pre-loaded
        if (!this.data.coupons || this.data.coupons.length === 0) {
          this.data.coupons = DEFAULT_COUPONS;
          this.save();
        }
        // Ensure default users exist
        DEFAULT_USERS.forEach(u => {
          if (!this.data.users.find(tu => tu.email === u.email)) {
            this.data.users.push(u);
          }
        });
      } else {
        // First run initialization
        this.data.products = generateProducts();
        this.data.users = DEFAULT_USERS;
        this.data.coupons = DEFAULT_COUPONS;
        this.save();
      }
    } catch (e) {
      console.error('Failed to load JSON DB, fallback to memory', e);
      this.data.products = generateProducts();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save JSON DB', e);
    }
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }

  public updateUser(user: User) {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
      this.save();
    }
  }

  public getProducts(): Product[] {
    return this.data.products;
  }

  public updateProduct(product: Product) {
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx !== -1) {
      this.data.products[idx] = product;
    } else {
      this.data.products.push(product);
    }
    this.save();
  }

  public deleteProduct(id: string): boolean {
    const lengthBefore = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    const deleted = this.data.products.length < lengthBefore;
    if (deleted) this.save();
    return deleted;
  }

  public getOrders(): Order[] {
    return this.data.orders;
  }

  public findOrderById(orderId: string): Order | undefined {
    return this.data.orders.find((o) => o.orderId === orderId);
  }

  public addOrder(order: Order) {
    this.data.orders.push(order);
    this.save();
  }

  public updateOrder(order: Order) {
    const idx = this.data.orders.findIndex((o) => o.orderId === order.orderId);
    if (idx !== -1) {
      this.data.orders[idx] = order;
      this.save();
    }
  }

  public getReviews(): Review[] {
    return this.data.reviews;
  }

  public addReview(review: Review) {
    this.data.reviews.push(review);
    this.save();
  }

  public getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  public updateCoupon(coupon: Coupon) {
    const idx = this.data.coupons.findIndex((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (idx !== -1) {
      this.data.coupons[idx] = coupon;
    } else {
      this.data.coupons.push(coupon);
    }
    this.save();
  }

  public addNewsletter(email: string) {
    if (!this.data.newsletters.find((n) => n.email === email)) {
      this.data.newsletters.push({ email, subscribedAt: new Date().toISOString() });
      this.save();
    }
  }

  public getNewsletters() {
    return this.data.newsletters;
  }

  public addContact(contact: Contact) {
    this.data.contacts.push(contact);
    this.save();
  }

  public getContacts() {
    return this.data.contacts;
  }
}

export const dbStore = new LowStore();
