// [BOTH] Multi-brand filament catalogue for PrintFlow Lite
// Covers top brands available in USA and Canada
// Brand visibility is filtered per-user via app_settings.brand_filter

export const MATERIAL_TYPES = [
  { key: 'PLA',          label: 'PLA',          desc: 'Standard — easy to print, great detail' },
  { key: 'PLA Silk',     label: 'PLA Silk',      desc: 'Shiny metallic-like finish' },
  { key: 'PLA Matte',    label: 'PLA Matte',     desc: 'Flat matte finish, no glare' },
  { key: 'PLA+',         label: 'PLA+',           desc: 'Tougher, slightly flexible PLA variant' },
  { key: 'PETG',         label: 'PETG',          desc: 'Durable, food-safe, impact resistant' },
  { key: 'PETG-CF',      label: 'PETG-CF',       desc: 'Carbon fibre reinforced PETG' },
  { key: 'ABS',          label: 'ABS',           desc: 'Heat resistant — requires enclosure' },
  { key: 'ASA',          label: 'ASA',           desc: 'UV resistant, outdoor use' },
  { key: 'TPU',          label: 'TPU 95A',       desc: 'Flexible, rubber-like' },
  { key: 'TPE',          label: 'TPE',           desc: 'Very soft flexible filament' },
  { key: 'PA',           label: 'Nylon (PA)',    desc: 'High strength, wear resistant' },
  { key: 'PA-CF',        label: 'PA-CF',         desc: 'Carbon fibre reinforced Nylon' },
  { key: 'PA-GF',        label: 'PA-GF',         desc: 'Glass fibre reinforced Nylon' },
  { key: 'PC',           label: 'PC',            desc: 'Polycarbonate — tough, heat resistant' },
  { key: 'PC-CF',        label: 'PC-CF',         desc: 'Carbon fibre Polycarbonate' },
  { key: 'PVA',          label: 'PVA (Support)', desc: 'Water-soluble support material' },
  { key: 'HIPS',         label: 'HIPS (Support)',desc: 'Limonene-soluble support' },
  { key: 'PLA-CF',       label: 'PLA-CF',        desc: 'Carbon fibre reinforced PLA' },
  { key: 'Wood',         label: 'PLA Wood',      desc: 'Wood fibre composite — sandable' },
  { key: 'Marble',       label: 'PLA Marble',    desc: 'Stone-like marble appearance' },
  { key: 'Other',        label: 'Other',         desc: 'Specialty or unlisted material' },
];

// Common colors used across most brands
const STANDARD_COLORS = [
  { name: 'White',       hex: '#F5F5F5' },
  { name: 'Black',       hex: '#1A1A1A' },
  { name: 'Grey',        hex: '#888888' },
  { name: 'Light Grey',  hex: '#CCCCCC' },
  { name: 'Red',         hex: '#D32F2F' },
  { name: 'Orange',      hex: '#F57C00' },
  { name: 'Yellow',      hex: '#FBC02D' },
  { name: 'Green',       hex: '#388E3C' },
  { name: 'Blue',        hex: '#1565C0' },
  { name: 'Navy Blue',   hex: '#1A237E' },
  { name: 'Purple',      hex: '#6A1B9A' },
  { name: 'Pink',        hex: '#E91E63' },
  { name: 'Brown',       hex: '#5D4037' },
  { name: 'Beige',       hex: '#D2B48C' },
  { name: 'Cyan',        hex: '#00BCD4' },
  { name: 'Teal',        hex: '#008080' },
  { name: 'Clear',       hex: '#E8F4F8' },
  { name: 'Skin',        hex: '#FDBCB4' },
  { name: 'Gold Silk',   hex: '#D4AF37' },
  { name: 'Silver Silk', hex: '#C0C0C0' },
  { name: 'Copper Silk', hex: '#B87333' },
];

export const BRAND_CATALOGUE = {
  'Bambu Lab': {
    website: 'https://bambulab.com',
    region: ['CA', 'US'],
    materials: {
      'PLA':       { price_cad: 31.99, weight_g: 1000 },
      'PLA Silk':  { price_cad: 34.99, weight_g: 1000 },
      'PLA Matte': { price_cad: 31.99, weight_g: 1000 },
      'PETG':      { price_cad: 31.99, weight_g: 1000 },
      'PETG-CF':   { price_cad: 49.99, weight_g: 1000 },
      'ABS':       { price_cad: 31.99, weight_g: 1000 },
      'ASA':       { price_cad: 36.99, weight_g: 1000 },
      'TPU':       { price_cad: 39.99, weight_g: 1000 },
      'PA':        { price_cad: 64.99, weight_g: 1000 },
      'PA-CF':     { price_cad: 84.99, weight_g: 1000 },
      'PC':        { price_cad: 64.99, weight_g: 1000 },
      'PC-CF':     { price_cad: 94.99, weight_g: 1000 },
      'PVA':       { price_cad: 54.99, weight_g: 500  },
    },
    colors: STANDARD_COLORS,
  },
  'Hatchbox': {
    website: 'https://hatchbox3d.com',
    region: ['CA', 'US'],
    materials: {
      'PLA':       { price_cad: 24.99, price_usd: 19.99, weight_g: 1000 },
      'PLA+':      { price_cad: 27.99, price_usd: 22.99, weight_g: 1000 },
      'PETG':      { price_cad: 27.99, price_usd: 22.99, weight_g: 1000 },
      'ABS':       { price_cad: 24.99, price_usd: 19.99, weight_g: 1000 },
      'ASA':       { price_cad: 29.99, price_usd: 24.99, weight_g: 1000 },
      'TPU':       { price_cad: 32.99, price_usd: 26.99, weight_g: 1000 },
      'PA':        { price_cad: 39.99, price_usd: 32.99, weight_g: 1000 },
      'Wood':      { price_cad: 34.99, price_usd: 28.99, weight_g: 1000 },
    },
    colors: STANDARD_COLORS,
  },
  'eSUN': {
    website: 'https://esun3d.com',
    region: ['CA', 'US'],
    materials: {
      'PLA':       { price_cad: 21.99, price_usd: 17.99, weight_g: 1000 },
      'PLA+':      { price_cad: 23.99, price_usd: 19.99, weight_g: 1000 },
      'PLA Silk':  { price_cad: 24.99, price_usd: 20.99, weight_g: 1000 },
      'PETG':      { price_cad: 23.99, price_usd: 19.99, weight_g: 1000 },
      'ABS':       { price_cad: 21.99, price_usd: 17.99, weight_g: 1000 },
      'ASA':       { price_cad: 25.99, price_usd: 21.99, weight_g: 1000 },
      'TPU':       { price_cad: 28.99, price_usd: 23.99, weight_g: 1000 },
      'PA':        { price_cad: 44.99, price_usd: 37.99, weight_g: 1000 },
      'PLA-CF':    { price_cad: 37.99, price_usd: 30.99, weight_g: 1000 },
      'PVA':       { price_cad: 44.99, price_usd: 36.99, weight_g: 500  },
    },
    colors: STANDARD_COLORS,
  },
  'Prusament': {
    website: 'https://prusament.com',
    region: ['CA', 'US'],
    materials: {
      'PLA':       { price_cad: 34.99, price_usd: 26.99, weight_g: 1000 },
      'PETG':      { price_cad: 36.99, price_usd: 28.99, weight_g: 1000 },
      'ASA':       { price_cad: 39.99, price_usd: 31.99, weight_g: 1000 },
      'PA-CF':     { price_cad: 84.99, price_usd: 67.99, weight_g: 500  },
      'PC':        { price_cad: 54.99, price_usd: 43.99, weight_g: 1000 },
    },
    colors: [
      ...STANDARD_COLORS,
      { name: 'Galaxy Silver',   hex: '#9E9E9E' },
      { name: 'Galaxy Black',    hex: '#1A1A2E' },
      { name: 'Prusa Orange',    hex: '#FA6831' },
      { name: 'Azure Blue',      hex: '#0095D9' },
    ],
  },
  'Polymaker': {
    website: 'https://polymaker.com',
    region: ['CA', 'US'],
    materials: {
      'PLA':       { price_cad: 26.99, weight_g: 1000 },
      'PLA Silk':  { price_cad: 29.99, weight_g: 1000 },
      'PLA Matte': { price_cad: 27.99, weight_g: 1000 },
      'PETG':      { price_cad: 28.99, weight_g: 1000 },
      'ABS':       { price_cad: 27.99, weight_g: 1000 },
      'ASA':       { price_cad: 32.99, weight_g: 1000 },
      'PC':        { price_cad: 44.99, weight_g: 1000 },
      'PA':        { price_cad: 54.99, weight_g: 1000 },
      'TPU':       { price_cad: 33.99, weight_g: 1000 },
    },
    colors: STANDARD_COLORS,
  },
  'Overture': {
    website: 'https://overture3d.com',
    region: ['CA', 'US'],
    materials: {
      'PLA':       { price_cad: 22.99, price_usd: 18.99, weight_g: 1000 },
      'PLA Silk':  { price_cad: 25.99, price_usd: 21.99, weight_g: 1000 },
      'PLA Matte': { price_cad: 23.99, price_usd: 19.99, weight_g: 1000 },
      'PETG':      { price_cad: 24.99, price_usd: 20.99, weight_g: 1000 },
      'ABS':       { price_cad: 22.99, price_usd: 18.99, weight_g: 1000 },
      'ASA':       { price_cad: 27.99, price_usd: 22.99, weight_g: 1000 },
      'TPU':       { price_cad: 28.99, price_usd: 23.99, weight_g: 1000 },
    },
    colors: STANDARD_COLORS,
  },
  'Sunlu': {
    website: 'https://sunlu.com',
    region: ['CA', 'US'],
    materials: {
      'PLA':       { price_cad: 18.99, price_usd: 14.99, weight_g: 1000 },
      'PLA Silk':  { price_cad: 22.99, price_usd: 18.99, weight_g: 1000 },
      'PLA Matte': { price_cad: 20.99, price_usd: 16.99, weight_g: 1000 },
      'PETG':      { price_cad: 21.99, price_usd: 17.99, weight_g: 1000 },
      'ABS':       { price_cad: 19.99, price_usd: 15.99, weight_g: 1000 },
      'TPU':       { price_cad: 26.99, price_usd: 21.99, weight_g: 1000 },
      'ASA':       { price_cad: 24.99, price_usd: 19.99, weight_g: 1000 },
    },
    colors: STANDARD_COLORS,
  },
  'Elegoo': {
    website: 'https://elegoo.com',
    region: ['CA', 'US'],
    materials: {
      'PLA':       { price_cad: 19.99, price_usd: 15.99, weight_g: 1000 },
      'PLA Silk':  { price_cad: 23.99, price_usd: 19.99, weight_g: 1000 },
      'PLA Matte': { price_cad: 20.99, price_usd: 16.99, weight_g: 1000 },
      'PETG':      { price_cad: 22.99, price_usd: 18.99, weight_g: 1000 },
      'ABS':       { price_cad: 20.99, price_usd: 16.99, weight_g: 1000 },
      'ASA':       { price_cad: 25.99, price_usd: 20.99, weight_g: 1000 },
      'TPU':       { price_cad: 27.99, price_usd: 22.99, weight_g: 1000 },
      'PLA-CF':    { price_cad: 34.99, price_usd: 28.99, weight_g: 500  },
    },
    colors: STANDARD_COLORS,
  },
  'Inland': {
    website: 'https://microcenter.com',
    region: ['US'],
    materials: {
      'PLA':       { price_usd: 14.99, weight_g: 1000 },
      'PLA+':      { price_usd: 17.99, weight_g: 1000 },
      'PETG':      { price_usd: 17.99, weight_g: 1000 },
      'ABS':       { price_usd: 14.99, weight_g: 1000 },
      'ASA':       { price_usd: 19.99, weight_g: 1000 },
      'TPU':       { price_usd: 22.99, weight_g: 1000 },
    },
    colors: STANDARD_COLORS,
  },
  'MatterHackers': {
    website: 'https://matterhackers.com',
    region: ['US'],
    materials: {
      'PLA':       { price_usd: 22.99, weight_g: 1000 },
      'PLA+':      { price_usd: 24.99, weight_g: 1000 },
      'PETG':      { price_usd: 24.99, weight_g: 1000 },
      'ABS':       { price_usd: 22.99, weight_g: 1000 },
      'ASA':       { price_usd: 26.99, weight_g: 1000 },
      'TPU':       { price_usd: 29.99, weight_g: 1000 },
      'PA-CF':     { price_usd: 69.99, weight_g: 500  },
      'PC':        { price_usd: 44.99, weight_g: 1000 },
    },
    colors: STANDARD_COLORS,
  },
  '3D Printing Canada': {
    website: 'https://3dprintingcanada.com',
    region: ['CA'],
    materials: {
      'PLA':       { price_cad: 22.99, weight_g: 1000 },
      'PLA+':      { price_cad: 24.99, weight_g: 1000 },
      'PETG':      { price_cad: 24.99, weight_g: 1000 },
      'ABS':       { price_cad: 22.99, weight_g: 1000 },
      'ASA':       { price_cad: 26.99, weight_g: 1000 },
      'TPU':       { price_cad: 28.99, weight_g: 1000 },
    },
    colors: STANDARD_COLORS,
  },
  'Amazon Basics': {
    website: 'https://amazon.ca',
    region: ['CA', 'US'],
    materials: {
      'PLA':       { price_cad: 18.99, price_usd: 14.99, weight_g: 1000 },
      'PETG':      { price_cad: 20.99, price_usd: 16.99, weight_g: 1000 },
      'ABS':       { price_cad: 18.99, price_usd: 14.99, weight_g: 1000 },
    },
    colors: STANDARD_COLORS,
  },
};

export const ALL_BRANDS = Object.keys(BRAND_CATALOGUE);
export const ALL_MATERIALS = [...new Set(Object.keys(MATERIAL_TYPES.reduce((a,m) => { a[m.key]=1; return a; }, {})))];

export function getBrandMaterials(brand) {
  return Object.keys(BRAND_CATALOGUE[brand]?.materials || {});
}

export function getBrandColors(brand) {
  return BRAND_CATALOGUE[brand]?.colors || STANDARD_COLORS;
}

export function getBrandPrice(brand, material, currency = 'CAD') {
  const m = BRAND_CATALOGUE[brand]?.materials[material];
  if (!m) return null;
  return currency === 'USD' ? (m.price_usd || null) : (m.price_cad || null);
}

export function getMaterialLabel(key) {
  return MATERIAL_TYPES.find(m => m.key === key)?.label || key;
}

export const SPOOL_WEIGHTS = [
  { label: '250g',  value: 250  },
  { label: '500g',  value: 500  },
  { label: '750g',  value: 750  },
  { label: '1kg',   value: 1000 },
  { label: '1.5kg', value: 1500 },
  { label: '2kg',   value: 2000 },
  { label: '3kg',   value: 3000 },
  { label: 'Custom',value: null },
];

export const DIAMETERS = [
  { label: '1.75mm', value: 1.75 },
  { label: '2.85mm', value: 2.85 },
];
