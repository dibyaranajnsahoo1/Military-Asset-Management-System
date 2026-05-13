/**
 * MAMS Database Seeder
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const { Base, Asset, Purchase, Transfer, Assignment, Expenditure } = require('./models');

const mkDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
};

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Base.deleteMany({}), Asset.deleteMany({}),
    Purchase.deleteMany({}), Transfer.deleteMany({}),
    Assignment.deleteMany({}), Expenditure.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── Bases ──────────────────────────────────────────────────────────────
  const bases = await Base.insertMany([
    { name: 'Alpha Base', location: 'Northern Region', code: 'ALPHA' },
    { name: 'Bravo Base', location: 'Eastern Region',  code: 'BRAVO' },
    { name: 'Charlie Base', location: 'Southern Region', code: 'CHARLIE' },
  ]);
  const [alpha, bravo, charlie] = bases;
  console.log('🏕️  Bases seeded');

  // ─── Users ──────────────────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(12);
  const hashPw = (pw) => bcrypt.hash(pw, salt);

  const users = await User.insertMany([
    { name: 'Gen. Admin',       email: 'admin@military.gov',      passwordHash: await hashPw('admin123'),      role: 'Admin',           baseId: null },
    { name: 'Col. James Wilson',email: 'commander@alpha.mil',     passwordHash: await hashPw('commander123'),  role: 'BaseCommander',   baseId: alpha._id },
    { name: 'Lt. Sarah Chen',   email: 'logistics@bravo.mil',     passwordHash: await hashPw('logistics123'),  role: 'LogisticsOfficer',baseId: bravo._id },
    { name: 'Col. Maria Santos',email: 'commander@charlie.mil',   passwordHash: await hashPw('commander456'),  role: 'BaseCommander',   baseId: charlie._id },
  ]);
  const [adminUser, alphaCmd, bravoLO] = users;
  console.log('👤 Users seeded');

  // ─── Assets ─────────────────────────────────────────────────────────────
  const assets = await Asset.insertMany([
    { name: 'Rifle M16',       type: 'Weapon',     baseId: alpha._id,   openingQty: 100, currentQty: 100 },
    { name: 'Combat Shotgun',  type: 'Weapon',     baseId: alpha._id,   openingQty: 35,  currentQty: 35 },
    { name: '5.56mm Rounds',   type: 'Ammunition', baseId: alpha._id,   openingQty: 40000, currentQty: 40000 },
    { name: 'Humvee',          type: 'Vehicle',    baseId: alpha._id,   openingQty: 20,  currentQty: 20 },
    { name: 'AK-47',           type: 'Weapon',     baseId: bravo._id,   openingQty: 150, currentQty: 150 },
    { name: '7.62mm Rounds',   type: 'Ammunition', baseId: bravo._id,   openingQty: 60000, currentQty: 60000 },
    { name: 'Tank M1A2',       type: 'Vehicle',    baseId: bravo._id,   openingQty: 5,   currentQty: 5 },
    { name: 'MRAP Vehicle',    type: 'Vehicle',    baseId: bravo._id,   openingQty: 8,   currentQty: 8 },
    { name: 'Sniper Rifle',    type: 'Weapon',     baseId: charlie._id, openingQty: 25,  currentQty: 25 },
    { name: '.50 Cal Rounds',  type: 'Ammunition', baseId: charlie._id, openingQty: 8000, currentQty: 8000 },
    { name: 'Pistol M9',       type: 'Weapon',     baseId: charlie._id, openingQty: 60,  currentQty: 60 },
    { name: 'Jeep Cherokee',   type: 'Vehicle',    baseId: charlie._id, openingQty: 12,  currentQty: 12 },
  ]);
  console.log('📦 Assets seeded');

  const [rifleM16, shotgun, rounds556, humvee, ak47, rounds762, tank, mrap, sniperRifle, rounds50cal, pistol, jeep] = assets;

  // ─── Purchases ──────────────────────────────────────────────────────────
  await Purchase.insertMany([
    { assetId: rifleM16._id,   baseId: alpha._id,   quantity: 50,    purchaseDate: mkDate(45), addedBy: adminUser._id },
    { assetId: humvee._id,     baseId: alpha._id,   quantity: 5,     purchaseDate: mkDate(30), addedBy: alphaCmd._id  },
    { assetId: rounds556._id,  baseId: alpha._id,   quantity: 10000, purchaseDate: mkDate(20), addedBy: alphaCmd._id  },
    { assetId: shotgun._id,    baseId: alpha._id,   quantity: 15,    purchaseDate: mkDate(5),  addedBy: alphaCmd._id  },
    { assetId: ak47._id,       baseId: bravo._id,   quantity: 80,    purchaseDate: mkDate(40), addedBy: adminUser._id },
    { assetId: rounds762._id,  baseId: bravo._id,   quantity: 20000, purchaseDate: mkDate(15), addedBy: bravoLO._id   },
    { assetId: tank._id,       baseId: bravo._id,   quantity: 2,     purchaseDate: mkDate(60), addedBy: adminUser._id },
    { assetId: mrap._id,       baseId: bravo._id,   quantity: 3,     purchaseDate: mkDate(55), addedBy: bravoLO._id   },
    { assetId: sniperRifle._id,baseId: charlie._id, quantity: 10,    purchaseDate: mkDate(25), addedBy: adminUser._id },
    { assetId: rounds50cal._id,baseId: charlie._id, quantity: 3000,  purchaseDate: mkDate(10), addedBy: adminUser._id },
  ]);
  console.log('🛒 Purchases seeded');

  // ─── Transfers ──────────────────────────────────────────────────────────
  await Transfer.insertMany([
    { assetId: rifleM16._id,   fromBaseId: alpha._id, toBaseId: bravo._id,   quantity: 20,   transferDate: mkDate(35), initiatedBy: adminUser._id },
    { assetId: rounds556._id,  fromBaseId: bravo._id, toBaseId: alpha._id,   quantity: 5000, transferDate: mkDate(22), initiatedBy: bravoLO._id   },
    { assetId: humvee._id,     fromBaseId: alpha._id, toBaseId: charlie._id, quantity: 3,    transferDate: mkDate(18), initiatedBy: alphaCmd._id  },
    { assetId: sniperRifle._id,fromBaseId: charlie._id,toBaseId: bravo._id,  quantity: 5,    transferDate: mkDate(8),  initiatedBy: adminUser._id },
    { assetId: rounds762._id,  fromBaseId: bravo._id, toBaseId: charlie._id, quantity: 8000, transferDate: mkDate(5),  initiatedBy: bravoLO._id   },
    { assetId: ak47._id,       fromBaseId: bravo._id, toBaseId: alpha._id,   quantity: 10,   transferDate: mkDate(12), initiatedBy: adminUser._id },
  ]);
  console.log('🔄 Transfers seeded');

  // ─── Assignments ────────────────────────────────────────────────────────
  await Assignment.insertMany([
    { assetId: rifleM16._id,   baseId: alpha._id,   quantity: 30, assignedTo: 'Delta Squad - Unit 1',    assignmentDate: mkDate(28), createdBy: alphaCmd._id },
    { assetId: humvee._id,     baseId: alpha._id,   quantity: 2,  assignedTo: 'Recon Unit Alpha',         assignmentDate: mkDate(20), createdBy: alphaCmd._id },
    { assetId: rounds556._id,  baseId: alpha._id,   quantity: 5000,assignedTo: 'Alpha Company - Drill',  assignmentDate: mkDate(4),  createdBy: alphaCmd._id },
    { assetId: ak47._id,       baseId: bravo._id,   quantity: 50, assignedTo: 'Bravo Company',            assignmentDate: mkDate(14), createdBy: adminUser._id },
    { assetId: sniperRifle._id,baseId: charlie._id, quantity: 8,  assignedTo: 'Sniper Team Charlie',      assignmentDate: mkDate(7),  createdBy: adminUser._id },
    { assetId: shotgun._id,    baseId: alpha._id,   quantity: 5,  assignedTo: 'Sgt. Martinez - Patrol',  assignmentDate: mkDate(2),  createdBy: alphaCmd._id },
  ]);
  console.log('📋 Assignments seeded');

  // ─── Expenditures ───────────────────────────────────────────────────────
  await Expenditure.insertMany([
    { assetId: rounds556._id,  baseId: alpha._id,   quantity: 2000, reason: 'Training Exercise',  dateExpended: mkDate(25), createdBy: alphaCmd._id  },
    { assetId: rounds762._id,  baseId: bravo._id,   quantity: 5000, reason: 'Combat Operation',   dateExpended: mkDate(12), createdBy: adminUser._id },
    { assetId: humvee._id,     baseId: alpha._id,   quantity: 1,    reason: 'Damaged in Field',   dateExpended: mkDate(6),  createdBy: alphaCmd._id  },
    { assetId: rounds50cal._id,baseId: charlie._id, quantity: 1500, reason: 'Training Exercise',  dateExpended: mkDate(3),  createdBy: adminUser._id },
    { assetId: ak47._id,       baseId: bravo._id,   quantity: 3,    reason: 'Destroyed',          dateExpended: mkDate(9),  createdBy: adminUser._id },
  ]);
  console.log('💥 Expenditures seeded');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('   Admin:            admin@military.gov   / admin123');
  console.log('   Base Commander:   commander@alpha.mil  / commander123');
  console.log('   Logistics Officer:logistics@bravo.mil  / logistics123');
  console.log('   Charlie Commander:commander@charlie.mil/ commander456');

  process.exit(0);
};

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
