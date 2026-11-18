const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const ALLOWED_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier'];
const SORTABLE_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier', 'createdAt', 'updatedAt'];

const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toNumber = (value, name) => {
  const n = Number(value);
  if (Number.isNaN(n)) throw new AppError(`${name} must be a number`, 400);
  return n;
};

// ---------- CREATE ----------
// POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pick(req.body, ALLOWED_FIELDS));
  res.status(201).json(product);
});

// ---------- READ (list) ----------
// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&inStock=&sort=&page=&limit=
exports.getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, inStock } = req.query;
  const filter = {};

  // Filtering
  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  if (supplier) filter.supplier = new RegExp(escapeRegex(supplier), 'i');
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { sku: rx }];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = toNumber(minPrice, 'minPrice');
    if (maxPrice !== undefined) filter.price.$lte = toNumber(maxPrice, 'maxPrice');
  }
  if (inStock === 'true') filter.quantity = { $gt: 0 };
  else if (inStock === 'false') filter.quantity = 0;

  // Sorting: ?sort=price,-quantity  (prefix '-' = descending)
  let sortBy = '-createdAt';
  if (req.query.sort) {
    const fields = String(req.query.sort).split(',').map((s) => s.trim()).filter(Boolean);
    for (const f of fields) {
      if (!SORTABLE_FIELDS.includes(f.replace(/^-/, ''))) {
        throw new AppError(`Cannot sort by '${f}'. Allowed: ${SORTABLE_FIELDS.join(', ')}`, 400);
      }
    }
    if (fields.length) sortBy = fields.join(' ');
  }

  // Pagination
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(`${sortBy} _id`).skip(skip).limit(limit),
  ]);

  res.status(200).json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// ---------- READ (single) ----------
// GET /api/products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json(product);
});

// ---------- UPDATE ----------
// PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = pick(req.body, ALLOWED_FIELDS);
  if (Object.keys(updates).length === 0) {
    throw new AppError(`Provide at least one updatable field: ${ALLOWED_FIELDS.join(', ')}`, 400);
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json(product);
});

// ---------- STOCK ADJUSTMENT (restock / sale) ----------
// PATCH /api/products/:id/stock   body: { "change": 10 } or { "change": -3 }
exports.adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;

  // Atomic update: the filter guarantees stock can never go below zero,
  // and $inc avoids race conditions between concurrent requests.
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, quantity: { $gte: -change } },
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Product not found', 404);
    throw new AppError('Insufficient stock: quantity cannot go below zero', 400);
  }

  res.status(200).json({ message: 'Stock updated', product });
});

// ---------- DELETE ----------
// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json({ message: 'Product deleted', id: product.id });
});

// ---------- REPORT: LOW STOCK (aggregation) ----------
// GET /api/products/low-stock   -> items where quantity <= reorderLevel
exports.getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    { $sort: { quantity: 1, name: 1 } },
    {
      $addFields: {
        stockValue: { $multiply: ['$price', '$quantity'] },
        id: { $toString: '$_id' },
      },
    },
  ]);

  res.status(200).json({ count: lowStockItems.length, lowStockItems });
});

// ---------- REPORT: CATEGORY SUMMARY (aggregation) ----------
// GET /api/products/summary
exports.getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $addFields: { avgPrice: { $round: ['$avgPrice', 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.status(200).json({ categories: summary.length, summary });
});
