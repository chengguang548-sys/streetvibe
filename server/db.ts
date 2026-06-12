import 'dotenv/config';
import mongoose from 'mongoose';
import { Db, GridFSBucket, Collection, Document, InsertOneResult } from 'mongodb';
import { createHash } from 'crypto';
import { finished } from 'stream/promises';
import { Product, User, Order, Review, Coupon, Newsletter, Contact } from '../src/types';

function extractMongoUri(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const cleaned = value.trim();
  if (cleaned.toUpperCase().startsWith('MONGODB_URI=')) {
    return cleaned.slice(cleaned.indexOf('=') + 1);
  }
  return cleaned;
}

const MONGO_URI = extractMongoUri(
  process.env.MONGODB_URI ?? process.env.MONGO_URI ?? process.env.MONGODB_URL ?? process.env.MONGODB_CONNECTION_STRING
);
const MONGO_DB_NAME = process.env.MONGODB_DB_NAME || 'streetvibe';

function validateMongoUri(uri: string): string {
  const placeholderPatterns = ['<username>', '<password>', '<cluster>', '<database>'];
  if (placeholderPatterns.some((placeholder) => uri.includes(placeholder))) {
    throw new Error(
      'Invalid MONGODB_URI: replace <username>, <password>, <cluster>, and <database> with your Atlas credentials and cluster name in .env.'
    );
  }
  return uri;
}

if (!MONGO_URI) {
  throw new Error(
    'Missing required environment variable: MONGODB_URI. Create a .env file with MONGODB_URI set to your Atlas connection string.'
  );
}

const VALIDATED_MONGO_URI = validateMongoUri(MONGO_URI);

let db: Db;
let bucket: GridFSBucket;

export interface StoredFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

const DEFAULT_COUPONS: Coupon[] = [
  { code: 'STREET10', discountPercent: 10, minAmount: 499, isActive: true },
  { code: 'VIBESTYLE20', discountPercent: 20, minAmount: 1499, isActive: true },
  { code: 'WELCOME15', discountPercent: 15, minAmount: 0, isActive: true },
  { code: 'SUPER50', discountPercent: 50, minAmount: 2999, isActive: true }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin',
    email: 'sheltonantony43@gmail.com',
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

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function buildProductQuery(filters: {
  search?: string;
  category?: string;
  sizes?: string[];
  colors?: string[];
  brand?: string;
  inStockOnly?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
}): Document {
  const query: Document = {};

  if (filters.search) {
    const q = filters.search.trim();
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } }
    ];
  }

  if (filters.category && filters.category !== 'all') {
    query.category = filters.category.toLowerCase();
  }

  if (filters.sizes && filters.sizes.length) {
    query.sizes = { $in: filters.sizes };
  }

  if (filters.colors && filters.colors.length) {
    query['colors.name'] = { $in: filters.colors.map((color) => color.toLowerCase()) };
  }

  if (filters.brand) {
    query.brand = filters.brand;
  }

  if (filters.inStockOnly) {
    query.inStock = true;
  }

  if (filters.isNewArrival) {
    query.isNewArrival = true;
  }

  if (filters.isBestSeller) {
    query.isBestSeller = true;
  }

  if (filters.isTrending) {
    query.isTrending = true;
  }

  return query;
}

function applyPriceFilter(products: Product[], minPrice?: number, maxPrice?: number): Product[] {
  return products.filter((product) => {
    const effectivePrice = product.discountPrice ?? product.price;
    if (minPrice !== undefined && effectivePrice < minPrice) {
      return false;
    }
    if (maxPrice !== undefined && effectivePrice > maxPrice) {
      return false;
    }
    return true;
  });
}

async function getCollection<T>(name: string): Promise<Collection<T>> {
  if (!db) {
    throw new Error('MongoDB is not connected yet. Call connectDatabase() before using collections.');
  }
  return db.collection<T>(name);
}

export async function getGridFsBucket(): Promise<GridFSBucket> {
  if (!bucket) {
    throw new Error('GridFS bucket is not initialized. Call connectDatabase() first.');
  }
  return bucket;
}

export async function connectDatabase(): Promise<void> {
  if (!db) {
    try {
      await mongoose.connect(VALIDATED_MONGO_URI, {
        dbName: MONGO_DB_NAME,
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        tls: true,
        appName: 'StreetVibe-Backend',
        serverApi: { version: '1' }
      });
    } catch (error: any) {
      if (error?.code === 'ECONNREFUSED' && error?.message?.includes('querySrv')) {
        throw new Error(
          'MongoDB Atlas SRV DNS lookup failed. Your environment is refusing SRV DNS resolution for _mongodb._tcp.cluster5.uiemjex.mongodb.net.\n' +
          'Use a standard MongoDB connection string from Atlas instead of mongodb+srv, or allow SRV DNS queries in your network/firewall.'
        );
      }
      throw error;
    }

    if (!mongoose.connection.db) {
      throw new Error('Mongoose connection succeeded but the underlying MongoDB database is unavailable.');
    }

    db = mongoose.connection.db as unknown as Db;
    bucket = new GridFSBucket(db, { bucketName: 'productImages' });
    console.log('Database Connected Successfully');
    await ensureIndexes();
    await seedDefaults();
  }
}

async function ensureIndexes(): Promise<void> {
  const users = await getCollection<User>('users');
  await users.createIndex({ email: 1 }, { unique: true, background: true });

  const products = await getCollection<Product>('products');
  await products.createIndex({ slug: 1 }, { unique: true, background: true });
  await products.createIndex({ category: 1 }, { background: true });

  const orders = await getCollection<Order>('orders');
  await orders.createIndex({ orderId: 1 }, { unique: true, background: true });
  await orders.createIndex({ userId: 1 }, { background: true });

  const reviews = await getCollection<Review>('reviews');
  await reviews.createIndex({ productId: 1 }, { background: true });

  const coupons = await getCollection<Coupon>('coupons');
  await coupons.createIndex({ code: 1 }, { unique: true, background: true });

  const newsletters = await getCollection<Newsletter>('newsletters');
  await newsletters.createIndex({ email: 1 }, { unique: true, background: true });

  const contacts = await getCollection<Contact>('contacts');
  await contacts.createIndex({ email: 1 }, { background: true });
  await contacts.createIndex({ createdAt: 1 }, { background: true });
}

async function seedDefaults(): Promise<void> {
  const products = await getCollection<Product>('products');
  const users = await getCollection<User>('users');
  const coupons = await getCollection<Coupon>('coupons');

  const productCount = await products.countDocuments();
  if (productCount === 0) {
    await products.insertMany(generateProducts());
  }

  for (const user of DEFAULT_USERS) {
    await users.updateOne(
      { email: normalizeUserEmail(user.email) },
      { $setOnInsert: { ...user, email: normalizeUserEmail(user.email) } },
      { upsert: true }
    );
  }

  for (const coupon of DEFAULT_COUPONS) {
    await coupons.updateOne(
      { code: coupon.code.toUpperCase() },
      { $setOnInsert: coupon },
      { upsert: true }
    );
  }
}

export async function uploadProductImage(file: StoredFile): Promise<string> {
  const filename = `product_${Date.now()}_${Math.random().toString(36).slice(2, 10)}_${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
  const gridBucket = await getGridFsBucket();
  const uploadStream = gridBucket.openUploadStream(filename, {
    metadata: { originalName: file.originalname, contentType: file.mimetype }
  });
  uploadStream.end(file.buffer);
  await finished(uploadStream);
  return `/api/uploads/${encodeURIComponent(filename)}`;
}

export async function deleteGridFsFileByFilename(filename: string): Promise<void> {
  const gridBucket = await getGridFsBucket();
  const files = await gridBucket.find({ filename }).toArray();
  if (files.length === 0) {
    return;
  }
  await gridBucket.delete(files[0]._id);
}

export async function deleteGridFsFilesFromUrls(imageUrls: string[]): Promise<void> {
  const prefix = '/api/uploads/';
  const filenames = imageUrls
    .map((url) => (url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null))
    .filter((name): name is string => Boolean(name));

  await Promise.all(filenames.map((filename) => deleteGridFsFileByFilename(filename)));
}

export async function findProducts(params: {
  search?: string;
  category?: string;
  sizes?: string[];
  colors?: string[];
  brand?: string;
  inStockOnly?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; totalCount: number }> {
  const products = await getCollection<Product>('products');
  const query = buildProductQuery(params);
  const cursor = products.find(query);

  if (params.sort === 'price-low') {
    cursor.sort({ discountPrice: 1, price: 1 });
  } else if (params.sort === 'price-high') {
    cursor.sort({ discountPrice: -1, price: -1 });
  } else if (params.sort === 'popular') {
    cursor.sort({ rating: -1, reviewsCount: -1 });
  } else {
    cursor.sort({ id: -1 });
  }

  const allProducts = await cursor.toArray();
  const priceFiltered = applyPriceFilter(allProducts, params.minPrice, params.maxPrice);

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 12);
  const startIndex = (page - 1) * limit;
  const paginatedProducts = priceFiltered.slice(startIndex, startIndex + limit);

  return {
    products: paginatedProducts,
    totalCount: priceFiltered.length
  };
}

export async function findProductByIdOrSlug(identifier: string): Promise<Product | null> {
  const products = await getCollection<Product>('products');
  return products.findOne({ $or: [{ id: identifier }, { slug: identifier }] });
}

export async function createProduct(product: Product): Promise<Product> {
  const products = await getCollection<Product>('products');
  const normalized = { ...product, slug: sanitizeSlug(product.slug || product.name) };
  await products.insertOne(normalized);
  return normalized;
}

export async function updateProduct(product: Product): Promise<Product> {
  const products = await getCollection<Product>('products');
  const normalized = { ...product, slug: sanitizeSlug(product.slug || product.name) };
  await products.updateOne(
    { id: normalized.id },
    { $set: normalized },
    { upsert: true }
  );
  return normalized;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await getCollection<Product>('products');
  const result = await products.deleteOne({ id });
  return result.deletedCount === 1;
}

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  const reviews = await getCollection<Review>('reviews');
  return reviews.find({ productId }).sort({ createdAt: -1 }).toArray();
}

export async function createReview(review: Review): Promise<Review> {
  const reviews = await getCollection<Review>('reviews');
  await reviews.insertOne(review);
  return review;
}

export async function recalculateProductRating(productId: string): Promise<void> {
  const reviews = await getCollection<Review>('reviews');
  const products = await getCollection<Product>('products');
  const allReviews = await reviews.find({ productId }).toArray();
  const rating = allReviews.length
    ? parseFloat((allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length).toFixed(1))
    : 5.0;
  const reviewsCount = allReviews.length;
  await products.updateOne(
    { id: productId },
    { $set: { rating, reviewsCount } }
  );
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await getCollection<User>('users');
  return users.findOne({ email: normalizeUserEmail(email) });
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await getCollection<User>('users');
  return users.findOne({ id });
}

export async function createUser(user: User, password?: string): Promise<User> {
  const users = await getCollection<User>('users');
  const record = { ...user, email: normalizeUserEmail(user.email) } as User & { passwordHash?: string };
  if (password) {
    (record as any).passwordHash = hashPassword(password);
  }
  await users.insertOne(record as unknown as User);
  return record;
}

export async function updateUser(user: User): Promise<User> {
  const users = await getCollection<User>('users');
  const record = { ...user, email: normalizeUserEmail(user.email) };
  await users.updateOne({ id: user.id }, { $set: record });
  return record;
}

export async function validateUserPassword(email: string, password: string): Promise<User | null> {
  const users = await getCollection<User & { passwordHash?: string }>('users');
  const normalized = normalizeUserEmail(email);
  const user = await users.findOne({ email: normalized });
  if (!user) return null;
  if (!('passwordHash' in user)) {
    return user as User;
  }
  const hash = hashPassword(password);
  return user.passwordHash === hash ? (user as User) : null;
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  const coupons = await getCollection<Coupon>('coupons');
  return coupons.findOne({ code: code.toUpperCase(), isActive: true });
}

export async function createOrder(order: Order): Promise<Order> {
  const orders = await getCollection<Order>('orders');
  await orders.insertOne(order);
  return order;
}

export async function countOrders(): Promise<number> {
  const orders = await getCollection<Order>('orders');
  return orders.countDocuments();
}

export async function findOrders(filter: { userId?: string; email?: string }): Promise<Order[]> {
  const orders = await getCollection<Order>('orders');
  const query: Document = {};
  if (filter.userId) {
    query.userId = filter.userId;
  }
  if (filter.email) {
    query.$or = [
      { email: normalizeUserEmail(filter.email) },
      { 'shippingAddress.email': normalizeUserEmail(filter.email) }
    ];
  }
  return orders.find(query).sort({ createdAt: -1 }).toArray();
}

export async function findOrderById(orderId: string): Promise<Order | null> {
  const orders = await getCollection<Order>('orders');
  return orders.findOne({ $or: [{ orderId }, { id: orderId }] });
}

export async function updateOrder(order: Order): Promise<Order> {
  const orders = await getCollection<Order>('orders');
  await orders.updateOne({ orderId: order.orderId }, { $set: order });
  return order;
}

export async function addNewsletter(email: string): Promise<void> {
  const newsletter = await getCollection<Newsletter>('newsletters');
  await newsletter.updateOne(
    { email: normalizeUserEmail(email) },
    { $setOnInsert: { email: normalizeUserEmail(email), subscribedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function addContact(contact: Contact): Promise<InsertOneResult<Document>> {
  const contacts = await getCollection<Contact>('contacts');
  const result = await contacts.insertOne(contact);
  return result as InsertOneResult<Document>;
}

export async function getAnalytics(): Promise<{
  revenue: number;
  totalOrders: number;
  productsCount: number;
  customersCount: number;
  statuses: { pending: number; processing: number; shipped: number; completed: number };
  recentOrders: Order[];
}> {
  const orders = await getCollection<Order>('orders');
  const products = await getCollection<Product>('products');
  const users = await getCollection<User>('users');

  const allOrders = await orders.find().toArray();
  const revenue = allOrders
    .filter((order) => order.paymentStatus.toLowerCase() === 'paid' || order.paymentMethod === 'cod')
    .reduce((sum, order) => sum + order.total, 0);

  const pendingOrdersCount = allOrders.filter((order) => order.orderStatus.toLowerCase() === 'pending').length;
  const processingOrdersCount = allOrders.filter((order) => order.orderStatus.toLowerCase() === 'processing').length;
  const shippedOrdersCount = allOrders.filter((order) => ['shipped', 'out for delivery'].includes(order.orderStatus.toLowerCase())).length;
  const completedOrdersCount = allOrders.filter((order) => order.orderStatus.toLowerCase() === 'delivered').length;

  const recentOrders = allOrders.slice(-5).reverse();

  return {
    revenue: Math.round(revenue),
    totalOrders: allOrders.length,
    productsCount: await products.countDocuments(),
    customersCount: await users.countDocuments({ role: 'user' }),
    statuses: {
      pending: pendingOrdersCount,
      processing: processingOrdersCount,
      shipped: shippedOrdersCount,
      completed: completedOrdersCount
    },
    recentOrders
  };
}

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
    for (let i = 0; i < 10; i++) {
      const name = `${prefixes[cat as keyof typeof prefixes][i]} ${cat.slice(0, -1).toUpperCase()}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const basePrice = cat === 'shoes' ? 3999 : cat === 'shirts' ? 1899 : cat === 'pants' ? 2499 : cat === 'tshirts' ? 999 : 1299;
      const finalBasePrice = basePrice + (i * 200);
      const hasDiscount = i % 3 === 0;
      const discountPrice = hasDiscount ? Math.round(finalBasePrice * 0.8) : undefined;

      let sizes = ['S', 'M', 'L', 'XL', 'XXL'];
      if (isProductShoes) {
        sizes = ['7', '8', '9', '10', '11'];
      } else if (isProductAcc) {
        sizes = ['O/S'];
      }

      const catImages = UN_IMAGES[cat as keyof typeof UN_IMAGES];
      const image1 = catImages[i % catImages.length];
      const image2 = catImages[(i + 1) % catImages.length];
      const image3 = catImages[(i + 2) % catImages.length];

      const ratings = parseFloat((4.0 + (i % 10) * 0.1).toFixed(1));
      const reviews = 12 + (i * 7);

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
        inStock: i % 8 !== 0,
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
