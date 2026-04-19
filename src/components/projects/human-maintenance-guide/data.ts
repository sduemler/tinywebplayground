export interface MaintenanceItem {
  task: string;
  interval: string;
  intervalDays: number;
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  items: MaintenanceItem[];
}

export function getBarWidth(item: MaintenanceItem, items: MaintenanceItem[]): number {
  const logMin = Math.log(Math.min(...items.map((i) => i.intervalDays)) + 1);
  const logMax = Math.log(Math.max(...items.map((i) => i.intervalDays)) + 1);
  if (logMax === logMin) return 50;
  const normalized = (Math.log(item.intervalDays + 1) - logMin) / (logMax - logMin);
  return Math.round(8 + normalized * 87);
}

export const CATEGORIES: Category[] = [
  {
    id: "health",
    name: "Health",
    emoji: "🩺",
    items: [
      { task: "Brush teeth", interval: "2x daily", intervalDays: 0.5 },
      { task: "Floss", interval: "Daily", intervalDays: 1 },
      { task: "Self breast/testicular exam", interval: "Monthly", intervalDays: 30 },
      { task: "Check moles for changes", interval: "Monthly", intervalDays: 30 },
      { task: "Dental cleaning", interval: "Every 6 months", intervalDays: 180 },
      { task: "Blood pressure check", interval: "Every 6–12 months", intervalDays: 270 },
      { task: "Blood work/labs", interval: "Annually", intervalDays: 365 },
      { task: "Physical/wellness checkup", interval: "Annually", intervalDays: 365 },
      { task: "Flu shot", interval: "Annually", intervalDays: 365 },
      { task: "Skin cancer screening (dermatologist)", interval: "Annually", intervalDays: 365 },
      { task: "Eye exam", interval: "Every 1–2 years", intervalDays: 548 },
      { task: "Dental X-rays", interval: "Every 1–2 years", intervalDays: 548 },
      { task: "Mammogram (40+)", interval: "Every 1–2 years", intervalDays: 548 },
      { task: "Bone density scan (65+)", interval: "Every 2 years", intervalDays: 730 },
      { task: "Pap smear", interval: "Every 3 years", intervalDays: 1095 },
      { task: "Cholesterol check", interval: "Every 4–6 years", intervalDays: 1825 },
      { task: "Colonoscopy (45+)", interval: "Every 10 years", intervalDays: 3650 },
      { task: "Tetanus booster", interval: "Every 10 years", intervalDays: 3650 },
      { task: "Colorectal cancer screening", interval: "Every 10 years", intervalDays: 3650 },
      { task: "Shingles vaccine (50+)", interval: "Once at age 50+", intervalDays: 18250 },
    ],
  },
  {
    id: "home",
    name: "Home",
    emoji: "🏠",
    items: [
      { task: "Clean dryer lint trap", interval: "After every load", intervalDays: 1 },
      { task: "Test smoke/CO detectors", interval: "Monthly", intervalDays: 30 },
      { task: "Clean garbage disposal", interval: "Monthly", intervalDays: 30 },
      { task: "Wash shower curtain/liner", interval: "Monthly", intervalDays: 30 },
      { task: "Replace HVAC filter", interval: "Every 1–3 months", intervalDays: 60 },
      { task: "Deep clean oven", interval: "Every 3–6 months", intervalDays: 120 },
      { task: "Clean refrigerator coils", interval: "Every 6 months", intervalDays: 180 },
      { task: "Clean gutters", interval: "Twice a year", intervalDays: 180 },
      { task: "Chimney inspection/cleaning", interval: "Annually", intervalDays: 365 },
      { task: "Check fire extinguisher", interval: "Annually", intervalDays: 365 },
      { task: "Flush water heater", interval: "Annually", intervalDays: 365 },
      { task: "Inspect roof", interval: "Every 2–3 years", intervalDays: 912 },
      { task: "Caulk windows, tub & shower", interval: "Every 5 years", intervalDays: 1825 },
      { task: "Paint exterior", interval: "Every 5–10 years", intervalDays: 2737 },
      { task: "Replace mattress", interval: "Every 7–10 years", intervalDays: 3012 },
      { task: "Replace smoke detectors", interval: "Every 10 years", intervalDays: 3650 },
      { task: "Replace water heater", interval: "Every 8–12 years", intervalDays: 3650 },
      { task: "Replace major appliances", interval: "Every 10–15 years", intervalDays: 4562 },
      { task: "Replace HVAC system", interval: "Every 15–20 years", intervalDays: 6387 },
      { task: "Replace roof", interval: "Every 20–30 years", intervalDays: 9125 },
    ],
  },
  {
    id: "car",
    name: "Car",
    emoji: "🚗",
    items: [
      { task: "Wash car", interval: "Every 2 weeks", intervalDays: 14 },
      { task: "Check tire pressure", interval: "Monthly", intervalDays: 30 },
      { task: "Check fluid levels", interval: "Monthly", intervalDays: 30 },
      { task: "Oil change", interval: "Every 5,000–7,500 miles", intervalDays: 122 },
      { task: "Rotate tires", interval: "Every 5,000–7,500 miles", intervalDays: 122 },
      { task: "Alignment check", interval: "Every 6,000 miles or annually", intervalDays: 146 },
      { task: "Detail (interior + exterior)", interval: "Twice a year", intervalDays: 180 },
      { task: "Replace wiper blades", interval: "Every 6–12 months", intervalDays: 270 },
      { task: "Replace cabin air filter", interval: "Every 15,000–25,000 miles", intervalDays: 487 },
      { task: "Replace engine air filter", interval: "Every 20,000–30,000 miles", intervalDays: 609 },
      { task: "Flush brake fluid", interval: "Every 2–3 years", intervalDays: 912 },
      { task: "Replace brake pads", interval: "Every 25,000–65,000 miles", intervalDays: 1095 },
      { task: "Flush coolant", interval: "Every 30,000 miles / 2–5 years", intervalDays: 1095 },
      { task: "Inspect shocks/struts", interval: "Every 50,000 miles", intervalDays: 1217 },
      { task: "New tires", interval: "Every 25,000–50,000 miles", intervalDays: 1217 },
      { task: "Replace battery", interval: "Every 3–5 years", intervalDays: 1460 },
      { task: "Replace transmission fluid", interval: "Every 30,000–60,000 miles", intervalDays: 1460 },
      { task: "Replace spark plugs", interval: "Every 30,000–100,000 miles", intervalDays: 1825 },
      { task: "Replace serpentine belt", interval: "Every 50,000–100,000 miles", intervalDays: 2433 },
      { task: "Replace timing belt", interval: "Every 60,000–100,000 miles", intervalDays: 2433 },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    emoji: "💰",
    items: [
      { task: "Check bank account balance", interval: "Weekly", intervalDays: 7 },
      { task: "Pay credit card bill", interval: "Monthly", intervalDays: 30 },
      { task: "Review subscriptions", interval: "Monthly", intervalDays: 30 },
      { task: "Review/update budget", interval: "Monthly", intervalDays: 30 },
      { task: "Review investment accounts", interval: "Quarterly", intervalDays: 90 },
      { task: "Check credit score", interval: "Every 3–4 months", intervalDays: 105 },
      { task: "File taxes", interval: "Annually", intervalDays: 365 },
      { task: "Review insurance coverage", interval: "Annually", intervalDays: 365 },
      { task: "Review emergency fund adequacy", interval: "Annually", intervalDays: 365 },
      { task: "Calculate net worth", interval: "Annually", intervalDays: 365 },
      { task: "Review social security statement", interval: "Annually", intervalDays: 365 },
      { task: "Rebalance investment portfolio", interval: "Annually", intervalDays: 365 },
      { task: "Negotiate service rates (internet, phone)", interval: "Every 1–2 years", intervalDays: 548 },
      { task: "Shred/purge sensitive documents", interval: "Every 1–3 years", intervalDays: 730 },
      { task: "Check for unclaimed property", interval: "Every few years", intervalDays: 1095 },
      { task: "Update beneficiaries", interval: "Every 3–5 years", intervalDays: 1460 },
      { task: "Update estate plan/will", interval: "Every 3–5 years", intervalDays: 1460 },
      { task: "Review life insurance needs", interval: "Every 5 years", intervalDays: 1825 },
      { task: "Long-term care planning review", interval: "Every 5 years", intervalDays: 1825 },
      { task: "Review financial power of attorney", interval: "Every 5–10 years", intervalDays: 2737 },
    ],
  },
  {
    id: "personal-care",
    name: "Personal Care",
    emoji: "✨",
    items: [
      { task: "Exfoliate skin", interval: "2–3x per week", intervalDays: 3 },
      { task: "Clean makeup brushes", interval: "Weekly", intervalDays: 7 },
      { task: "Wash pillowcase", interval: "Weekly", intervalDays: 7 },
      { task: "Replace razor blades", interval: "Every 1–2 weeks", intervalDays: 10 },
      { task: "Wash bedsheets", interval: "Every 1–2 weeks", intervalDays: 10 },
      { task: "Clip fingernails", interval: "Every 1–2 weeks", intervalDays: 10 },
      { task: "Clip toenails", interval: "Every 2–4 weeks", intervalDays: 21 },
      { task: "Replace loofa/shower puff", interval: "Every 3–4 weeks", intervalDays: 25 },
      { task: "Deep condition hair", interval: "Monthly", intervalDays: 30 },
      { task: "Haircut", interval: "Every 4–8 weeks", intervalDays: 42 },
      { task: "Replace contact lens case", interval: "Every 3 months", intervalDays: 90 },
      { task: "Replace mascara", interval: "Every 3 months", intervalDays: 90 },
      { task: "Replace toothbrush", interval: "Every 3–4 months", intervalDays: 105 },
      { task: "Replace running shoes", interval: "Every ~6 months (300–500 miles)", intervalDays: 180 },
      { task: "Wash winter coats/comforters", interval: "Every 6 months", intervalDays: 180 },
      { task: "Donate unused clothing", interval: "Annually", intervalDays: 365 },
      { task: "Update eyeglass/contact prescription", interval: "Every 1–2 years", intervalDays: 548 },
      { task: "Replace sunscreen (check expiration)", interval: "Every 1–2 years", intervalDays: 548 },
      { task: "Replace pillow", interval: "Every 1–2 years", intervalDays: 548 },
      { task: "Replace mattress", interval: "Every 7–10 years", intervalDays: 3012 },
    ],
  },
];
