require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Style = require('../models/Style');
const Bundle = require('../models/Bundle');
const StockItem = require('../models/StockItem');
const StageTransition = require('../models/StageTransition');
const StockMovement = require('../models/StockMovement');

async function seed() {
  await connectDB();

  // Drop collections entirely to clear any stale indexes from prior schemas
  const db = mongoose.connection.db;
  const existing = await db.listCollections().toArray();
  const names = existing.map(c => c.name);
  await Promise.all(
    ['users', 'styles', 'bundles', 'stockitems', 'stagetransitions', 'stockmovements']
      .filter(n => names.includes(n))
      .map(n => db.dropCollection(n))
  );

  const passwordHash = await bcrypt.hash('password123', 10);

  const [manager, op1] = await User.create([
    { name: 'vignesh', email: 'manager@connoisseur.com', passwordHash, role: 'manager' },
    { name: 'Arjun', email: 'operator1@connoisseur.com', passwordHash, role: 'operator' },
    { name: 'ganesh', email: 'operator2@connoisseur.com', passwordHash, role: 'operator' },
  ]);

  const [s1, s2, s3] = await Style.create([
    { name: 'Classic Kurta', code: 'CK001', description: 'Traditional cotton kurta', createdBy: manager._id },
    { name: 'Formal Shirt', code: 'FS002', description: 'Office formal shirt', createdBy: manager._id },
    { name: 'Casual Tee', code: 'CT003', description: 'Round neck casual t-shirt', createdBy: manager._id },
  ]);

  await Bundle.create([
    { bundleId: 'CK001-B001', styleId: s1._id, quantity: 50, currentStage: 'cutting', status: 'wip' },
    { bundleId: 'CK001-B002', styleId: s1._id, quantity: 30, currentStage: 'stitching', status: 'wip' },
    { bundleId: 'CK001-B003', styleId: s1._id, quantity: 20, currentStage: 'finishing', status: 'wip' },
    { bundleId: 'FS002-B001', styleId: s2._id, quantity: 40, currentStage: 'stitching', status: 'wip' },
    { bundleId: 'FS002-B002', styleId: s2._id, quantity: 25, currentStage: 'packing', status: 'packed' },
    { bundleId: 'FS002-B003', styleId: s2._id, quantity: 35, currentStage: 'finishing', status: 'wip' },
    { bundleId: 'CT003-B001', styleId: s3._id, quantity: 60, currentStage: 'cutting', status: 'wip' },
    { bundleId: 'CT003-B002', styleId: s3._id, quantity: 45, currentStage: 'stitching', status: 'wip' },
  ]);

  await StockItem.create([
    { styleId: s2._id, location: 'factory', quantity: 25 },
    { styleId: s1._id, location: 'dispatch', quantity: 10 },
    { styleId: s3._id, location: 'factory', quantity: 15 },
  ]);

  await StockMovement.create([
    { type: 'in', styleId: s2._id, toLoc: 'factory', quantity: 25, doneBy: op1._id },
    { type: 'in', styleId: s1._id, toLoc: 'factory', quantity: 20, doneBy: op1._id },
    { type: 'transfer', styleId: s1._id, fromLoc: 'factory', toLoc: 'dispatch', quantity: 10, doneBy: manager._id },
    { type: 'in', styleId: s3._id, toLoc: 'factory', quantity: 15, doneBy: op1._id },
  ]);

  console.log('\n✅ Seed complete!');
  console.log('---');
  console.log('Manager: manager@connoisseur.com / password123');
  console.log('Operator: operator1@connoisseur.com / password123');
  console.log('Operator: operator2@connoisseur.com / password123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
