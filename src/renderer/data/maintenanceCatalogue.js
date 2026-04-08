// [BOTH] Brand-agnostic maintenance catalogue
// Tasks grouped by printer brand — users filter by what they own

export const PRINTER_BRANDS = [
  { key: 'generic',  label: 'Generic FDM',   icon: '🖨️', desc: 'Tasks that apply to any FDM printer' },
  { key: 'bambu',    label: 'Bambu Lab',      icon: '🟢', desc: 'P1S, A1, X1C, H2D' },
  { key: 'prusa',    label: 'Prusa',          icon: '🔶', desc: 'MK4, MK3.9, XL, Mini' },
  { key: 'creality', label: 'Creality',       icon: '🔵', desc: 'Ender 3, K1, K2, CR-10' },
  { key: 'voron',    label: 'Voron',          icon: '⚙️',  desc: 'Trident, 2.4, Switchwire' },
  { key: 'bambuA1',  label: 'Bambu A1/A1M',  icon: '🟢', desc: 'A1, A1 Mini, A1 with AMS Lite' },
  { key: 'ankermake',label: 'AnkerMake',      icon: '🔷', desc: 'M5, M5C' },
  { key: 'elegoo',   label: 'Elegoo',         icon: '🟣', desc: 'Neptune 4, Saturn (Resin)' },
  { key: 'flashforge',label:'FlashForge',     icon: '🟠', desc: 'Adventurer, Creator' },
];

// interval_days: how often the task should be performed
// applicable: array of brand keys, or ['all'] for universal tasks
export const MAINTENANCE_CATALOGUE = [

  // ─── Generic — all FDM printers ──────────────────────────────────────────
  {
    brand: 'generic', task: 'Inspect and clean nozzle exterior',
    interval_days: 7, interval_label: 'Weekly',
    instructions: 'Heat nozzle to printing temperature. Use a brass wire brush to clean burnt filament from the outside. Check for droop or cracks in the heater block.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Check belt tension',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Check X and Y axis belt tension. Belts should feel taut like a guitar string. Adjust using tensioner screws. Loose belts cause ringing/ghosting artifacts.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Level / mesh the bed',
    interval_days: 14, interval_label: 'Every 2 weeks',
    instructions: 'Run bed leveling from the printer menu. If your printer supports mesh leveling (BLTouch, CR Touch, PINDA), run a full mesh. Good first layer adhesion depends on this.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Clean print bed surface',
    interval_days: 7, interval_label: 'Weekly',
    instructions: 'Wipe the PEI or glass bed surface with isopropyl alcohol (90%+) using a lint-free cloth. Skin oils from handling reduce adhesion significantly.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Lubricate Z-axis lead screw(s)',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Apply a thin layer of PTFE lubricant or lithium grease to the Z-axis lead screw. Move the Z-axis up and down to distribute. Over-lubrication attracts dust.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Lubricate linear rails or rods',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Apply a small amount of machine oil or PTFE lube to linear rods. Wipe off excess. For linear rails, apply a thin film of grease to the rail and run the carriage back and forth.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Inspect PTFE tube',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Inspect the PTFE tube for yellowing, deformation, or a widened inner bore. Replace if discoloured — degraded PTFE releases harmful gases at high temperatures.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Replace nozzle',
    interval_days: 180, interval_label: 'Every 6 months',
    instructions: 'Heat nozzle to printing temp, use a wrench to remove and replace. Torque to ~1.5Nm — do not overtighten. Abrasive filaments (CF, GF) may need replacement every 1-3 months.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Check all screws and fasteners',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Check all visible screws including frame bolts, gantry, and motion system. Vibration during printing can cause screws to loosen over time.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Clean cooling fans',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Use compressed air to clear dust from hotend fan, part cooling fan, and mainboard fan. Clogged fans cause thermal issues and poor print quality.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Calibrate extruder E-steps',
    interval_days: 180, interval_label: 'Every 6 months or if under/over extruding',
    instructions: 'Mark 100mm on filament above extruder, command 100mm to extrude, measure actual distance moved. Adjust E-steps if off by more than 1-2mm.',
    applicable: ['all'],
  },
  {
    brand: 'generic', task: 'Run PID autotune — hotend',
    interval_days: 180, interval_label: 'Every 6 months or when changing hotend',
    instructions: 'Run M303 E0 S215 C8 from terminal to autotune hotend PID. Save result with M500. Ensures stable temperature which reduces blobs and stringing.',
    applicable: ['all'],
  },

  // ─── Bambu Lab P1S / X1C ──────────────────────────────────────────────────
  {
    brand: 'bambu', task: 'Lubricate X/Y carbon rods',
    interval_days: 14, interval_label: 'Every 2 weeks',
    instructions: 'Apply Bambu lubricating oil to the carbon rods on X and Y axes using a lint-free cloth. Run axes to distribute evenly. Do not use grease on carbon rods.',
    applicable: ['bambu'],
  },
  {
    brand: 'bambu', task: 'Lubricate Z-axis lead screw',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Apply Bambu lubricating grease to the Z-axis lead screw. Move bed to bottom, apply grease full length, run Z several times to distribute.',
    applicable: ['bambu'],
  },
  {
    brand: 'bambu', task: 'Lubricate linear rails',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Apply a small amount of Bambu grease to the X and Y linear rail carriages. Move axis back and forth to distribute. Do not over-lubricate.',
    applicable: ['bambu'],
  },
  {
    brand: 'bambu', task: 'Calibrate vibration compensation',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Run Calibration → Vibration Compensation from the printer touchscreen. Also run if you move the printer. Significantly improves print quality.',
    applicable: ['bambu'],
  },
  {
    brand: 'bambu', task: 'AMS desiccant replacement',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Open AMS lid, remove desiccant cartridge. Replace when the indicator window turns pink. Keeps moisture-sensitive filaments dry.',
    applicable: ['bambu'],
  },
  {
    brand: 'bambu', task: 'Clean AMS filament path',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Inspect AMS PTFE tubes for filament dust build-up. Use compressed air to clear. Check that filament feeds smoothly through all 4 slots.',
    applicable: ['bambu'],
  },

  // ─── Prusa MK4 / XL / Mini ───────────────────────────────────────────────
  {
    brand: 'prusa', task: 'Lubricate X/Y smooth rods',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Apply a thin film of super lube or PTFE grease to the smooth rods. Move axis back and forth to distribute. The MK4 uses linear rails — apply grease to rail with a cloth.',
    applicable: ['prusa'],
  },
  {
    brand: 'prusa', task: 'Lubricate Z-axis lead screws',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Apply a small amount of grease to both Z lead screws. Avoid applying too much — excess attracts dust. Prusa recommends Prusa-branded lubricant.',
    applicable: ['prusa'],
  },
  {
    brand: 'prusa', task: 'First Layer Calibration',
    interval_days: 30, interval_label: 'Monthly or when adhesion changes',
    instructions: 'Run first layer calibration from the LCD menu. Adjust Live Adjust Z until the first layer squishes slightly into the sheet. This is the single most impactful quality setting.',
    applicable: ['prusa'],
  },
  {
    brand: 'prusa', task: 'Clean SuperPINDA / load cell',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'For MK3.9: clean the SuperPINDA probe with a dry cloth. For MK4: check that the nozzle is clean before running calibration — debris on the nozzle throws off load cell readings.',
    applicable: ['prusa'],
  },
  {
    brand: 'prusa', task: 'Inspect MMU3 selector and idler',
    interval_days: 30, interval_label: 'Monthly (if MMU3 installed)',
    instructions: 'Check that the MMU3 selector moves freely and that the idler springs are intact. Clean any filament residue from the selector with a dry brush.',
    applicable: ['prusa'],
  },

  // ─── Creality Ender / K1 / K2 ────────────────────────────────────────────
  {
    brand: 'creality', task: 'Lubricate X/Y/Z rods and lead screws',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Apply machine oil to the smooth rods, and PTFE lubricant or white lithium grease to the lead screws. The Ender 3 has 3 lead screws — lubricate all.',
    applicable: ['creality'],
  },
  {
    brand: 'creality', task: 'Level bed — tramming',
    interval_days: 14, interval_label: 'Every 2 weeks',
    instructions: 'Tram the 4 corners manually before running any auto-leveling. Use a piece of paper — adjust until you feel slight resistance. Then run ABL/CRTouch mesh.',
    applicable: ['creality'],
  },
  {
    brand: 'creality', task: 'Tighten eccentric nuts',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Check X carriage, Y bed, and Z eccentric nuts. Adjust until the wheels spin with slight resistance — too loose causes wobble, too tight causes binding.',
    applicable: ['creality'],
  },
  {
    brand: 'creality', task: 'K1 — clear filter cartridge',
    interval_days: 90, interval_label: 'Every 3 months (K1/K1 Max)',
    instructions: 'The K1 has an activated carbon air filter inside the enclosure. Replace the cartridge every 3 months or when printing with ABS/ASA regularly.',
    applicable: ['creality'],
  },

  // ─── Voron ───────────────────────────────────────────────────────────────
  {
    brand: 'voron', task: 'Lubricate linear rails (all axes)',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Disassemble each rail carriage, clean old grease with isopropyl alcohol, and repack with fresh grease (Mobilux EP2 or similar). This is critical for long-term rail life.',
    applicable: ['voron'],
  },
  {
    brand: 'voron', task: 'Check and tension A/B belts',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Measure belt tension using a Gates belt tension app or frequency method. Target ~110Hz for 2.4 and Trident. Use the built-in tensioners to adjust.',
    applicable: ['voron'],
  },
  {
    brand: 'voron', task: 'Check idler bearing condition',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Spin each idler bearing by hand. Listen for grinding or feel for roughness. Replace ABEC-1 or generic bearings with quality alternatives if worn.',
    applicable: ['voron'],
  },
  {
    brand: 'voron', task: 'Inspect toolhead wiring harness',
    interval_days: 90, interval_label: 'Every 3 months',
    instructions: 'Inspect the toolhead cable chain or umbilical for wear, pinching, or fraying. High flex wiring is consumable — replace before it fails mid-print.',
    applicable: ['voron'],
  },
  {
    brand: 'voron', task: 'Verify Z endstop or Klicky/Tap calibration',
    interval_days: 30, interval_label: 'Monthly',
    instructions: 'Run Z offset calibration if using a nozzle-based probe (Tap, Klicky). Temperature expansion affects the offset — calibrate at print temperature.',
    applicable: ['voron'],
  },
];

export function getTasksForBrands(selectedBrands = []) {
  if (!selectedBrands.length) return MAINTENANCE_CATALOGUE;
  return MAINTENANCE_CATALOGUE.filter(t =>
    t.applicable.includes('all') || selectedBrands.includes(t.brand)
  );
}

export function getBrandLabel(key) {
  return PRINTER_BRANDS.find(b => b.key === key)?.label || key;
}
