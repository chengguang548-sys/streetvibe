import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbStore } from './server/db';
import { Product, User, Order, Address, Contact, Review } from './src/types';
import multer from 'multer';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up uploads directory for local products images
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Multer storage engine configuration with unique timestamps
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e6);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `product_${uniqueSuffix}${ext}`);
    }
  });

  // Limit to safe image formats
  const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPG, JPEG, PNG, and WEBP are allowed.'), false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB individual limit
  });

  app.use(express.json());

  // Serve uploaded products statically BEFORE dev/fallback pathways
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Allow cors during dev optionally, but they share port 3000 so same origin is guaranteed!
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==========================================
  // PRODUCTS API
  // ==========================================

  // Get all categories dynamically
  app.get('/api/categories', (req, res) => {
    res.json(['shirts', 'pants', 'tshirts', 'shoes', 'accessories']);
  });

  // List & search & filter products
  app.get('/api/products', (req, res) => {
    try {
      let products = dbStore.getProducts();

      // Filter by Search Match
      const search = req.query.search as string;
      if (search) {
        const query = search.toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
      }

      // Filter by Category
      const category = req.query.category as string;
      if (category && category !== 'all') {
        products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }

      // Filter by Size (split by comma if multiple)
      const sizeStr = req.query.sizes as string;
      if (sizeStr) {
        const sizes = sizeStr.split(',');
        products = products.filter((p) => p.sizes.some((s) => sizes.includes(s)));
      }

      // Filter by Color (split by comma if multiple)
      const colorStr = req.query.colors as string;
      if (colorStr) {
        const colors = colorStr.split(',').map(c => c.toLowerCase());
        products = products.filter((p) => p.colors.some((col) => colors.includes(col.name.toLowerCase())));
      }

      // Filter by Price range
      const minPrice = parseFloat(req.query.minPrice as string);
      const maxPrice = parseFloat(req.query.maxPrice as string);
      if (!isNaN(minPrice)) {
        products = products.filter((p) => (p.discountPrice || p.price) >= minPrice);
      }
      if (!isNaN(maxPrice)) {
        products = products.filter((p) => (p.discountPrice || p.price) <= maxPrice);
      }

      // Filter by Brand
      const brand = req.query.brand as string;
      if (brand) {
        products = products.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
      }

      // Filter by Availability
      const inStockOnly = req.query.inStock === 'true';
      if (inStockOnly) {
        products = products.filter((p) => p.inStock && p.stockCount > 0);
      }

      // Sorting
      const sortBy = req.query.sort as string;
      // Latest, Popular, Price Low To High, Price High To Low
      if (sortBy === 'price-low') {
        products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
      } else if (sortBy === 'price-high') {
        products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
      } else if (sortBy === 'popular') {
        products.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
      } else {
        // Latest / default sorting of ids descending
        products.sort((a, b) => b.id.localeCompare(a.id));
      }

      // Pagination
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.max(1, parseInt(req.query.limit as string || '12'));
      const startIndex = (page - 1) * limit;
      const totalProducts = products.length;
      const paginatedProducts = products.slice(startIndex, startIndex + limit);

      res.json({
        products: paginatedProducts,
        totalCount: totalProducts,
        page,
        totalPages: Math.ceil(totalProducts / limit)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get singular product details
  app.get('/api/products/:id', (req, res) => {
    const product = dbStore.getProducts().find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Pull active reviews for this product
    const reviews = dbStore.getReviews().filter((r) => r.productId === product.id);
    res.json({ ...product, reviews });
  });

  // Add Product Review
  app.post('/api/products/:id/review', (req, res) => {
    const { rating, comment, userName } = req.body;
    const prodId = req.params.id;
    const product = dbStore.getProducts().find((p) => p.id === prodId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newReview: Review = {
      id: `rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      userName: userName || 'Anonymous customer',
      rating: parseFloat(rating) || 5,
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    dbStore.addReview(newReview);

    // Recalculate product rating/reviewsCount
    const allProductReviews = dbStore.getReviews().filter((r) => r.productId === product.id);
    const avgRating = allProductReviews.reduce((sum, item) => sum + item.rating, 0) / allProductReviews.length;
    product.rating = parseFloat(avgRating.toFixed(1));
    product.reviewsCount = allProductReviews.length;
    dbStore.updateProduct(product);

    res.status(201).json({ review: newReview, updatedRating: product.rating, reviewsCount: product.reviewsCount });
  });

  // Create Product (Admin Panel only) with Multer upload capability
  app.post('/api/products', upload.array('images', 10), (req, res) => {
    try {
      const data = req.body;
      if (!data.name || !data.category || !data.price) {
        return res.status(400).json({ error: 'Missing product attributes (name, category, price)' });
      }

      const newId = `prod_${Date.now()}`;
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Resolve images from file uploads or fallback
      let imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        imageUrls = (req.files as Express.Multer.File[]).map(
          (file) => `/uploads/products/${file.filename}`
        );
      }
      
      if (imageUrls.length === 0) {
        if (data.images) {
          try {
            imageUrls = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
          } catch (e) {
            imageUrls = Array.isArray(data.images) ? data.images : [data.images];
          }
        }
      }

      if (imageUrls.length === 0) {
        imageUrls = ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80'];
      }

      // Handle arrays & JSON-encoded properties gracefully when received from FormData
      let sizes = ['M', 'L', 'XL'];
      if (data.sizes !== undefined) {
        try {
          sizes = typeof data.sizes === 'string' ? JSON.parse(data.sizes) : data.sizes;
        } catch (e) {
          sizes = typeof data.sizes === 'string' ? data.sizes.split(',') : data.sizes;
        }
      }

      let colors = [{ name: 'Charcoal Black', hex: '#061114' }];
      if (data.colors !== undefined) {
        try {
          colors = typeof data.colors === 'string' ? JSON.parse(data.colors) : data.colors;
        } catch (e) {
          // Keep default
        }
      }

      const inStock = data.inStock !== undefined 
        ? (data.inStock === 'true' || data.inStock === true) 
        : true;

      const stockCount = data.stockCount !== undefined 
        ? parseInt(data.stockCount) 
        : 50;

      const isNewArrival = data.isNewArrival === 'true' || data.isNewArrival === true;
      const isBestSeller = data.isBestSeller === 'true' || data.isBestSeller === true;
      const isTrending = data.isTrending === 'true' || data.isTrending === true;

      const newProduct: Product = {
        id: newId,
        name: data.name,
        slug,
        category: data.category.toLowerCase(),
        brand: data.brand || 'StreetVibe',
        price: parseFloat(data.price),
        discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : undefined,
        description: data.description || '',
        images: imageUrls,
        sizes,
        colors,
        inStock,
        stockCount,
        rating: 5.0,
        reviewsCount: 0,
        fabricDetails: data.fabricDetails || 'Premium composite fiber weave.',
        shippingInfo: 'Standard 48-hour fulfillment window.',
        returnsInfo: 'Eligible for 14-day hassle-free reverse trade returns.',
        isNewArrival,
        isBestSeller,
        isTrending
      };

      dbStore.updateProduct(newProduct);

      // Return both flat object and product property for maximum backwards compatibility
      res.status(201).json({
        ...newProduct,
        product: newProduct
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Edit Product (Admin Panel only) with Multer upload capability
  app.put('/api/products/:id', upload.array('images', 10), (req, res) => {
    try {
      const prodId = req.params.id;
      const existing = dbStore.getProducts().find((p) => p.id === prodId);
      if (!existing) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const data = req.body;

      // Handle new file uploads
      let uploadedUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        uploadedUrls = (req.files as Express.Multer.File[]).map(
          (file) => `/uploads/products/${file.filename}`
        );
      }

      // Handle keeping existing images parsed from client body
      let keepImages: string[] = [];
      if (data.images !== undefined) {
        try {
          keepImages = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
        } catch (e) {
          keepImages = Array.isArray(data.images) ? data.images : [data.images];
        }
      } else {
        keepImages = existing.images || [];
      }

      // Merge kept images and newly uploaded images
      const finalImages = [...keepImages, ...uploadedUrls];
      const fallbackImages = finalImages.length > 0 
        ? finalImages 
        : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80'];

      // Parse arrays and types from multi-part bodies
      let sizes = existing.sizes;
      if (data.sizes !== undefined) {
        try {
          sizes = typeof data.sizes === 'string' ? JSON.parse(data.sizes) : data.sizes;
        } catch (e) {
          sizes = typeof data.sizes === 'string' ? data.sizes.split(',') : data.sizes;
        }
      }

      let colors = existing.colors;
      if (data.colors !== undefined) {
        try {
          colors = typeof data.colors === 'string' ? JSON.parse(data.colors) : data.colors;
        } catch (e) {
          // Keep existing
        }
      }

      const inStock = data.inStock !== undefined 
        ? (data.inStock === 'true' || data.inStock === true) 
        : existing.inStock;

      const stockCount = data.stockCount !== undefined 
        ? parseInt(data.stockCount) 
        : existing.stockCount;

      const isNewArrival = data.isNewArrival !== undefined 
        ? (data.isNewArrival === 'true' || data.isNewArrival === true) 
        : existing.isNewArrival;

      const isBestSeller = data.isBestSeller !== undefined 
        ? (data.isBestSeller === 'true' || data.isBestSeller === true) 
        : existing.isBestSeller;

      const isTrending = data.isTrending !== undefined 
        ? (data.isTrending === 'true' || data.isTrending === true) 
        : existing.isTrending;

      const updated: Product = {
        ...existing,
        name: data.name || existing.name,
        price: data.price ? parseFloat(data.price) : existing.price,
        discountPrice: data.hasOwnProperty('discountPrice') ? (data.discountPrice ? parseFloat(data.discountPrice) : undefined) : existing.discountPrice,
        category: data.category || existing.category,
        brand: data.brand || existing.brand,
        description: data.description || existing.description,
        inStock,
        stockCount,
        images: fallbackImages,
        sizes,
        colors,
        fabricDetails: data.fabricDetails || existing.fabricDetails,
        isNewArrival,
        isBestSeller,
        isTrending
      };

      dbStore.updateProduct(updated);
      res.json({
        ...updated,
        product: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete Product
  app.delete('/api/products/:id', (req, res) => {
    const success = dbStore.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found to delete' });
    }
    res.json({ success: true, message: 'Product deleted' });
  });

  // ==========================================
  // AUTH API
  // ==========================================

  // Simple Register
  app.post('/api/auth/register', (req, res) => {
    const { email, password, firstName, lastName, phone } = req.body;
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Missing required credentials' });
    }

    const existing = dbStore.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Emails are already in use' });
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email,
      firstName,
      lastName: lastName || '',
      phone: phone || '',
      role: 'user', // Default role
      addresses: []
    };

    dbStore.addUser(newUser);
    res.status(201).json({ user: newUser, token: `mock_jwt_token_${newUser.id}` });
  });

  // Simple Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Credentials cannot be blank' });
    }

    const user = dbStore.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'User does not exist with that email' });
    }

    // In a fully-production environment, verify bcrypt hash. Here, accept standard validation.
    res.json({ user, token: `mock_jwt_token_${user.id}` });
  });

  // Update Profile & Addresses
  app.put('/api/auth/profile', (req, res) => {
    const { userId, firstName, lastName, phone, addresses } = req.body;
    const user = dbStore.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User authentication session expired' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;

    dbStore.updateUser(user);
    res.json(user);
  });

  // ==========================================
  // COUPONS API
  // ==========================================
  app.post('/api/coupons/validate', (req, res) => {
    const { code, amount, subtotal } = req.body;
    const finalAmount = amount !== undefined ? amount : subtotal;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is blank' });
    }

    const coupon = dbStore.getCoupons().find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) {
      return res.status(400).json({ error: 'Invalid or deactivated coupon code' });
    }

    if (finalAmount !== undefined && finalAmount < coupon.minAmount) {
      return res.status(400).json({ error: `At least ₹${coupon.minAmount} is required for this offer` });
    }

    res.json({
      valid: true,
      discountPercent: coupon.discountPercent,
      code: coupon.code,
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        minAmount: coupon.minAmount,
        isActive: coupon.isActive,
        discountType: 'percent',
        discountValue: coupon.discountPercent
      }
    });
  });

  // ==========================================
  // ORDERS API
  // ==========================================

  // Create Order with formatting SV2026xxxx compatible with both frontend client formats
  app.post('/api/orders', (req, res) => {
    try {
      const body = req.body;

      // Unify params from either traditional payloads or checkout.tsx direct payload
      const userId = body.userId || null;
      const items = body.items || body.products || [];
      const amount = body.amount !== undefined ? parseFloat(body.amount) : parseFloat(body.total || '0');
      const shippingAddress = body.shippingAddress || null;
      const couponCode = body.couponCode || null;
      const discountAmount = body.discountAmount !== undefined ? parseFloat(body.discountAmount) : parseFloat(body.discount || '0');
      const shippingFee = body.shippingFee !== undefined ? parseFloat(body.shippingFee) : parseFloat(body.shipping || '0');
      const paymentMethod = body.paymentMethod || 'cod';
      const paymentDetails = body.paymentDetails || {};
      const notes = body.notes || '';

      const customerName = body.customerName || (shippingAddress ? `${shippingAddress.firstName} ${shippingAddress.lastName || ''}`.trim() : 'Anonymous Customer');
      const email = body.email || (shippingAddress ? shippingAddress.email : '');
      const phone = body.phone || (shippingAddress ? shippingAddress.phone : '');
      const addressString = body.address || (shippingAddress ? shippingAddress.address : '');

      if (items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item.' });
      }

      if (!shippingAddress && !addressString) {
        return res.status(400).json({ error: 'Order requires a shipping address.' });
      }

      // Generate Incremental Order ID matching SV2026xxxx
      const existingOrders = dbStore.getOrders();
      const currentYear = 2026; // Keeping references grounded to active 2026 time context
      const currentCount = existingOrders.length;
      const indexStr = String(currentCount + 1).padStart(4, '0');
      const orderId = `SV${currentYear}${indexStr}`;

      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 4);

      // Construct a unified order record mapping to both frontend and model keys
      const newOrder: any = {
        id: orderId,
        orderId: orderId,
        userId,
        customerName,
        email,
        phone,
        address: addressString,
        shippingAddress: shippingAddress || {
          firstName: customerName.split(' ')[0] || 'Customer',
          lastName: customerName.split(' ').slice(1).join(' ') || '',
          email: email,
          phone: phone,
          address: addressString,
          pinCode: ''
        },
        items: items.map((it: any) => ({
          productId: it.productId,
          name: it.name || it.productName,
          quantity: it.quantity,
          price: it.price,
          size: it.size,
          color: it.color,
          image: it.image
        })),
        products: items.map((it: any) => ({
          productId: it.productId,
          productName: it.name || it.productName,
          image: it.image,
          size: it.size,
          color: it.color,
          quantity: it.quantity,
          price: it.price,
          totalPrice: it.price * it.quantity
        })),
        subtotal: amount - shippingFee + discountAmount,
        discount: discountAmount,
        shipping: shippingFee,
        tax: 0,
        total: amount,
        amount: amount,
        couponCode,
        paymentMethod,
        paymentStatus: body.paymentStatus || (paymentMethod === 'cod' ? 'Pending' : 'Paid'),
        paymentDetails,
        transactionId: body.transactionId || `txn_${Math.random().toString(36).substring(2, 11)}`,
        status: 'pending',
        orderStatus: 'Pending',
        trackingNumber: `TRK${Math.floor(10000000 + Math.random() * 90000000)}`,
        estimatedDelivery: estimatedDelivery.toISOString(),
        notes: notes,
        createdAt: new Date().toISOString()
      };

      // Subtract inventories from products
      items.forEach((orderProd: any) => {
        const prod = dbStore.getProducts().find((p) => p.id === orderProd.productId);
        if (prod) {
          prod.stockCount = Math.max(0, prod.stockCount - orderProd.quantity);
          if (prod.stockCount === 0) {
            prod.inStock = false;
          }
          dbStore.updateProduct(prod);
        }
      });

      dbStore.addOrder(newOrder);

      // Return both encapsulated structure for Checkout.tsx success receiver, and flat order model
      res.status(201).json({
        ...newOrder,
        order: newOrder
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get orders list (Filter for specific user if desired)
  app.get('/api/orders', (req, res) => {
    const userId = req.query.userId as string;
    const email = req.query.email as string;
    let orders = dbStore.getOrders();

    if (userId) {
      orders = orders.filter((o) => o.userId === userId);
    } else if (email) {
      orders = orders.filter((o) => 
        (o.email && o.email.toLowerCase() === email.toLowerCase()) ||
        (o.shippingAddress && o.shippingAddress.email && o.shippingAddress.email.toLowerCase() === email.toLowerCase())
      );
    }

    // Sort newer orders first
    orders.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    res.json(orders);
  });

  // Get specific order details
  app.get('/api/orders/:orderId', (req, res) => {
    const order = dbStore.getOrders().find(o => o.orderId === req.params.orderId || o.id === req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  // Edit Order Status (Admin option)
  app.put('/api/orders/:orderId/status', (req, res) => {
    const order = dbStore.getOrders().find(o => o.orderId === req.params.orderId || o.id === req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { orderStatus, status, paymentStatus, trackingNumber } = req.body;
    const nextStatus = orderStatus || status;
    if (nextStatus) {
      order.status = nextStatus.toLowerCase();
      order.orderStatus = nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1);
    }
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    dbStore.updateOrder(order);
    res.json(order);
  });

  // ==========================================
  // NEWSLETTER & CONTACTS
  // ==========================================
  app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email cannot be black' });
    }
    dbStore.addNewsletter(email);
    res.json({ success: true, message: 'Welcome to StreetVibe inside circle! 10% coupon welcome bonus incoming.' });
  });

  app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All attributes required: name, email, message' });
    }
    const contact: Contact = { name, email, message, createdAt: new Date().toISOString() };
    dbStore.addContact(contact);
    res.json({ success: true, message: 'Message recorded. Support team response in under 12 hours.' });
  });

  // ==========================================
  // ANALYTICS (Admin dashboard overview)
  // ==========================================
  app.get('/api/admin/analytics', (req, res) => {
    const orders = dbStore.getOrders();
    const products = dbStore.getProducts();
    const users = dbStore.getUsers();

    const totalRevenue = orders
      .filter((o) => o.paymentStatus.toLowerCase() === 'paid' || o.paymentMethod === 'cod')
      .reduce((sum, item) => sum + item.total, 0);

    const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'Pending').length;
    const processingOrdersCount = orders.filter((o) => o.orderStatus === 'Processing').length;
    const shippedOrdersCount = orders.filter((o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Out For Delivery').length;
    const completedOrdersCount = orders.filter((o) => o.orderStatus === 'Delivered').length;

    // Get order growth by days setup
    res.json({
      revenue: Math.round(totalRevenue),
      totalOrders: orders.length,
      productsCount: products.length,
      customersCount: users.filter(u => u.role === 'user').length,
      statuses: {
        pending: pendingOrdersCount,
        processing: processingOrdersCount,
        shipped: shippedOrdersCount,
        completed: completedOrdersCount
      },
      recentOrders: orders.slice(-5).reverse()
    });
  });

  // ==========================================
  // VITE DEV SERVER OR STATIC SERVING MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StreetVibe Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
