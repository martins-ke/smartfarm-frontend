/**
 * AgroSync Unit Conversion Engine
 * All stock is stored in BASE UNITS. Display uses compound formatting.
 */

export const UNIT_FAMILIES = {
  count: {
    label: 'Count / Pieces',
    baseUnit: 'piece',
    baseUnitLabel: 'pieces',
    units: [
      { key: 'piece',  label: 'Piece(s)',          factor: 1 },
      { key: 'dozen',  label: 'Dozen (12 pcs)',     factor: 12 },
      { key: 'tray',   label: 'Tray (30 pcs)',      factor: 30 },
      { key: 'crate',  label: 'Crate (360 pcs)',    factor: 360 },
      { key: 'bunch',  label: 'Bunch (varies)',      factor: null }, // custom
    ],
  },
  weight: {
    label: 'Weight',
    baseUnit: 'kg',
    baseUnitLabel: 'kg',
    units: [
      { key: 'g',      label: 'Gram (g)',            factor: 0.001 },
      { key: 'kg',     label: 'Kilogram (kg)',        factor: 1 },
      { key: 'bag50',  label: 'Bag – 50 kg',         factor: 50 },
      { key: 'bag90',  label: 'Bag – 90 kg',         factor: 90 },
      { key: 'tonne',  label: 'Tonne (1000 kg)',     factor: 1000 },
    ],
  },
  volume: {
    label: 'Volume / Liquid',
    baseUnit: 'litre',
    baseUnitLabel: 'litres',
    units: [
      { key: 'ml',        label: 'Millilitre (ml)',   factor: 0.001 },
      { key: 'litre',     label: 'Litre (L)',          factor: 1 },
      { key: 'gallon',    label: 'Gallon (4.546 L)',  factor: 4.546 },
      { key: 'jerrycan',  label: 'Jerrycan (20 L)',   factor: 20 },
      { key: 'drum',      label: 'Drum (200 L)',       factor: 200 },
    ],
  },
  custom: {
    label: 'Custom / Local Units',
    baseUnit: null,
    baseUnitLabel: null,
    units: [
      { key: 'calabash',  label: 'Calabash',           factor: null },
      { key: 'basket',    label: 'Basket',              factor: null },
      { key: 'bundle',    label: 'Bundle',              factor: null },
      { key: 'head',      label: 'Head (livestock)',    factor: null },
      { key: 'custom',    label: 'Other (custom)',      factor: null },
    ],
  },
};

/** Normalizes common aliases, abbreviations, and plurals */
export function normalizeUnitKey(rawUnit) {
  if (!rawUnit) return '';
  const cleaned = String(rawUnit).trim().toLowerCase();
  const ALIASES = {
    pieces: 'piece', pc: 'piece', pcs: 'piece', egg: 'piece', eggs: 'piece', piece: 'piece',
    dozens: 'dozen', dozen: 'dozen',
    trays: 'tray', tray: 'tray',
    crates: 'crate', crate: 'crate',
    g: 'g', gram: 'g', grams: 'g',
    kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
    tonne: 'tonne', tonnes: 'tonne', ton: 'tonne', tons: 'tonne',
    bag50: 'bag50', 'bag-50kg': 'bag50', '50kg bag': 'bag50',
    bag90: 'bag90', 'bag-90kg': 'bag90', '90kg bag': 'bag90',
    bag: 'bag', bags: 'bag',
    ml: 'ml', millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
    l: 'litre', litre: 'litre', litres: 'litre', liter: 'litre', liters: 'litre',
    gallon: 'gallon', gallons: 'gallon',
    jerrycan: 'jerrycan', jerrycans: 'jerrycan',
    drum: 'drum', drums: 'drum',
    bunch: 'bunch', bunches: 'bunch',
    calabash: 'calabash', calabashes: 'calabash',
    basket: 'basket', baskets: 'basket',
    bundle: 'bundle', bundles: 'bundle',
    head: 'head', heads: 'head',
  };
  return ALIASES[cleaned] || cleaned;
}

/** Flat list of all non-custom units with their family info */
export const ALL_UNITS = Object.entries(UNIT_FAMILIES).flatMap(([familyKey, family]) =>
  family.units
    .filter(u => u.factor !== null)
    .map(u => ({ ...u, familyKey, familyLabel: family.label, baseUnit: family.baseUnit, baseUnitLabel: family.baseUnitLabel }))
);

/** Custom units that require a user-defined conversion factor */
export const CUSTOM_UNIT_KEYS = Object.values(UNIT_FAMILIES)
  .flatMap(f => f.units)
  .filter(u => u.factor === null)
  .map(u => u.key);

/** Get unit definition by key */
export function getUnit(key) {
  const normKey = normalizeUnitKey(key);
  for (const family of Object.values(UNIT_FAMILIES)) {
    const found = family.units.find(u => u.key === normKey || u.key === key);
    if (found) return { ...found, baseUnit: family.baseUnit, baseUnitLabel: family.baseUnitLabel, familyLabel: family.label };
  }
  return null;
}

/** Get family for a unit key */
export function getFamilyForUnit(unitKey) {
  const normKey = normalizeUnitKey(unitKey);
  for (const [key, family] of Object.entries(UNIT_FAMILIES)) {
    if (family.units.some(u => u.key === normKey || u.key === unitKey)) return { key, ...family };
  }
  return null;
}

/**
 * Convert a quantity from a given unit to its family's base unit.
 * For custom units, customFactor must be provided (e.g. 1 calabash = 2 kg → customFactor = 2).
 * Returns null if conversion is not possible.
 */
export function toBaseUnit(quantity, unitKey, customFactor = null) {
  const unit = getUnit(unitKey);
  if (!unit) return quantity; // unknown unit, return as-is
  const factor = unit.factor ?? customFactor;
  if (factor === null) return null;
  return parseFloat((quantity * factor).toFixed(6));
}

/**
 * Convert a quantity from the base unit back to a target unit.
 */
export function fromBaseUnit(baseQty, targetUnitKey, customFactor = null) {
  const unit = getUnit(targetUnitKey);
  if (!unit) return baseQty;
  const factor = unit.factor ?? customFactor;
  if (!factor) return baseQty;
  return parseFloat((baseQty / factor).toFixed(4));
}

/**
 * Display a base-unit quantity as a compound string.
 * Always ensures the unit label is included.
 * e.g. 65 pieces → "2 trays + 5 pieces"
 * e.g. 30 pieces → "1 tray"
 * e.g. 7 bags    → "7 bags"
 */
export function toCompoundDisplay(baseQty, unitKey) {
  if (baseQty === null || baseQty === undefined) {
    return `0 ${unitKey || 'units'}`;
  }

  const qty = Number(baseQty);
  if (isNaN(qty)) {
    return unitKey ? `${baseQty} ${unitKey}` : `${baseQty}`;
  }

  const normKey = normalizeUnitKey(unitKey);
  const family = getFamilyForUnit(normKey || unitKey);

  // If unknown family or custom unit with no base unit, show with unit label
  if (!family || !family.baseUnit) {
    return unitKey ? `${qty} ${unitKey}` : `${qty}`;
  }

  // Count family: pieces, trays, crates
  if (family.key === 'count') {
    let remaining = qty;
    const parts = [];

    if (remaining >= 360) {
      const crates = Math.floor(remaining / 360);
      parts.push(`${crates} ${crates === 1 ? 'crate' : 'crates'}`);
      remaining = remaining % 360;
    }
    if (remaining >= 30) {
      const trays = Math.floor(remaining / 30);
      parts.push(`${trays} ${trays === 1 ? 'tray' : 'trays'}`);
      remaining = remaining % 30;
    }
    if (remaining > 0 || parts.length === 0) {
      parts.push(`${remaining} ${remaining === 1 ? 'piece' : 'pieces'}`);
    }
    return parts.join(' + ');
  }

  // Weight family: g, kg, tonnes
  if (family.key === 'weight') {
    let remaining = qty;
    const parts = [];
    if (remaining >= 1000) {
      const tonnes = Math.floor(remaining / 1000);
      parts.push(`${tonnes} ${tonnes === 1 ? 'tonne' : 'tonnes'}`);
      remaining = parseFloat((remaining % 1000).toFixed(2));
    }
    if (remaining > 0 || parts.length === 0) {
      parts.push(`${remaining} kg`);
    }
    return parts.join(' + ');
  }

  // Volume family: ml, litres, jerrycans, drums
  if (family.key === 'volume') {
    let remaining = qty;
    const parts = [];
    if (remaining >= 200) {
      const drums = Math.floor(remaining / 200);
      parts.push(`${drums} ${drums === 1 ? 'drum' : 'drums'}`);
      remaining = parseFloat((remaining % 200).toFixed(2));
    }
    if (remaining >= 20) {
      const jerrycans = Math.floor(remaining / 20);
      parts.push(`${jerrycans} ${jerrycans === 1 ? 'jerrycan' : 'jerrycans'}`);
      remaining = parseFloat((remaining % 20).toFixed(2));
    }
    if (remaining > 0 || parts.length === 0) {
      parts.push(`${remaining} ${remaining === 1 ? 'litre' : 'litres'}`);
    }
    return parts.join(' + ');
  }

  return unitKey ? `${qty} ${unitKey}` : `${qty}`;
}

/**
 * Format inventory item for stock display (handles both new converted items and legacy items)
 */
export function formatHarvestStock(item) {
  if (!item) return '0 units';
  const qty = Number(item.available_quantity ?? item.availableQuantity ?? 0);
  const baseUnit = item.base_unit || item.baseUnit;
  const rawUnits = item.units || item.unit || '';
  const displayUnit = item.display_unit || item.displayUnit;

  // New records with explicit base_unit
  if (baseUnit) {
    return toCompoundDisplay(qty, baseUnit);
  }

  // Legacy records with no base_unit:
  if (rawUnits) {
    const norm = normalizeUnitKey(rawUnits);
    const family = getFamilyForUnit(norm);
    if (family && family.baseUnit === norm) {
      return toCompoundDisplay(qty, norm);
    }
    return `${qty} ${rawUnits}`;
  }

  return `${qty} units`;
}

/** Check if a unit key requires a custom conversion factor */
export function isCustomUnit(unitKey) {
  return CUSTOM_UNIT_KEYS.includes(unitKey);
}

/** All unit options as flat list for a <select> / datalist grouped display */
export function getGroupedUnitOptions() {
  return Object.entries(UNIT_FAMILIES).map(([, family]) => ({
    groupLabel: family.label,
    options: family.units.map(u => ({
      value: u.key,
      label: u.label,
      isCustom: u.factor === null,
    })),
  }));
}
