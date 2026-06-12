import 'dotenv/config';
import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  StoredFile,
  connectDatabase,
  getGridFsBucket,
  findProducts,
  findProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getReviewsByProductId,
  createReview,
  recalculateProductRating,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  validateUserPassword,
  findCouponByCode,
  createOrder,
  countOrders,
  findOrders,
  findOrderById,
  updateOrder,
  addNewsletter,
  addContact,
  getAnalytics,
  uploadProductImage,
  deleteGridFsFilesFromUrls
} from './server/db';
import { Product, User, Order, Address, Contact, Review } from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPG, JPEG, PNG, and WEBP are allowed.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return (value as unknown) as T;
    }
  }

  return value as T;
}

function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string');
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

function buildProductPayload(data: any, existing?: Product): Product {
  const existingProduct = existing ?? ({
    id: `prod_${Date.now()}`,
    name: '',
    slug: '',
    category: 'shirts',
    brand: 'StreetVibe',
    price: 0,
    description: '',
    images: [],
    sizes: ['M', 'L', 'XL'],
    colors: [{ name: 'Charcoal Black', hex: '#061114' }],
    inStock: true,
    stockCount: 50,
    rating: 5,
    reviewsCount: 0,
    fabricDetails: '',
    shippingInfo: '',
    returnsInfo: '',
    isNewArrival: false,
    isBestSeller: false,
    isTrending: false
  }) as Product;

  return {
    ...existingProduct,
    id: existingProduct.id,
    name: typeof data.name === 'string' ? data.name : existingProduct.name,
    slug: typeof data.slug === 'string' ? data.slug : existingProduct.slug || (typeof data.name === 'string' ? data.name : existingProduct.name),
    category: typeof data.category === 'string' ? data.category.toLowerCase() : existingProduct.category,
    brand: typeof data.brand === 'string' ? data.brand : existingProduct.brand,
    price: data.price !== undefined ? parseFloat(data.price) : existingProduct.price,
    discountPrice: data.discountPrice !== undefined && data.discountPrice !== '' ? parseFloat(data.discountPrice) : existingProduct.discountPrice,
    description: typeof data.description === 'string' ? data.description : existingProduct.description,
    images: Array.isArray(data.images) ? data.images : existingProduct.images,
    sizes: ensureArray(data.sizes ?? existingProduct.sizes),
    colors: parseJsonField(data.colors, existingProduct.colors),
    inStock: parseBoolean(data.inStock !== undefined ? data.inStock : existingProduct.inStock),
    stockCount: data.stockCount !== undefined ? parseInt(data.stockCount, 10) : existingProduct.stockCount,
    fabricDetails: typeof data.fabricDetails === 'string' ? data.fabricDetails : existingProduct.fabricDetails,
    shippingInfo: typeof data.shippingInfo === 'string' ? data.shippingInfo : existingProduct.shippingInfo,
    returnsInfo: typeof data.returnsInfo === 'string' ? data.returnsInfo : existingProduct.returnsInfo,
    isNewArrival: parseBoolean(data.isNewArrival !== undefined ? data.isNewArrival : existingProduct.isNewArrival),
    isBestSeller: parseBoolean(data.isBestSeller !== undefined ? data.isBestSeller : existingProduct.isBestSeller),
    isTrending: parseBoolean(data.isTrending !== undefined ? data.isTrending : existingProduct.isTrending),
    rating: existingProduct.rating,
    reviewsCount: existingProduct.reviewsCount
  };
}

function createResponseError(res: express.Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

async function uploadFiles(files: Express.Multer.File[] | undefined): Promise<string[]> {
  if (!files || !files.length) {
    return [];
  }

  const uploaded = [] as string[];
  for (const file of files) {
    const filePayload: StoredFile = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype
    };
    const url = await uploadProductImage(filePayload);
    uploaded.push(url);
  }
  return uploaded;
}

async function handleApp() {
  await connectDatabase();

  app.use(express.json());

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.get('/api/categories', (_req, res) => {
    res.json(['shirts', 'pants', 'tshirts', 'shoes', 'accessories']);
  });

  app.get('/api/products', async (req, res) => {
    try {
      const search = req.query.search as string;
      const category = req.query.category as string;
      const sizes = ensureArray(req.query.sizes);
      const colors = ensureArray(req.query.colors);
      const minPrice = parseFloat(req.query.minPrice as string);
      const maxPrice = parseFloat(req.query.maxPrice as string);
      const brand = req.query.brand as string;
      const inStockOnly = req.query.inStock === 'true';
      const sort = req.query.sort as string;
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '12', 10);
      const isNewArrival = req.query.isNewArrival === 'true';
      const isBestSeller = req.query.isBestSeller === 'true';
      const isTrending = req.query.isTrending === 'true';

      const result = await findProducts({
        search,
        category,
        sizes,
        colors,
        brand,
        inStockOnly,
        sort,
        page,
        limit,
        minPrice: Number.isNaN(minPrice) ? undefined : minPrice,
        maxPrice: Number.isNaN(maxPrice) ? undefined : maxPrice,
        isNewArrival,
        isBestSeller,
        isTrending
      });

      res.json({
        products: result.products,
        totalCount: result.totalCount,
        page,
        totalPages: Math.ceil(result.totalCount / limit)
      });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await findProductByIdOrSlug(req.params.id);
      if (!product) {
        return createResponseError(res, 404, 'Product not found');
      }
      const reviews = await getReviewsByProductId(product.id);
      res.json({ ...product, reviews });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.post('/api/products/:id/review', async (req, res) => {
    try {
      const product = await findProductByIdOrSlug(req.params.id);
      if (!product) {
        return createResponseError(res, 404, 'Product not found');
      }

      const { rating, comment, userName } = req.body;
      const parsedRating = Math.min(5, Math.max(1, parseFloat(rating) || 5));
      const newReview: Review = {
        id: `rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        productId: product.id,
        userName: typeof userName === 'string' ? userName : 'Anonymous customer',
        rating: parsedRating,
        comment: typeof comment === 'string' ? comment : '',
        createdAt: new Date().toISOString()
      };

      await createReview(newReview);
      await recalculateProductRating(product.id);
      res.status(201).json({ review: newReview });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.post('/api/products', upload.array('images', 10), async (req, res) => {
    try {
      const data = req.body;
      if (!data.name || !data.category || !data.price) {
        return createResponseError(res, 400, 'Missing product attributes (name, category, price)');
      }

      const uploadedImages = await uploadFiles(req.files as Express.Multer.File[]);
      let providedImages = parseJsonField<string[]>(data.images, []);
      providedImages = Array.isArray(providedImages) ? providedImages : [providedImages].filter(Boolean);
      const images = uploadedImages.length > 0 ? uploadedImages : providedImages;
      const finalImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80'];

      const newProduct: Product = buildProductPayload({
        ...data,
        images: finalImages
      });

      const createdProduct = await createProduct(newProduct);
      res.status(201).json({ product: createdProduct });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.put('/api/products/:id', upload.array('images', 10), async (req, res) => {
    try {
      const existing = await findProductByIdOrSlug(req.params.id);
      if (!existing) {
        return createResponseError(res, 404, 'Product not found');
      }

      const keptImages = parseJsonField<string[]>(req.body.images, existing.images);
      const uploadUrls = await uploadFiles(req.files as Express.Multer.File[]);
      const updatedImages = [...new Set([...(Array.isArray(keptImages) ? keptImages : [keptImages]), ...uploadUrls])];

      const removedImages = existing.images.filter(
        (image) => image.startsWith('/api/uploads/') && !updatedImages.includes(image)
      );
      if (removedImages.length) {
        await deleteGridFsFilesFromUrls(removedImages);
      }

      const updatedProduct = buildProductPayload({
        ...req.body,
        images: updatedImages
      }, existing);

      const product = await updateProduct(updatedProduct);
      res.json({ product });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const product = await findProductByIdOrSlug(req.params.id);
      if (!product) {
        return createResponseError(res, 404, 'Product not found to delete');
      }
      const removed = await deleteProduct(product.id);
      if (!removed) {
        return createResponseError(res, 500, 'Failed to remove product');
      }
      await deleteGridFsFilesFromUrls(product.images);
      res.json({ success: true, message: 'Product deleted' });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      if (!email || !password || !firstName) {
        return createResponseError(res, 400, 'Missing required credentials');
      }

      const existing = await findUserByEmail(email);
      if (existing) {
        return createResponseError(res, 400, 'Emails are already in use');
      }

      const newUser: User = {
        id: `usr_${Date.now()}`,
        email,
        firstName,
        lastName: lastName || '',
        phone: phone || '',
        role: 'user',
        addresses: []
      };

      await createUser(newUser, password);
      res.status(201).json({ user: newUser, token: `mock_jwt_token_${newUser.id}` });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return createResponseError(res, 400, 'Credentials cannot be blank');
      }

      const user = await validateUserPassword(email, password);
      if (!user) {
        return createResponseError(res, 400, 'User does not exist with that email or invalid password');
      }

      res.json({ user, token: `mock_jwt_token_${user.id}` });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.put('/api/auth/profile', async (req, res) => {
    try {
      const { userId, firstName, lastName, phone, addresses } = req.body;
      if (!userId) {
        return createResponseError(res, 400, 'Missing userId');
      }

      const user = await findUserById(userId);
      if (!user) {
        return createResponseError(res, 404, 'User authentication session expired');
      }

      const updatedUser: User = {
        ...user,
        firstName: firstName ?? user.firstName,
        lastName: lastName ?? user.lastName,
        phone: phone ?? user.phone,
        addresses: Array.isArray(addresses) ? addresses : user.addresses
      };

      await updateUser(updatedUser);
      res.json(updatedUser);
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.post('/api/coupons/validate', async (req, res) => {
    try {
      const { code, amount, subtotal } = req.body;
      const finalAmount = amount !== undefined ? amount : subtotal;
      if (!code) {
        return createResponseError(res, 400, 'Coupon code is blank');
      }
      const coupon = await findCouponByCode(code);
      if (!coupon) {
        return createResponseError(res, 400, 'Invalid or deactivated coupon code');
      }
      if (finalAmount !== undefined && finalAmount < coupon.minAmount) {
        return createResponseError(res, 400, `At least ₹${coupon.minAmount} is required for this offer`);
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
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const body = req.body;
      const userId = body.userId || null;
      const items = body.items || body.products || [];
      const amount = body.amount !== undefined ? parseFloat(body.amount) : parseFloat(body.total || '0');
      const shippingFee = body.shippingFee !== undefined ? parseFloat(body.shippingFee) : parseFloat(body.shipping || '0');
      const discountAmount = body.discountAmount !== undefined ? parseFloat(body.discountAmount) : parseFloat(body.discount || '0');
      const shippingAddress = body.shippingAddress || null;
      const couponCode = body.couponCode || null;
      const paymentMethod = body.paymentMethod || 'cod';
      const paymentDetails = body.paymentDetails || {};
      const notes = body.notes || '';
      const customerName = body.customerName || (shippingAddress ? `${shippingAddress.firstName} ${shippingAddress.lastName || ''}`.trim() : 'Anonymous Customer');
      const email = body.email || (shippingAddress ? shippingAddress.email : '');
      const phone = body.phone || (shippingAddress ? shippingAddress.phone : '');
      const addressString = body.address || (shippingAddress ? shippingAddress.address : '');

      if (!items.length) {
        return createResponseError(res, 400, 'Order must contain at least one item.');
      }
      if (!shippingAddress && !addressString) {
        return createResponseError(res, 400, 'Order requires a shipping address.');
      }

      const currentCount = await countOrders();
      const currentYear = new Date().getFullYear();
      const indexStr = String(currentCount + 1).padStart(4, '0');
      const orderId = `SV${currentYear}${indexStr}`;

      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 4);

      const mappedItems = (items as any[]).map((it) => ({
        productId: it.productId,
        name: it.name || it.productName,
        quantity: it.quantity,
        price: it.price,
        size: it.size,
        color: it.color,
        image: it.image
      }));

      const products = (items as any[]).map((it) => ({
        productId: it.productId,
        productName: it.name || it.productName,
        image: it.image,
        size: it.size,
        color: it.color,
        quantity: it.quantity,
        price: it.price,
        totalPrice: it.price * it.quantity
      }));

      const newOrder: Order = {
        id: orderId,
        orderId,
        userId,
        customerName,
        email,
        phone,
        address: addressString,
        shippingAddress: shippingAddress || {
          firstName: customerName.split(' ')[0] || 'Customer',
          lastName: customerName.split(' ').slice(1).join(' ') || '',
          email,
          phone,
          address: addressString,
          pinCode: ''
        } as any,
        items: mappedItems,
        products,
        subtotal: amount - shippingFee + discountAmount,
        discount: discountAmount,
        shipping: shippingFee,
        tax: 0,
        total: amount,
        amount,
        couponCode,
        paymentMethod,
        paymentStatus: body.paymentStatus || (paymentMethod === 'cod' ? 'Pending' : 'Paid'),
        transactionId: body.transactionId || `txn_${Math.random().toString(36).substring(2, 11)}`,
        status: 'pending',
        orderStatus: 'Pending',
        trackingNumber: `TRK${Math.floor(10000000 + Math.random() * 90000000)}`,
        estimatedDelivery: estimatedDelivery.toISOString(),
        notes,
        createdAt: new Date().toISOString()
      };

      const productUpdatePromises = mappedItems.map(async (orderProd) => {
        const prod = await findProductByIdOrSlug(orderProd.productId);
        if (prod) {
          prod.stockCount = Math.max(0, prod.stockCount - orderProd.quantity);
          prod.inStock = prod.stockCount > 0;
          await updateProduct(prod);
        }
      });

      await Promise.all(productUpdatePromises);
      await createOrder(newOrder);
      res.status(201).json({ order: newOrder });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.get('/api/orders', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const email = req.query.email as string;
      const orders = await findOrders({ userId, email });
      res.json(orders);
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.get('/api/orders/:orderId', async (req, res) => {
    try {
      const order = await findOrderById(req.params.orderId);
      if (!order) {
        return createResponseError(res, 404, 'Order not found');
      }
      res.json(order);
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.put('/api/orders/:orderId/status', async (req, res) => {
    try {
      const order = await findOrderById(req.params.orderId);
      if (!order) {
        return createResponseError(res, 404, 'Order not found');
      }
      const { orderStatus, status, paymentStatus, trackingNumber } = req.body;
      const nextStatus = orderStatus || status;
      if (nextStatus) {
        order.status = nextStatus.toLowerCase();
        order.orderStatus = nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1);
      }
      if (paymentStatus) order.paymentStatus = paymentStatus;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      await updateOrder(order);
      res.json(order);
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.post('/api/newsletter', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return createResponseError(res, 400, 'Email cannot be blank');
      }
      await addNewsletter(email);
      res.json({ success: true, message: 'Welcome to StreetVibe inside circle! 10% coupon welcome bonus incoming.' });
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, message } = req.body;
      console.log('[contact] incoming payload:', { name, email, message });
      if (!name || !email || !message) {
        console.warn('[contact] validation failed:', { name, email, message });
        return createResponseError(res, 400, 'All attributes required: name, email, message');
      }

      const createdAt = new Date().toISOString();
      try {
        console.log('[contact] attempting to insert into database...');
        const insertResult = await addContact({ name, email, message, createdAt });
        console.log('[contact] stored in DB:', { email, createdAt, insertedId: insertResult.insertedId });
        res.json({ success: true, message: 'Message recorded. Support team response in under 12 hours.', insertedId: insertResult.insertedId });
      } catch (dbError: any) {
        console.error('[contact] database error:', dbError && dbError.stack ? dbError.stack : dbError);
        console.error('[contact] error details:', {
          code: dbError?.code,
          name: dbError?.name,
          message: dbError?.message
        });
        return createResponseError(res, 500, `Database error: ${dbError?.message || 'Unknown error while saving contact'}`);
      }
    } catch (error: any) {
      console.error('[contact] handler error:', error && error.stack ? error.stack : error);
      return createResponseError(res, 500, error.message || 'Unknown server error');
    }
  });

  app.get('/api/admin/analytics', async (_req, res) => {
    try {
      const analytics = await getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  app.get('/api/uploads/:filename', async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      const bucket = await getGridFsBucket();
      const files = await bucket.find({ filename }).toArray();
      if (!files.length) {
        return createResponseError(res, 404, 'Image not found');
      }
      const file = files[0];
      const contentType = (file.metadata && (file.metadata as any).contentType) || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      const downloadStream = bucket.openDownloadStreamByName(filename);
      downloadStream.on('error', () => {
        createResponseError(res, 404, 'Image not found');
      });
      downloadStream.pipe(res);
    } catch (error: any) {
      return createResponseError(res, 500, error.message);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StreetVibe Server] Running on http://0.0.0.0:${PORT}`);
  });
}

handleApp().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
