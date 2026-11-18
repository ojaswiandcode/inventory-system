const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Apparel',
  'Furniture',
  'Stationery',
  'Groceries',
  'Books',
  'Sports',
  'Home & Kitchen',
  'Toys',
  'Other',
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9-]+$/, 'SKU can only contain letters, numbers and hyphens'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number',
      },
    },
    reorderLevel: {
      type: Number,
      min: [0, 'Reorder level cannot be negative'],
      default: 10,
      validate: {
        validator: Number.isInteger,
        message: 'Reorder level must be a whole number',
      },
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters'],
      default: 'Unknown',
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: total value of stock on hand
productSchema.virtual('stockValue').get(function () {
  return this.price * this.quantity;
});

productSchema.index({ category: 1 });

const Product = mongoose.model('Product', productSchema);
Product.CATEGORIES = CATEGORIES;

module.exports = Product;
