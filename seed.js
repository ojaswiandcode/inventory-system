require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Wireless Mouse', sku: 'ELEC-MS-101', category: 'Electronics', price: 799, quantity: 25, reorderLevel: 10, supplier: 'Logitech India' },
  { name: 'Bluetooth Headphones', sku: 'ELEC-HP-102', category: 'Electronics', price: 2999, quantity: 30, reorderLevel: 8, supplier: 'boAt' },
  { name: 'Mechanical Keyboard', sku: 'ELEC-KB-103', category: 'Electronics', price: 4499, quantity: 3, reorderLevel: 8, supplier: 'Redragon' },
  { name: 'Laptop 15 inch', sku: 'ELEC-LT-104', category: 'Electronics', price: 54999, quantity: 5, reorderLevel: 3, supplier: 'HP India' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-201', category: 'Apparel', price: 499, quantity: 60, reorderLevel: 20, supplier: 'Allen Solly' },
  { name: 'Denim Jacket', sku: 'APRL-DJ-202', category: 'Apparel', price: 2299, quantity: 5, reorderLevel: 10, supplier: 'Levis India' },
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-813', category: 'Furniture', price: 6499, quantity: 15, reorderLevel: 5, supplier: 'Godrej Interio' },
  { name: 'A4 Notebook Pack of 5', sku: 'STNY-NB-701', category: 'Stationery', price: 250, quantity: 100, reorderLevel: 30, supplier: 'Classmate' },
  { name: 'Highlighter Set', sku: 'STNY-HL-702', category: 'Stationery', price: 180, quantity: 8, reorderLevel: 15, supplier: 'Camlin' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-901', category: 'Groceries', price: 650, quantity: 40, reorderLevel: 15, supplier: 'India Gate' },
  { name: 'Olive Oil 1L', sku: 'GROC-OL-902', category: 'Groceries', price: 899, quantity: 20, reorderLevel: 12, supplier: 'Figaro' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.syncIndexes();
    const created = await Product.insertMany(products);
    console.log(`Seeded ${created.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
