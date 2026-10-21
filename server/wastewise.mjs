/**
 * WasteWise AI — shared domain logic.
 * Contains: waste categories, second-life pathway metadata, demo item dataset,
 * contextual question banks, and the analysis + recommendation engines.
 *
 * IMPORTANT (Responsible AI):
 *  - All image-derived statements are AI ESTIMATES from a photo (or a demo profile).
 *  - The system never claims to have physically inspected an item.
 *  - No hazardous DIY instructions are generated for batteries, wiring, chemicals
 *    or medicines. Those route to SAFE DISPOSAL / authorised collection.
 */

export const CATEGORIES = [
  'E-waste',
  'Batteries',
  'Plastic',
  'Paper/Cardboard',
  'Glass',
  'Metal',
  'Textile',
  'Organic waste',
  'Furniture',
  'Appliances',
  'Mixed/Unknown',
]

/** The canonical second-life ladder, highest value first. */
export const LADDER = ['reuse', 'repair', 'donate', 'repurpose', 'recycle', 'disposal']

export const PATHWAYS = {
  reuse: {
    key: 'reuse',
    label: 'REUSE',
    title: 'Reuse',
    icon: 'fas fa-rotate-left',
    accent: '#0e7c5a',
    why: [
      'Based on what is visible, the item appears to still have a practical, immediate use.',
      'Reuse keeps a product in circulation for longest, avoiding the cost and emissions of making a replacement.',
    ],
    next: [
      'Clean and safely test the item, then put it back into use.',
      'Offer it to a flatmate, classmate or colleague who needs one.',
    ],
    safety: ['Check for visible wear, cracks or exposed parts before continued use.'],
    alternative: 'donate',
  },
  repair: {
    key: 'repair',
    label: 'REPAIR',
    title: 'Repair',
    icon: 'fas fa-screwdriver-wrench',
    accent: '#0f9b8e',
    why: [
      'The item looks likely repairable based on visible condition (AI estimate — not a physical inspection).',
      'Repair is usually the highest-value second-life pathway for electronics, appliances and furniture.',
    ],
    next: [
      'Confirm the fault with a simple and safe functional check.',
      'Contact a qualified repair service or a campus repair café.',
    ],
    safety: [
      'Do not attempt unsafe electrical or battery repairs yourself.',
      'If you see swelling, burn marks, exposed wiring or a chemical smell, stop and use authorised collection instead.',
    ],
    alternative: 'reuse',
  },
  donate: {
    key: 'donate',
    label: 'DONATE',
    title: 'Donate',
    icon: 'fas fa-hand-holding-heart',
    accent: '#2563eb',
    why: [
      'Another person may still get full use from this item.',
      'Donation keeps a working product in circulation and supports the local community.',
    ],
    next: [
      'Erase all personal data from any device (accounts, SIM, storage) before handing it over.',
      'Confirm with a local charity, student group or NGO that they accept this item type.',
    ],
    safety: ['Wipe personal data before donating any smart or storage device.'],
    alternative: 'reuse',
  },
  repurpose: {
    key: 'repurpose',
    label: 'REPURPOSE',
    title: 'Repurpose',
    icon: 'fas fa-shapes',
    accent: '#7c3aed',
    why: [
      'The material can be turned into something new instead of being thrown away.',
      'Repurposing avoids the energy cost of recycling when a practical, safe DIY use exists.',
    ],
    next: [
      'Pick a simple, safe project that involves no electrical, battery or chemical modification.',
      'Prepare the material safely — clean it and remove sharp edges.',
    ],
    safety: ['Never repurpose anything containing batteries, wiring or chemicals.'],
    alternative: 'recycle',
  },
  recycle: {
    key: 'recycle',
    label: 'RECYCLE',
    title: 'Recycle',
    icon: 'fas fa-recycle',
    accent: '#0e7490',
    why: [
      'Material recovery is the most responsible remaining option here.',
      'Recycling recovers valuable material and keeps it out of landfill.',
    ],
    next: [
      'Clean, empty and separate the item by material.',
      'Find your nearest authorised recycling point, campus bin or council drop-off.',
    ],
    safety: ['Never mix batteries, e-waste or chemicals into general recycling.'],
    alternative: 'repurpose',
  },
  disposal: {
    key: 'disposal',
    label: 'SAFE DISPOSAL',
    title: 'Safe disposal',
    icon: 'fas fa-shield-heart',
    accent: '#dc2626',
    why: [
      'This item carries a handling or safety risk that makes reuse, repair or donation unsuitable.',
      'Correct disposal protects people, waste workers and the environment.',
    ],
    next: [
      'Locate an authorised collection point — e-waste, hazardous waste or battery drop-off.',
      'Store the item safely (cool, dry, away from children) until you can drop it off.',
    ],
    safety: [
      'Do NOT puncture, bend, heat, disassemble or DIY-repair this item.',
      'Keep it away from flammable materials and never place it in general household waste.',
    ],
    alternative: 'recycle',
  },
}

/* ------------------------------------------------------------------ *
 * Demo item dataset — powers DEMO MODE so the hackathon demo always works.
 * ------------------------------------------------------------------ */

const ELECTRONICS_QUESTIONS = [
  {
    id: 'power',
    text: 'Does the device still turn on and work normally?',
    hint: 'AI cannot test the device — this is based on your knowledge.',
    options: [
      { label: 'Yes', value: 'yes', effects: { reuse: 30, donate: 22, repair: 6, recycle: -22, disposal: -18 } },
      { label: 'No', value: 'no', effects: { repair: 28, recycle: 12, reuse: -22, donate: -12 } },
      { label: 'Not sure', value: 'unsure', effects: { repair: 10, reuse: 2 } },
    ],
  },
  {
    id: 'repair_ok',
    text: 'Would you consider repairing it if the cost is reasonable?',
    hint: 'Repair extends product life and is often the highest-value pathway.',
    options: [
      { label: 'Yes', value: 'yes', effects: { repair: 26 } },
      { label: 'No', value: 'no', effects: { repair: -24, recycle: 14, donate: 6 } },
      { label: 'Not sure', value: 'unsure', effects: { repair: 6 } },
    ],
  },
  {
    id: 'other_user',
    text: 'Could another person still get good use from it as it is?',
    hint: 'Think about a student, a sibling or a local group.',
    options: [
      { label: 'Yes', value: 'yes', effects: { donate: 28, reuse: 16 } },
      { label: 'No', value: 'no', effects: { donate: -20, repurpose: 8 } },
      { label: 'Not sure', value: 'unsure', effects: { donate: 6 } },
    ],
  },
  {
    id: 'hazard',
    text: 'Do you see swelling, burn marks, exposed wiring, leaks or a chemical smell?',
    hint: 'Safety question — a "yes" routes this item to authorised collection.',
    safety: true,
    hazardValue: 'yes',
    options: [
      { label: 'No', value: 'no', effects: {} },
      { label: 'Yes', value: 'yes', effects: { disposal: 70, recycle: 10, reuse: -45, donate: -45, repair: -45 } },
      { label: 'Not sure', value: 'unsure', effects: { disposal: 18, repair: -12 } },
    ],
  },
]

const TEXTILE_QUESTIONS = [
  {
    id: 'wearable',
    text: 'Is it still wearable — no major holes, stains or broken zips?',
    hint: 'Visible condition only; check seams and fabric strength.',
    options: [
      { label: 'Yes', value: 'yes', effects: { reuse: 26, donate: 26, recycle: -20, repurpose: -8 } },
      { label: 'No', value: 'no', effects: { repurpose: 26, recycle: 18, reuse: -18, donate: -18 } },
      { label: 'Not sure', value: 'unsure', effects: { donate: 6, repurpose: 6 } },
    ],
  },
  {
    id: 'repair_ok',
    text: 'Could a simple repair (stitch, patch, new button) make it wearable?',
    hint: '',
    options: [
      { label: 'Yes', value: 'yes', effects: { repair: 30, reuse: 10 } },
      { label: 'No', value: 'no', effects: { repair: -22, recycle: 10, repurpose: 8 } },
      { label: 'Not sure', value: 'unsure', effects: { repair: 4 } },
    ],
  },
  {
    id: 'other_user',
    text: 'Would another person wear it as it is?',
    hint: '',
    options: [
      { label: 'Yes', value: 'yes', effects: { donate: 26, reuse: 12 } },
      { label: 'No', value: 'no', effects: { donate: -18, repurpose: 10 } },
      { label: 'Not sure', value: 'unsure', effects: { donate: 5 } },
    ],
  },
]

const FURNITURE_QUESTIONS = [
  {
    id: 'structural',
    text: 'Is it still structurally safe to use as intended?',
    hint: 'Only judge from what you can safely check — never sit on an unstable item.',
    options: [
      { label: 'Yes', value: 'yes', effects: { reuse: 28, donate: 24, recycle: -18, disposal: -12 } },
      { label: 'No', value: 'no', effects: { repair: 26, repurpose: 14, reuse: -22, donate: -18 } },
      { label: 'Not sure', value: 'unsure', effects: { repair: 8, disposal: 6 } },
    ],
  },
  {
    id: 'repair_ok',
    text: 'Would a repair (re-glue, re-screw, new part) make it usable again?',
    hint: 'Wooden furniture is often very repairable.',
    options: [
      { label: 'Yes', value: 'yes', effects: { repair: 30, repurpose: 6 } },
      { label: 'No', value: 'no', effects: { repair: -22, repurpose: 18, recycle: 12 } },
      { label: 'Not sure', value: 'unsure', effects: { repair: 5 } },
    ],
  },
  {
    id: 'other_user',
    text: 'Could someone else use it (a hostel, society or student room)?',
    hint: '',
    options: [
      { label: 'Yes', value: 'yes', effects: { donate: 26, reuse: 12 } },
      { label: 'No', value: 'no', effects: { donate: -18, repurpose: 8 } },
      { label: 'Not sure', value: 'unsure', effects: { donate: 5 } },
    ],
  },
  {
    id: 'splinters',
    text: 'Are there splinters, exposed nails/screws or broken metal parts?',
    hint: 'Safety caution — handle with gloves and stabilise before any repair. Not a disposal trigger.',
    safety: true,
    hazardValue: '__never__',
    options: [
      { label: 'No', value: 'no', effects: {} },
      { label: 'Yes', value: 'yes', effects: { repair: 4, repurpose: -6, recycle: 6 } },
      { label: 'Not sure', value: 'unsure', effects: {} },
    ],
  },
]

const BATTERY_QUESTIONS = [
  {
    id: 'swollen',
    text: 'Is the battery swollen, punctured, leaking, hot or visibly damaged?',
    hint: 'Damaged lithium batteries are a fire and chemical hazard.',
    safety: true,
    hazardValue: 'yes',
    options: [
      { label: 'Yes', value: 'yes', effects: { disposal: 90, recycle: 8, reuse: -60, repair: -60, donate: -60 } },
      { label: 'No', value: 'no', effects: { recycle: 16, disposal: 6 } },
      { label: 'Not sure', value: 'unsure', effects: { disposal: 30, recycle: 8 } },
    ],
  },
  {
    id: 'device_ok',
    text: 'Is the device it came from otherwise still working and worth keeping?',
    hint: 'If yes, a professional battery replacement may be viable.',
    options: [
      { label: 'Yes', value: 'yes', effects: { repair: 34, reuse: 10 } },
      { label: 'No', value: 'no', effects: { repair: -18, recycle: 14 } },
      { label: 'Not sure', value: 'unsure', effects: { repair: 4 } },
    ],
  },
  {
    id: 'receiving',
    text: 'Would you hand this in at an authorised battery collection point?',
    hint: 'Phone shops, campus e-waste bins and municipal drop-offs usually accept them.',
    options: [
      { label: 'Yes', value: 'yes', effects: { recycle: 26, disposal: 10 } },
      { label: 'No', value: 'no', effects: { recycle: -12 } },
      { label: 'Not sure', value: 'unsure', effects: {} },
    ],
  },
]

const PLASTIC_QUESTIONS = [
  {
    id: 'clean',
    text: 'Is it clean, empty and free of food or chemical residue?',
    hint: 'Contaminated plastic usually cannot be recycled.',
    options: [
      { label: 'Yes', value: 'yes', effects: { recycle: 28, repurpose: 10 } },
      { label: 'No', value: 'no', effects: { recycle: -26, disposal: 18 } },
      { label: 'Not sure', value: 'unsure', effects: { recycle: -6 } },
    ],
  },
  {
    id: 'durable',
    text: 'Is it a sturdy container you or someone else could genuinely reuse?',
    hint: '',
    options: [
      { label: 'Yes', value: 'yes', effects: { reuse: 30, repurpose: 12 } },
      { label: 'No', value: 'no', effects: { reuse: -20, recycle: 10 } },
      { label: 'Not sure', value: 'unsure', effects: { reuse: 4 } },
    ],
  },
  {
    id: 'single_use',
    text: 'Is it a single-use bottle or packaging item?',
    hint: '',
    options: [
      { label: 'Yes', value: 'yes', effects: { repurpose: 16, recycle: 16, reuse: -14 } },
      { label: 'No', value: 'no', effects: { reuse: 12 } },
      { label: 'Not sure', value: 'unsure', effects: {} },
    ],
  },
]

const GLASS_QUESTIONS = [
  {
    id: 'intact',
    text: 'Is the glass intact — not cracked, chipped or broken?',
    hint: 'Broken glass is a handling risk — wrap it safely before disposal.',
    safety: true,
    hazardValue: 'no',
    options: [
      { label: 'Yes', value: 'yes', effects: { reuse: 26, recycle: 22, repurpose: 14 } },
      { label: 'No', value: 'no', effects: { disposal: 34, recycle: 4, reuse: -30, repurpose: -20 } },
      { label: 'Not sure', value: 'unsure', effects: { disposal: 12 } },
    ],
  },
  {
    id: 'container',
    text: 'Could it be reused as a container, jar, vase or storage?',
    hint: '',
    options: [
      { label: 'Yes', value: 'yes', effects: { reuse: 26, repurpose: 18 } },
      { label: 'No', value: 'no', effects: { reuse: -16, recycle: 12 } },
      { label: 'Not sure', value: 'unsure', effects: { repurpose: 4 } },
    ],
  },
]

const PAPER_QUESTIONS = [
  {
    id: 'clean_dry',
    text: 'Is the paper/cardboard clean, dry and free of food or grease?',
    hint: 'Greasy or wet card is not recyclable.',
    options: [
      { label: 'Yes', value: 'yes', effects: { recycle: 34, repurpose: 12 } },
      { label: 'No', value: 'no', effects: { recycle: -30, disposal: 20, repurpose: 8 } },
      { label: 'Not sure', value: 'unsure', effects: { recycle: -6 } },
    ],
  },
  {
    id: 'blank',
    text: 'Is there still usable blank side or re-writable space?',
    hint: 'Scrap paper is a genuine reuse pathway.',
    options: [
      { label: 'Yes', value: 'yes', effects: { reuse: 30, repurpose: 10 } },
      { label: 'No', value: 'no', effects: { recycle: 10 } },
      { label: 'Not sure', value: 'unsure', effects: {} },
    ],
  },
]

const ORGANIC_QUESTIONS = [
  {
    id: 'compost',
    text: 'Could this be composted at home or in a campus/society compost?',
    hint: 'Food scraps and garden waste are ideal for composting.',
    options: [
      { label: 'Yes', value: 'yes', effects: { repurpose: 40, recycle: 20 } },
      { label: 'No', value: 'no', effects: { repurpose: -18, disposal: 16 } },
      { label: 'Not sure', value: 'unsure', effects: { repurpose: 6 } },
    ],
  },
  {
    id: 'edible',
    text: 'Is it still edible and safe to share (unopened, in date)?',
    hint: 'Only share food you would eat yourself.',
    safety: true,
    hazardValue: '__never__',
    options: [
      { label: 'Yes', value: 'yes', effects: { donate: 34, reuse: 14 } },
      { label: 'No', value: 'no', effects: { donate: -22, repurpose: 14 } },
      { label: 'Not sure', value: 'unsure', effects: { donate: -8 } },
    ],
  },
]

const METAL_QUESTIONS = [
  {
    id: 'clean_metal',
    text: 'Is it mostly one clean metal with no mixed materials or residue?',
    hint: 'Mixed metal is harder to recycle.',
    options: [
      { label: 'Yes', value: 'yes', effects: { recycle: 32, repurpose: 10 } },
      { label: 'No', value: 'no', effects: { recycle: -14, repurpose: 12 } },
      { label: 'Not sure', value: 'unsure', effects: { recycle: 4 } },
    ],
  },
  {
    id: 'reusable_metal',
    text: 'Could the item still be used as-is (container, tool, frame)?',
    hint: '',
    options: [
      { label: 'Yes', value: 'yes', effects: { reuse: 28, repurpose: 14 } },
      { label: 'No', value: 'no', effects: { reuse: -14, recycle: 14 } },
      { label: 'Not sure', value: 'unsure', effects: { reuse: 4 } },
    ],
  },
]

const GENERIC_QUESTIONS = [
  {
    id: 'other_user',
    text: 'Do you think another person could still use this item?',
    hint: '',
    options: [
      { label: 'Yes', value: 'yes', effects: { donate: 26, reuse: 20 } },
      { label: 'No', value: 'no', effects: { donate: -18, recycle: 8 } },
      { label: 'Not sure', value: 'unsure', effects: { donate: 4 } },
    ],
  },
  {
    id: 'repairable',
    text: 'Could it be repaired or repurposed with a simple, safe fix?',
    hint: '',
    options: [
      { label: 'Yes', value: 'yes', effects: { repair: 24, repurpose: 22 } },
      { label: 'No', value: 'no', effects: { repair: -18, recycle: 14 } },
      { label: 'Not sure', value: 'unsure', effects: { repair: 4, repurpose: 4 } },
    ],
  },
  {
    id: 'hazard',
    text: 'Do you see leaks, sharp edges, batteries, wiring or an unusual smell?',
    hint: 'Safety question — a "yes" routes this item to authorised collection.',
    safety: true,
    hazardValue: 'yes',
    options: [
      { label: 'No', value: 'no', effects: {} },
      { label: 'Yes', value: 'yes', effects: { disposal: 50, recycle: 6, reuse: -30, donate: -30 } },
      { label: 'Not sure', value: 'unsure', effects: { disposal: 14 } },
    ],
  },
]

const QUESTION_BANKS = {
  electronics: ELECTRONICS_QUESTIONS,
  textile: TEXTILE_QUESTIONS,
  furniture: FURNITURE_QUESTIONS,
  battery: BATTERY_QUESTIONS,
  plastic: PLASTIC_QUESTIONS,
  glass: GLASS_QUESTIONS,
  paper: PAPER_QUESTIONS,
  organic: ORGANIC_QUESTIONS,
  metal: METAL_QUESTIONS,
  generic: GENERIC_QUESTIONS,
}

export const DEMO_ITEMS = [
  {
    id: 'laptop',
    label: 'Old Laptop',
    sampleIcon: 'fas fa-laptop',
    bank: 'electronics',
    detectedItem: 'Laptop computer',
    category: 'E-waste',
    condition: 'Used — visible hinge scuffs and worn palm rest (visual assessment only)',
    confidence: 94,
    recommendedPath: 'CHECK REUSE / REPAIR FIRST',
    summary:
      'A laptop is high-value e-waste. Even an older machine usually has a working second life or repairable parts before recycling is appropriate.',
    safety: {
      level: 'caution',
      title: 'Handle with care',
      body: 'Back up and wipe personal data before passing this device on. Never open a sealed battery pack or attempt repairs on a swollen battery.',
    },
    signals: { reuse: 74, repair: 80, donate: 68, repurpose: 32, recycle: 28, disposal: 10 },
    materials: ['Aluminium chassis', 'Lithium-ion battery', 'Circuit boards', 'Glass/LCD panel'],
  },
  {
    id: 'bottle',
    label: 'Plastic Bottle',
    sampleIcon: 'fas fa-bottle-water',
    bank: 'plastic',
    detectedItem: 'PET plastic bottle',
    category: 'Plastic',
    condition: 'Empty bottle with light surface scratches (visual assessment only)',
    confidence: 96,
    recommendedPath: 'RINSE → REPURPOSE / RECYCLE',
    summary:
      'A single-use PET bottle is a material-recovery item. If it is clean there is a genuine recycling path, and a quick repurpose use can extend it first.',
    safety: {
      level: 'info',
      title: 'Rinse before recycling',
      body: 'Empty and rinse the bottle. Contaminated plastic is usually rejected at recycling facilities.',
    },
    signals: { reuse: 46, repair: 4, donate: 6, repurpose: 76, recycle: 84, disposal: 12 },
    materials: ['PET plastic', 'HDPE cap', 'Paper label'],
  },
  {
    id: 'tshirt',
    label: 'Old Clothes',
    sampleIcon: 'fas fa-shirt',
    bank: 'textile',
    detectedItem: 'Cotton t-shirt / clothing',
    category: 'Textile',
    condition: 'Fabric intact, mild fading visible (visual assessment only)',
    confidence: 92,
    recommendedPath: 'CHECK WEARABILITY → DONATE / REPURPOSE',
    summary:
      'Textiles have strong second-life options: wearable clothing can be donated, and unwearable fabric becomes wipers, patches or craft material.',
    safety: { level: 'info', title: 'Wash before passing on', body: 'Launder or clean items before donating them to someone else.' },
    signals: { reuse: 66, repair: 46, donate: 84, repurpose: 72, recycle: 34, disposal: 14 },
    materials: ['Cotton fibre', 'Polyester thread'],
  },
  {
    id: 'chair',
    label: 'Broken Chair',
    sampleIcon: 'fas fa-chair',
    bank: 'furniture',
    detectedItem: 'Wooden chair (damaged joint)',
    category: 'Furniture',
    condition: 'Visible loose/ cracked joint, frame otherwise present (visual assessment only)',
    confidence: 89,
    recommendedPath: 'REPAIR FIRST — DO NOT DISCARD',
    summary:
      'Solid-wood furniture is one of the most repairable categories. A joint repair typically restores full use, which beats both donation and recycling.',
    safety: {
      level: 'caution',
      title: 'Stability warning',
      body: 'Do not sit on an unstable chair. Watch for splinters and exposed screws or nails while handling.',
    },
    signals: { reuse: 42, repair: 84, donate: 38, repurpose: 58, recycle: 32, disposal: 26 },
    materials: ['Solid wood', 'Metal fixings', 'Adhesive/glue'],
  },
  {
    id: 'battery',
    label: 'Phone Battery',
    sampleIcon: 'fas fa-battery-quarter',
    bank: 'battery',
    detectedItem: 'Lithium-ion phone battery',
    category: 'Batteries',
    condition: 'Used battery, casing intact from the photo (cannot assess internal state)',
    confidence: 91,
    recommendedPath: 'SAFETY FIRST → AUTHORISED BATTERY COLLECTION',
    summary:
      'Batteries are a safety-critical stream. They are never general waste and never a DIY project — the correct pathway is authorised collection.',
    safety: {
      level: 'danger',
      title: 'Fire and chemical hazard',
      body:
        'Do NOT puncture, bend, heat, disassemble or DIY-repair a battery. If it is swollen, leaking or hot, keep it away from flammable materials and hand it to an authorised collection point. Never put it in household waste.',
    },
    signals: { reuse: 4, repair: 12, donate: 2, repurpose: 4, recycle: 62, disposal: 92 },
    materials: ['Lithium-ion cells', 'Aluminium/plastic casing', 'Electrolyte (sealed)'],
  },
  {
    id: 'phone',
    label: 'Old Phone',
    sampleIcon: 'fas fa-mobile-screen-button',
    bank: 'electronics',
    detectedItem: 'Smartphone',
    category: 'E-waste',
    condition: 'Screen intact, visible edge wear (visual assessment only)',
    confidence: 93,
    recommendedPath: 'CHECK REUSE / REPAIR / DONATE',
    summary:
      'Working smartphones hold real value second-hand. Even damaged ones are strong candidates for repair or authorised e-waste recycling.',
    safety: {
      level: 'caution',
      title: 'Protect your data',
      body: 'Sign out of accounts, remove the SIM/memory card and factory-reset the phone before donating or selling it.',
    },
    signals: { reuse: 76, repair: 70, donate: 80, repurpose: 38, recycle: 34, disposal: 12 },
    materials: ['Glass display', 'Aluminium frame', 'Lithium-ion battery', 'Rare-earth metals'],
  },
]

const GENERIC_ITEM = {
  id: 'unknown',
  label: 'Uploaded item',
  sampleIcon: 'fas fa-circle-question',
  bank: 'generic',
  detectedItem: 'Unrecognised household item',
  category: 'Mixed/Unknown',
  condition: 'Visible condition assessment limited — image quality or angle restricted analysis',
  confidence: 58,
  recommendedPath: 'VERIFY ITEM → CHOOSE LOWEST-RISK PATHWAY',
  summary:
    'The photo did not match a confident category. Answer a few quick questions and WasteWise AI will still build a safe recommendation.',
  safety: {
    level: 'caution',
    title: 'Verify before acting',
    body: 'Treat the detected category as an AI estimate. Confirm the item type locally, and if it contains a battery, wiring or chemicals, use authorised collection.',
  },
  signals: { reuse: 44, repair: 42, donate: 40, repurpose: 48, recycle: 46, disposal: 34 },
  materials: ['Unknown — verify locally'],
}

/** Keyword hints so an uploaded file name can map onto a demo profile. */
const KEYWORD_MAP = [
  { keys: ['laptop', 'macbook', 'notebook', 'thinkpad'], id: 'laptop' },
  { keys: ['bottle', 'pet', 'flask', 'water'], id: 'bottle' },
  { keys: ['shirt', 'tshirt', 't-shirt', 'cloth', 'clothes', 'jeans', 'textile'], id: 'tshirt' },
  { keys: ['chair', 'stool', 'furniture', 'table', 'desk'], id: 'chair' },
  { keys: ['battery', 'cell', 'powerbank', 'power bank'], id: 'battery' },
  { keys: ['phone', 'mobile', 'smartphone', 'iphone', 'android'], id: 'phone' },
]

export function findItem(id) {
  if (!id) return null
  return DEMO_ITEMS.find((i) => i.id === id) || null
}

export function matchByKeyword(text = '') {
  const t = String(text).toLowerCase()
  for (const entry of KEYWORD_MAP) {
    if (entry.keys.some((k) => t.includes(k))) return findItem(entry.id)
  }
  return null
}

export function questionsFor(bankKey) {
  return QUESTION_BANKS[bankKey] || GENERIC_QUESTIONS
}

/* ------------------------------------------------------------------ *
 * Analysis engine (DEMO MODE profile lookup)
 * ------------------------------------------------------------------ */

export function analyze({ itemId, fileName, source } = {}) {
  const byId = findItem(itemId)
  const byName = byId || matchByKeyword(fileName || '')
  const item = byName || GENERIC_ITEM
  const matched = Boolean(byName)

  return {
    ok: true,
    mode: source === 'vision' ? 'vision' : 'demo',
    matched,
    itemId: matched ? item.id : null,
    detectedItem: item.detectedItem,
    category: item.category,
    condition: item.condition,
    confidence: item.confidence,
    recommendedPath: item.recommendedPath,
    summary: item.summary,
    safety: item.safety,
    materials: item.materials,
    ladder: LADDER,
    signals: item.signals,
    questions: questionsFor(item.bank),
    estimateNotice:
      'AI estimate from a photo or demo profile — this is not a physical inspection. Hidden damage, exact material composition, true repairability and local recyclability cannot be determined from an image.',
  }
}

/* ------------------------------------------------------------------ *
 * Second-Life Engine — turns base signals + user answers into a pathway
 * ------------------------------------------------------------------ */

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function recommend({ itemId, answers = {}, signals = null } = {}) {
  const item = findItem(itemId)
  const base = signals || (item ? item.signals : GENERIC_ITEM.signals)
  const bank = item ? item.bank : 'generic'
  const questions = questionsFor(bank)

  const scores = {}
  for (const key of LADDER) scores[key] = (base[key] ?? 0)

  const applied = []
  let safetyFlag = false

  for (const q of questions) {
    const chosen = answers[q.id]
    if (!chosen) continue
    const opt = q.options.find((o) => o.value === chosen)
    if (!opt) continue
    applied.push({ question: q.text, answer: opt.label })
    for (const [k, v] of Object.entries(opt.effects || {})) {
      if (k in scores) scores[k] += v
    }
    if (q.safety && chosen === (q.hazardValue || 'yes')) safetyFlag = true
  }

  for (const key of LADDER) scores[key] = clamp(scores[key])

  // Safety override: a hazardous answer (damaged battery, leaks, swelling,
  // exposed wiring) must outrank every other pathway. We re-score so that
  // SAFE DISPOSAL is strictly the highest, and cap the rest below it.
  if (safetyFlag) {
    const others = LADDER.filter((k) => k !== 'disposal')
    const maxOther = Math.max(...others.map((k) => scores[k]))
    others.forEach((k) => {
      scores[k] = clamp(Math.min(scores[k], 74))
    })
    scores.disposal = clamp(Math.max(maxOther + 12, 88))
  }

  const ranked = LADDER.map((key) => ({ key, score: scores[key] })).sort((a, b) => b.score - a.score)
  const top = ranked[0]

  const margin = top.score - (ranked[1]?.score ?? 0)
  const itemConfidence = item ? item.confidence : GENERIC_ITEM.confidence
  let confidence = clamp(Math.round(itemConfidence * 0.55 + margin * 0.55 + 24), 55, 97)
  if (!item) confidence = clamp(confidence - 10, 50, 90)

  const meta = PATHWAYS[top.key]
  const answered = applied.length

  return {
    ok: true,
    pathway: top.key,
    title: meta.title,
    label: meta.label,
    icon: meta.icon,
    accent: meta.accent,
    why: meta.why,
    next: meta.next,
    safety: [...(item && top.key === 'disposal' && item.safety ? [item.safety.body] : []), ...meta.safety],
    alternateKey: meta.alternative,
    alternateTitle: PATHWAYS[meta.alternative].title,
    alternateWhy: PATHWAYS[meta.alternative].why[0],
    scores,
    ranked,
    confidence,
    answered,
    safetyFlag,
    inputs: applied,
    notice: 'Recommendation is an AI estimate based on your answers. Verify locally before acting.',
    legend: LADDER.map((k) => ({ key: k, label: PATHWAYS[k].label, accent: PATHWAYS[k].accent })),
  }
}

export const DEMO_HISTORY_SEED = [
  { itemLabel: 'Old Laptop', category: 'E-waste', pathway: 'repair', action: 'Marked as Repaired', daysAgo: 21, demo: true },
  { itemLabel: 'Smartphone', category: 'E-waste', pathway: 'donate', action: 'Marked as Donated', daysAgo: 19, demo: true },
  { itemLabel: 'Cotton T-shirts', category: 'Textile', pathway: 'donate', action: 'Marked as Donated', daysAgo: 17, demo: true },
  { itemLabel: 'Plastic Bottles', category: 'Plastic', pathway: 'recycle', action: 'Marked as Recycled', daysAgo: 15, demo: true },
  { itemLabel: 'Wooden Chair', category: 'Furniture', pathway: 'repair', action: 'Marked as Repaired', daysAgo: 13, demo: true },
  { itemLabel: 'Glass Jars', category: 'Glass', pathway: 'reuse', action: 'Marked as Reused', daysAgo: 12, demo: true },
  { itemLabel: 'Cardboard Boxes', category: 'Paper/Cardboard', pathway: 'recycle', action: 'Marked as Recycled', daysAgo: 10, demo: true },
  { itemLabel: 'Phone Battery', category: 'Batteries', pathway: 'disposal', action: 'Sent to authorised collection', daysAgo: 9, demo: true },
  { itemLabel: 'Bedside Table', category: 'Furniture', pathway: 'reuse', action: 'Marked as Reused', daysAgo: 7, demo: true },
  { itemLabel: 'Table Lamp', category: 'Appliances', pathway: 'repair', action: 'Marked as Repaired', daysAgo: 5, demo: true },
  { itemLabel: 'Denim Jeans', category: 'Textile', pathway: 'repurpose', action: 'Repurposed as rags/patches', daysAgo: 3, demo: true },
  { itemLabel: 'Mixed unknown item', category: 'Mixed/Unknown', pathway: null, action: 'Analysed — no action yet', daysAgo: 1, demo: true },
]

export const CAMPUS_DEMO = {
  org: 'WasteWise Campus · Riverside Institute of Technology',
  participating: 248,
  itemsAnalyzed: 1372,
  reuse: 486,
  repair: 231,
  donate: 402,
  recycle: 358,
  disposal: 61,
  teams: [
    { rank: 1, name: 'Circular Champions', team: 'Department of Environmental Engineering', items: 231, reuse: 96, repair: 44, donate: 58, recycle: 51, circulation: 94, badge: 'fas fa-trophy' },
    { rank: 2, name: 'Green Squad', team: 'Hostel Block C', items: 208, reuse: 81, repair: 39, donate: 55, recycle: 47, circulation: 89, badge: 'fas fa-medal' },
    { rank: 3, name: 'Eco Explorer', team: 'First-year students', items: 187, reuse: 70, repair: 31, donate: 52, recycle: 44, circulation: 84, badge: 'fas fa-award' },
    { rank: 4, name: 'Repair Café Club', team: 'Makerspace Society', items: 164, reuse: 52, repair: 71, donate: 30, recycle: 28, circulation: 82, badge: 'fas fa-screwdriver-wrench' },
    { rank: 5, name: 'Zero Waste Warriors', team: 'School of Design', items: 143, reuse: 58, repair: 18, donate: 44, recycle: 39, circulation: 78, badge: 'fas fa-leaf' },
    { rank: 6, name: 'Society Green Cell', team: 'Campus Housing Society', items: 121, reuse: 44, repair: 21, donate: 38, recycle: 33, circulation: 74, badge: 'fas fa-seedling' },
  ],
}

export function campusData() {
  const c = CAMPUS_DEMO
  const totalActions = c.reuse + c.repair + c.donate + c.recycle + c.disposal
  const circular = c.reuse + c.repair + c.donate
  return {
    ...c,
    note: 'Demonstration data — these figures are illustrative and are not measured campus results.',
    totalActions,
    circulationRate: Math.round((circular / Math.max(totalActions, 1)) * 100),
    perStudent: +(c.itemsAnalyzed / Math.max(c.participating, 1)).toFixed(1),
  }
}
