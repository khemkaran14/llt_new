/*
 * The single list of every tool on the site, grouped into sections.
 * build.js uses it for the menu, homepage, section pages, breadcrumbs,
 * footer and "related tools". To add a tool: create the page, then add one line here.
 */
'use strict';

const ICONS = {
  rupee: '<path d="M7 4h10M7 8h10M7 4c4 0 6 2 6 4s-2 4-6 4l7 8"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',
  chart: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  shield: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  bars: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  doc: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  card: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M10 16h4"/>',
  star: '<path d="M12 3l2.6 5.6 6 .6-4.5 4 1.3 6L12 16.3 6.6 19.2l1.3-6-4.5-4 6-.6z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM18 18h2v2h-2z"/>',
  ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  girl: '<circle cx="12" cy="7" r="4"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/>',
  piggy: '<path d="M5 11a7 6 0 0 1 13-2h2v4h-2a7 6 0 0 1-3 4v3h-3v-2h-2v2H7v-3a6 6 0 0 1-2-6z"/><circle cx="15" cy="10" r=".8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  trend: '<path d="M3 20h18M5 16l4-4 3 3 7-8"/>',
  ring: '<circle cx="9" cy="14" r="6"/><circle cx="15" cy="14" r="6"/><path d="M12 3l-2 3h4z"/>',
  invite: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.6-2.4-2.9-5.5-3"/>'
};

const CATEGORIES = [
  { id: 'tax', name: 'Tax & Salary', short: 'Tax & Salary', path: '/tax-and-salary/', icon: 'rupee',
    intro: 'Work out your income tax under both regimes, your in-hand salary, HRA, capital gains and gratuity, with FY 2026-27 rules.' },
  { id: 'loans', name: 'Loans & Property', short: 'Loans & Property', path: '/loans-and-property/', icon: 'home',
    intro: 'Plan a loan, see how much you can borrow, decide whether to prepay, and convert land measurements used across India.' },
  { id: 'savings', name: 'Savings & Retirement', short: 'Savings', path: '/savings-and-retirement/', icon: 'chart',
    intro: 'See how SIPs, PPF, FDs, Sukanya Samriddhi, NPS and EPF grow, and plan a comfortable retirement.' },
  { id: 'wedding', name: 'Wedding', short: 'Wedding', path: '/wedding/', icon: 'heart',
    intro: 'Everything for the big day: a beautiful biodata, Kundli matching, invitation cards and a wedding budget planner.' },
  { id: 'documents', name: 'Documents & Photos', short: 'Documents', path: '/documents-and-photos/', icon: 'doc',
    intro: 'Receipts, invoices, passport and exam photos, and UPI QR standees, ready to print or upload in seconds.' }
];

// isNew marks tools to highlight; popular ones appear on the homepage first.
const TOOLS = [
  // Tax & Salary
  { path: '/income-tax-calculator/', name: 'Income Tax Calculator', cat: 'tax', icon: 'rupee', popular: true, blurb: 'New vs old regime for FY 2026-27, with HRA, 80C, 80D and home loan.' },
  { path: '/salary-calculator/', name: 'In-Hand Salary Calculator', cat: 'tax', icon: 'wallet', popular: true, blurb: 'Turn your CTC into the amount that reaches your bank each month.' },
  { path: '/hra-calculator/', name: 'HRA Calculator', cat: 'tax', icon: 'home', blurb: 'Tax-free HRA with the new 8-city rule for FY 2026-27.' },
  { path: '/capital-gains-tax-calculator/', name: 'Capital Gains Tax Calculator', cat: 'tax', icon: 'trend', isNew: true, blurb: 'Tax on selling shares and mutual funds: short or long term, with the ₹1.25 lakh exemption.' },
  { path: '/gratuity-calculator/', name: 'Gratuity Calculator', cat: 'tax', icon: 'coins', isNew: true, blurb: 'How much gratuity you get after 5+ years, and how much is tax-free.' },
  { path: '/income-tax-on-salary/', name: 'Income Tax by Salary', cat: 'tax', icon: 'list', blurb: 'Exact tax for ₹5 lakh to ₹50 lakh salaries, step by step.' },
  { path: '/gst-calculator/', name: 'GST Calculator', cat: 'tax', icon: 'receipt', blurb: 'Add or remove GST at 5%, 18% or 40%, with CGST/SGST split.' },
  { path: '/tax-calendar/', name: 'Tax Calendar 2026-27', cat: 'tax', icon: 'calendar', blurb: 'Every deadline with a countdown and phone reminders.' },
  // Loans & Property
  { path: '/emi-calculator/', name: 'EMI Calculator', cat: 'loans', icon: 'home', popular: true, blurb: 'Home, car and personal loan EMI with full schedule and prepayment savings.' },
  { path: '/home-loan-eligibility-calculator/', name: 'Home Loan Eligibility', cat: 'loans', icon: 'home', isNew: true, blurb: 'How big a loan you can get on your income, and the property budget it allows.' },
  { path: '/prepay-or-invest/', name: 'Prepay Loan or Invest?', cat: 'loans', icon: 'trend', blurb: 'Your own numbers decide which plan leaves you richer.' },
  { path: '/land-area-converter/', name: 'Land Area Converter', cat: 'loans', icon: 'ruler', isNew: true, popular: true, blurb: 'Bigha, gaj, guntha, cent, kanal, marla, acre and more, by state.' },
  { path: '/rent-receipt-generator/', name: 'Rent Receipt Generator', cat: 'loans', icon: 'receipt', blurb: 'Printable monthly rent receipts for your HRA claim.' },
  { path: '/security-deposit-receipt/', name: 'Security Deposit Receipt', cat: 'loans', icon: 'shield', blurb: 'Deposit receipt with clear refund terms for landlords and tenants.' },
  // Savings & Retirement
  { path: '/sip-calculator/', name: 'SIP Calculator', cat: 'savings', icon: 'chart', popular: true, blurb: 'Monthly SIP, step-up SIP and lumpsum growth, with a goal planner.' },
  { path: '/ppf-calculator/', name: 'PPF Calculator', cat: 'savings', icon: 'shield', blurb: 'Maturity and tax-free interest at the current 7.1% rate.' },
  { path: '/sukanya-samriddhi-calculator/', name: 'Sukanya Samriddhi Calculator', cat: 'savings', icon: 'girl', isNew: true, blurb: 'Your daughter\'s SSY maturity at 8.2%, year by year.' },
  { path: '/nps-calculator/', name: 'NPS Calculator', cat: 'savings', icon: 'sun', isNew: true, blurb: 'NPS corpus, lump sum and monthly pension at 60.' },
  { path: '/epf-calculator/', name: 'EPF Calculator', cat: 'savings', icon: 'piggy', isNew: true, blurb: 'Your PF balance at retirement at 8.25%, with salary hikes.' },
  { path: '/fd-calculator/', name: 'FD Calculator', cat: 'savings', icon: 'clock', blurb: 'Fixed deposit maturity and interest.' },
  { path: '/rd-calculator/', name: 'RD Calculator', cat: 'savings', icon: 'bars', blurb: 'Recurring deposit maturity with the bank formula.' },
  { path: '/retirement-calculator/', name: 'Retirement & FIRE Planner', cat: 'savings', icon: 'sun', isNew: true, blurb: 'How much you need to retire, and the SIP to get there.' },
  { path: '/inflation-calculator/', name: 'Inflation Calculator', cat: 'savings', icon: 'trend', isNew: true, blurb: 'What today\'s money will be worth in future, and what past money is worth now.' },
  // Wedding
  { path: '/biodata/', name: 'Marriage Biodata Maker', cat: 'wedding', icon: 'card', popular: true, blurb: '45 beautiful designs, god icons for every religion, PDF & JPG.' },
  { path: '/wedding-invitation-maker/', name: 'Wedding Invitation Maker', cat: 'wedding', icon: 'invite', isNew: true, popular: true, blurb: 'Beautiful invitation cards for WhatsApp and print.' },
  { path: '/kundli-milan/', name: 'Kundli Milan (Guna Matching)', cat: 'wedding', icon: 'star', isNew: true, blurb: '36-point Ashtakoota matching from birth details, with explanations.' },
  { path: '/wedding-budget-planner/', name: 'Wedding Budget Planner', cat: 'wedding', icon: 'ring', isNew: true, blurb: 'Plan spending by category, track what\'s paid, print or export.' },
  // Documents & Photos
  { path: '/passport-photo-maker/', name: 'Passport & Exam Photo Resizer', cat: 'documents', icon: 'camera', isNew: true, popular: true, blurb: 'Crop and resize photos and signatures to exact pixel and KB limits. Print sheets too.' },
  { path: '/upi-qr-code-generator/', name: 'UPI QR Standee Maker', cat: 'documents', icon: 'qr', isNew: true, blurb: 'Printable "Scan & Pay" QR standee for your shop.' },
  { path: '/invoice-generator/', name: 'Invoice Generator', cat: 'documents', icon: 'doc', blurb: 'GST or non-GST invoices with a UPI QR code.' },
  { path: '/quotation-generator/', name: 'Quotation Generator', cat: 'documents', icon: 'doc', blurb: 'Quotations, proforma invoices and delivery challans.' },
  { path: '/receipt-generators/', name: 'All Receipt Generators', cat: 'documents', icon: 'receipt', blurb: 'Payment, fee, deposit, maintenance and sale receipts.' },
  { path: '/payment-receipt-generator/', name: 'Payment Receipt', cat: 'documents', icon: 'receipt', blurb: 'Receipts for advances, job payments and loan repayments.' },
  { path: '/fee-receipt-generator/', name: 'Fee Receipt', cat: 'documents', icon: 'receipt', blurb: 'For tutors, coaching classes and teachers.' },
  { path: '/maintenance-receipt-generator/', name: 'Society Maintenance Receipt', cat: 'documents', icon: 'receipt', blurb: 'For housing society treasurers.' },
  { path: '/sale-receipt-generator/', name: 'Vehicle & Item Sale Receipt', cat: 'documents', icon: 'receipt', blurb: 'Record a vehicle or item sale with handover time.' }
];

module.exports = { ICONS, CATEGORIES, TOOLS };
