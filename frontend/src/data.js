// ─── HELPERS ──────────────────────────────────────────────────────────────
export const mkId  = () => '_' + Math.random().toString(36).substr(2, 9);
export const mkDate = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().split('T')[0]; };
export const fmtDate = (d) => {
  if (!d) return '—';

  const value = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
    ? `${d}T00:00:00`
    : d;
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
export const fmtNum  = (n) => {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
};

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
export const BASES = [
  { id: 'b1', name: 'Alpha Base',   location: 'Northern Region', code: 'ALPHA'   },
  { id: 'b2', name: 'Bravo Base',   location: 'Eastern Region',  code: 'BRAVO'   },
  { id: 'b3', name: 'Charlie Base', location: 'Southern Region', code: 'CHARLIE' },
];

export const ASSET_TYPES = ['Weapon', 'Vehicle', 'Ammunition'];

export const EXPENDITURE_REASONS = [
  'Training Exercise', 'Combat Operation', 'Damaged in Field',
  'Destroyed', 'Expired', 'Lost', 'Maintenance Write-off',
];

export const MOCK_USERS = [
  { id: 'u1', name: 'Gen. Admin',        email: 'admin@military.gov',     role: 'Admin',            baseId: null, password: 'admin123'      },
  { id: 'u2', name: 'Col. James Wilson', email: 'commander@alpha.mil',    role: 'BaseCommander',    baseId: 'b1', password: 'commander123'  },
  { id: 'u3', name: 'Lt. Sarah Chen',    email: 'logistics@bravo.mil',    role: 'LogisticsOfficer', baseId: 'b2', password: 'logistics123'  },
  { id: 'u4', name: 'Col. Maria Santos', email: 'commander@charlie.mil',  role: 'BaseCommander',    baseId: 'b3', password: 'commander456'  },
];

export const ROLE_ACCESS = {
  Admin:            ['dashboard', 'purchases', 'transfers', 'assignments', 'users'],
  BaseCommander:    ['dashboard', 'purchases', 'transfers', 'assignments'],
  LogisticsOfficer: ['purchases', 'transfers'],
};

export const ROLE_CFG = {
  Admin:            { bg: '#F3E8FF', color: '#7C3AED', label: 'Admin',             border: '#DDD6FE' },
  BaseCommander:    { bg: '#DBEAFE', color: '#1D4ED8', label: 'Base Commander',     border: '#BFDBFE' },
  LogisticsOfficer: { bg: '#DCFCE7', color: '#15803D', label: 'Logistics Officer',  border: '#BBF7D0' },
};

export const TYPE_CFG = {
  Weapon:     { bg: '#FEE2E2', color: '#DC2626' },
  Vehicle:    { bg: '#DBEAFE', color: '#2563EB' },
  Ammunition: { bg: '#FEF3C7', color: '#D97706' },
};

// ─── SEED DATA ──────────────────────────────────────────────────────────────
export const INIT_ASSETS = [
  { id: 'a1',  name: 'Rifle M16',       type: 'Weapon',     baseId: 'b1', openingQty: 100   },
  { id: 'a2',  name: 'Combat Shotgun',  type: 'Weapon',     baseId: 'b1', openingQty: 35    },
  { id: 'a3',  name: '5.56mm Rounds',   type: 'Ammunition', baseId: 'b1', openingQty: 40000 },
  { id: 'a4',  name: 'Humvee',          type: 'Vehicle',    baseId: 'b1', openingQty: 20    },
  { id: 'a5',  name: 'AK-47',           type: 'Weapon',     baseId: 'b2', openingQty: 150   },
  { id: 'a6',  name: '7.62mm Rounds',   type: 'Ammunition', baseId: 'b2', openingQty: 60000 },
  { id: 'a7',  name: 'Tank M1A2',       type: 'Vehicle',    baseId: 'b2', openingQty: 5     },
  { id: 'a8',  name: 'MRAP Vehicle',    type: 'Vehicle',    baseId: 'b2', openingQty: 8     },
  { id: 'a9',  name: 'Sniper Rifle',    type: 'Weapon',     baseId: 'b3', openingQty: 25    },
  { id: 'a10', name: '.50 Cal Rounds',  type: 'Ammunition', baseId: 'b3', openingQty: 8000  },
  { id: 'a11', name: 'Pistol M9',       type: 'Weapon',     baseId: 'b3', openingQty: 60    },
  { id: 'a12', name: 'Jeep Cherokee',   type: 'Vehicle',    baseId: 'b3', openingQty: 12    },
];

export const INIT_PURCHASES = [
  { id: 'p1',  assetId: 'a1',  baseId: 'b1', assetName: 'Rifle M16',      assetType: 'Weapon',     quantity: 50,    purchaseDate: mkDate(45), addedBy: 'Gen. Admin'        },
  { id: 'p2',  assetId: 'a4',  baseId: 'b1', assetName: 'Humvee',         assetType: 'Vehicle',    quantity: 5,     purchaseDate: mkDate(30), addedBy: 'Col. James Wilson' },
  { id: 'p3',  assetId: 'a3',  baseId: 'b1', assetName: '5.56mm Rounds',  assetType: 'Ammunition', quantity: 10000, purchaseDate: mkDate(20), addedBy: 'Col. James Wilson' },
  { id: 'p4',  assetId: 'a2',  baseId: 'b1', assetName: 'Combat Shotgun', assetType: 'Weapon',     quantity: 15,    purchaseDate: mkDate(5),  addedBy: 'Col. James Wilson' },
  { id: 'p5',  assetId: 'a5',  baseId: 'b2', assetName: 'AK-47',          assetType: 'Weapon',     quantity: 80,    purchaseDate: mkDate(40), addedBy: 'Gen. Admin'        },
  { id: 'p6',  assetId: 'a6',  baseId: 'b2', assetName: '7.62mm Rounds',  assetType: 'Ammunition', quantity: 20000, purchaseDate: mkDate(15), addedBy: 'Lt. Sarah Chen'    },
  { id: 'p7',  assetId: 'a7',  baseId: 'b2', assetName: 'Tank M1A2',      assetType: 'Vehicle',    quantity: 2,     purchaseDate: mkDate(60), addedBy: 'Gen. Admin'        },
  { id: 'p8',  assetId: 'a8',  baseId: 'b2', assetName: 'MRAP Vehicle',   assetType: 'Vehicle',    quantity: 3,     purchaseDate: mkDate(55), addedBy: 'Lt. Sarah Chen'    },
  { id: 'p9',  assetId: 'a9',  baseId: 'b3', assetName: 'Sniper Rifle',   assetType: 'Weapon',     quantity: 10,    purchaseDate: mkDate(25), addedBy: 'Gen. Admin'        },
  { id: 'p10', assetId: 'a10', baseId: 'b3', assetName: '.50 Cal Rounds', assetType: 'Ammunition', quantity: 3000,  purchaseDate: mkDate(10), addedBy: 'Gen. Admin'        },
];

export const INIT_TRANSFERS = [
  { id: 't1', assetId: 'a1',  assetName: 'Rifle M16',      assetType: 'Weapon',     fromBaseId: 'b1', toBaseId: 'b2', quantity: 20,   transferDate: mkDate(35), initiatedBy: 'Gen. Admin'        },
  { id: 't2', assetId: 'a3',  assetName: '5.56mm Rounds',  assetType: 'Ammunition', fromBaseId: 'b2', toBaseId: 'b1', quantity: 5000, transferDate: mkDate(22), initiatedBy: 'Lt. Sarah Chen'    },
  { id: 't3', assetId: 'a4',  assetName: 'Humvee',         assetType: 'Vehicle',    fromBaseId: 'b1', toBaseId: 'b3', quantity: 3,    transferDate: mkDate(18), initiatedBy: 'Col. James Wilson' },
  { id: 't4', assetId: 'a9',  assetName: 'Sniper Rifle',   assetType: 'Weapon',     fromBaseId: 'b3', toBaseId: 'b2', quantity: 5,    transferDate: mkDate(8),  initiatedBy: 'Gen. Admin'        },
  { id: 't5', assetId: 'a6',  assetName: '7.62mm Rounds',  assetType: 'Ammunition', fromBaseId: 'b2', toBaseId: 'b3', quantity: 8000, transferDate: mkDate(5),  initiatedBy: 'Lt. Sarah Chen'    },
  { id: 't6', assetId: 'a5',  assetName: 'AK-47',          assetType: 'Weapon',     fromBaseId: 'b2', toBaseId: 'b1', quantity: 10,   transferDate: mkDate(12), initiatedBy: 'Gen. Admin'        },
];

export const INIT_ASSIGNMENTS = [
  { id: 'as1', assetId: 'a1',  assetName: 'Rifle M16',      assetType: 'Weapon',     baseId: 'b1', quantity: 30,   assignedTo: 'Delta Squad - Unit 1',   assignmentDate: mkDate(28) },
  { id: 'as2', assetId: 'a4',  assetName: 'Humvee',         assetType: 'Vehicle',    baseId: 'b1', quantity: 2,    assignedTo: 'Recon Unit Alpha',        assignmentDate: mkDate(20) },
  { id: 'as3', assetId: 'a3',  assetName: '5.56mm Rounds',  assetType: 'Ammunition', baseId: 'b1', quantity: 5000, assignedTo: 'Alpha Company - Drill',   assignmentDate: mkDate(4)  },
  { id: 'as4', assetId: 'a5',  assetName: 'AK-47',          assetType: 'Weapon',     baseId: 'b2', quantity: 50,   assignedTo: 'Bravo Company',           assignmentDate: mkDate(14) },
  { id: 'as5', assetId: 'a9',  assetName: 'Sniper Rifle',   assetType: 'Weapon',     baseId: 'b3', quantity: 8,    assignedTo: 'Sniper Team Charlie',     assignmentDate: mkDate(7)  },
  { id: 'as6', assetId: 'a2',  assetName: 'Combat Shotgun', assetType: 'Weapon',     baseId: 'b1', quantity: 5,    assignedTo: 'Sgt. Martinez - Patrol',  assignmentDate: mkDate(2)  },
];

export const INIT_EXPENDITURES = [
  { id: 'e1', assetId: 'a3',  assetName: '5.56mm Rounds',  assetType: 'Ammunition', baseId: 'b1', quantity: 2000, reason: 'Training Exercise', dateExpended: mkDate(25) },
  { id: 'e2', assetId: 'a6',  assetName: '7.62mm Rounds',  assetType: 'Ammunition', baseId: 'b2', quantity: 5000, reason: 'Combat Operation',  dateExpended: mkDate(12) },
  { id: 'e3', assetId: 'a4',  assetName: 'Humvee',         assetType: 'Vehicle',    baseId: 'b1', quantity: 1,    reason: 'Damaged in Field',  dateExpended: mkDate(6)  },
  { id: 'e4', assetId: 'a10', assetName: '.50 Cal Rounds', assetType: 'Ammunition', baseId: 'b3', quantity: 1500, reason: 'Training Exercise', dateExpended: mkDate(3)  },
  { id: 'e5', assetId: 'a5',  assetName: 'AK-47',          assetType: 'Weapon',     baseId: 'b2', quantity: 3,    reason: 'Destroyed',         dateExpended: mkDate(9)  },
];
