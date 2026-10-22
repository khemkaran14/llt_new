/*
 * Starter articles, added once when the blog is empty (first server start).
 * After that they live in DATA_DIR and are edited from /admin → Blog.
 * Numbers come from the site's own calculators.
 */
'use strict';

module.exports = [
  {
    slug: 'new-vs-old-tax-regime-fy-2026-27',
    title: 'New vs old tax regime for FY 2026-27: which one should you pick?',
    description: 'For most salaried people the new regime now wins. Here is the tax at ₹8 lakh to ₹30 lakh under both regimes, and the cases where the old regime still saves money.',
    category: 'tax',
    tags: ['income tax', 'new regime', 'salary'],
    publishedAt: '2026-10-05T04:30:00.000Z',
    body: `Every April your employer asks which tax regime you want. Pick the wrong one and you can lose tens of thousands of rupees a year. The good news: for FY 2026-27 the answer is simple for most people.

## The short answer

If your salary is up to **₹12.75 lakh**, the new regime means **zero income tax**. Above that, the new regime is still cheaper for most people unless they claim large deductions such as HRA and home loan interest together.

[[tool:/income-tax-calculator/]]

## New regime slabs for FY 2026-27

| Taxable income | Rate |
|---|---|
| Up to ₹4 lakh | Nil |
| ₹4–8 lakh | 5% |
| ₹8–12 lakh | 10% |
| ₹12–16 lakh | 15% |
| ₹16–20 lakh | 20% |
| ₹20–24 lakh | 25% |
| Above ₹24 lakh | 30% |

Salaried people get a **₹75,000 standard deduction**, and a rebate makes the tax zero when taxable income is ₹12 lakh or less. That's why a ₹12.75 lakh salary pays nothing. Add 4% health and education cess to the tax.

## Tax at different salaries

We worked these out with our calculator. For the old regime we assumed you use the full ₹1.5 lakh under 80C and ₹25,000 of health insurance under 80D, which is more than many people actually claim.

| Salary | New regime | Old regime (80C + 80D used) |
|---|---|---|
| ₹8 lakh | ₹0 | ₹28,600 |
| ₹12 lakh | ₹0 | ₹1,11,800 |
| ₹15 lakh | ₹97,500 | ₹2,02,800 |
| ₹20 lakh | ₹1,92,400 | ₹3,58,800 |
| ₹30 lakh | ₹4,75,800 | ₹6,70,800 |

Even with ₹1.75 lakh of deductions, the old regime costs more at every level here.

## When the old regime can still win

The old regime only makes sense when your deductions are large. Typical cases:

- You pay high rent in a metro and get a big **HRA exemption**.
- You pay **home loan interest** on a house you live in (up to ₹2 lakh is deductible in the old regime).
- You use 80C, 80D, NPS (80CCD(1B)) and HRA **all together**.

Our income tax calculator shows the exact amount of extra deductions you would need for the old regime to match the new one, so you don't have to guess.

## How to decide in two minutes

1. Open the [income tax calculator](/income-tax-calculator/).
2. Enter your salary, rent, and the deductions you actually claim.
3. It shows both regimes side by side and tells you which saves more and by how much.

> Tip: salaried people can usually switch regimes every year when filing the return, so check again each April.

*This is general information, not tax advice. For complex cases, speak to a chartered accountant.*`
  },
  {
    slug: 'sukanya-samriddhi-vs-ppf',
    title: 'Sukanya Samriddhi vs PPF: which is better for your daughter?',
    description: 'Sukanya Samriddhi pays 8.2% and PPF 7.1%, both tax-free. See how much each grows to on ₹1.5 lakh a year, and the rules that matter before you open an account.',
    category: 'savings',
    tags: ['sukanya samriddhi', 'ppf', 'small savings'],
    publishedAt: '2026-10-10T04:30:00.000Z',
    body: `If you have a daughter under 10, Sukanya Samriddhi Yojana (SSY) is one of the best safe investments in India. PPF is the other popular choice. Here is how they compare.

## Interest rates right now

For the October–December 2026 quarter, **Sukanya Samriddhi pays 8.2%** and **PPF pays 7.1%** a year. The government reviews both every quarter. Interest and maturity are **tax-free** for both.

## Side by side

| | Sukanya Samriddhi | PPF |
|---|---|---|
| Who can open | Parent of a girl under 10 | Any resident Indian |
| Yearly deposit | ₹250 to ₹1.5 lakh | ₹500 to ₹1.5 lakh |
| You deposit for | 15 years | 15 years (extendable in 5-year blocks) |
| Matures | 21 years after opening | After 15 years |
| Early money | Up to 50% after she turns 18, for education | Partial withdrawal from the 7th year |
| Rate (Oct–Dec 2026) | 8.2% | 7.1% |

## How much each can grow to

Say you put in **₹1.5 lakh every year for 15 years** (₹22.5 lakh in all):

- **Sukanya Samriddhi** at 8.2%, opened in 2026: about **₹71.8 lakh** when it matures in 2047. It keeps earning interest for 6 more years after you stop paying.
- **PPF** at 7.1% for 15 years: about **₹40.7 lakh**.

[[tool:/sukanya-samriddhi-calculator/]]

## Which should you choose?

- **For a daughter's education or marriage fund:** Sukanya Samriddhi. The higher rate and the extra 6 years of interest make a big difference.
- **For your own long-term savings or retirement:** PPF, because the money is in your name and you can extend it.
- **Both together:** you can, but the **₹1.5 lakh limit under section 80C** (old regime) is shared across all 80C investments.

## Things to know before you open SSY

- Open it at a post office or most big banks with the girl's birth certificate and the parent's ID and address proof.
- A family can open accounts for up to two daughters (more in the case of twins or triplets).
- Deposit at least ₹250 every year, or the account becomes inactive until you pay a small penalty.

[[tool:/ppf-calculator/]]

*Rates change every quarter. Our calculators always use the latest announced rate.*`
  },
  {
    slug: 'passport-and-exam-photo-size-guide',
    title: 'Passport photo and exam form photo size: the exact pixels and KB',
    description: 'Indian passport photos are 35×45 mm (630×810 pixels). Bank and SSC-type exam forms want small photos and signatures under strict KB limits. Here is how to get them right first time.',
    category: 'documents',
    tags: ['passport photo', 'exam form', 'signature'],
    publishedAt: '2026-10-15T04:30:00.000Z',
    body: `Few things are as annoying as an online form rejecting your photo for being "too large" or "wrong size". Here are the sizes that matter and a free way to hit them.

## Indian passport photo

- Size: **35 × 45 mm**
- In pixels: **630 × 810** (35×45 mm at about 457 dpi)
- File: JPG, **up to 250 KB**
- Plain white or very light background, face straight to the camera, eyes open, no cap or dark glasses

## Bank and government exam forms

Most bank exams follow the same pattern, and many other recruitment forms are similar:

| Upload | Pixels | File size |
|---|---|---|
| Photo | 200 × 230 | 20–50 KB |
| Signature | 140 × 60 | 10–20 KB |

Always check the official notification for your exam, because limits sometimes change. Our tool has presets and a custom option for any other size.

## Make one at home in a minute

1. Take a photo against a plain wall in daylight. Use the back camera, not a selfie.
2. Open the [photo and signature resizer](/passport-photo-maker/) and pick the preset.
3. Drag and zoom so your face fills the frame, then download. It automatically sets the quality so the file lands inside the KB limit.
4. For a printed passport photo, download the **4×6 print sheet** with 8 photos and get it printed at any photo shop for a few rupees.

[[tool:/passport-photo-maker/]]

## Signature tips

- Sign with a black pen on plain white paper.
- Photograph it flat, in good light.
- In the tool, choose **Signature** and keep *Clean background* ticked. It whitens the paper and darkens the ink so the scan looks crisp.

Everything happens in your browser. Your photo is never uploaded to us.`
  },
  {
    slug: 'wedding-budget-breakdown-india',
    title: 'How to split your wedding budget: a simple plan that works',
    description: 'Where the money goes in a typical Indian wedding, with a sample split of a ₹15 lakh budget across venue, catering, outfits, photos and more.',
    category: 'wedding',
    tags: ['wedding budget', 'wedding planning'],
    publishedAt: '2026-10-20T04:30:00.000Z',
    body: `Weddings go over budget for one reason: costs are added one at a time with no overall plan. Decide the split first, then book vendors to fit it.

## A sample split of ₹15 lakh

This is the starting split in our free wedding budget planner. Change the percentages to suit your family.

| Category | Share | On ₹15 lakh |
|---|---|---|
| Catering (food & drinks) | 25% | ₹3,75,000 |
| Venue | 18% | ₹2,70,000 |
| Bride's outfits & jewellery | 14% | ₹2,10,000 |
| Decoration & flowers | 8% | ₹1,20,000 |
| Photography & video | 7% | ₹1,05,000 |
| Haldi, mehendi & sangeet | 5% | ₹75,000 |
| Buffer for surprises | 5% | ₹75,000 |
| Groom's outfits | 4% | ₹60,000 |
| Invitations & return gifts | 4% | ₹60,000 |
| Travel & guest stay | 4% | ₹60,000 |
| Makeup & mehendi artists | 3% | ₹45,000 |
| Music / DJ / band | 2% | ₹30,000 |
| Pandit / ceremony | 1% | ₹15,000 |

## Five rules that keep you on budget

1. **Fix the guest list first.** Catering and venue are almost half the cost and both depend on headcount.
2. **Keep a 5% buffer** and don't spend it until the last week.
3. **Track "paid" and "still due" separately.** Advances feel small; the balance payments all land in the final fortnight.
4. **Save on invitations.** A digital invitation for WhatsApp costs a fraction of printed cards, and you can still print a few for elders.
5. **Get every vendor quote in writing**, including taxes and overtime charges.

[[tool:/wedding-budget-planner/]]

## Other free wedding tools

- [Marriage biodata maker](/biodata/) with 45 designs
- [Wedding invitation maker](/wedding-invitation-maker/) for WhatsApp and print
- [Kundli Milan](/kundli-milan/) for 36-point guna matching`
  }
];
