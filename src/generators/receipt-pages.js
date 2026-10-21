/*
 * Receipt generator pages. Each preset defines its form fields and the
 * receipt wording; assets/js/receipt-maker.js turns them into a printable receipt.
 *
 * Template syntax (see DocEngine.fill): {key} is replaced by the value,
 * and [[ ... ]] is dropped when any {key} inside it is empty.
 * Computed keys: amountFmt, amountWords, dateFmt, balanceFmt.
 */
'use strict';

const MODES = ['UPI', 'Bank transfer', 'Cash', 'Cheque', 'Card'];
const F = {
  receiptNo: { key: 'receiptNo', label: 'Receipt number', type: 'text', value: 'RCPT-001', max: 30 },
  date: { key: 'date', label: 'Date', type: 'date' },
  amount: { key: 'amount', label: 'Amount received', type: 'money' },
  mode: { key: 'mode', label: 'Paid by', type: 'select', options: MODES },
  ref: { key: 'ref', label: 'Transaction / cheque no.', type: 'text', hint: 'Optional. UPI reference, UTR or cheque number.', max: 40 }
};
const f = (key, label, extra) => Object.assign({ key, label, type: 'text', max: 100 }, extra || {});

const PRESETS = [
  {
    path: '/payment-receipt-generator/',
    name: 'Payment Receipt',
    title: 'Payment Receipt Generator – Free Money Receipt PDF | LiveLifeTricks',
    description: 'Make a payment or money receipt in seconds: amount in words, payment mode, reference number and balance due. Print or save as PDF. Free and private.',
    h1: 'Payment Receipt Generator',
    lead: 'Give a proper receipt whenever someone pays you: for an advance, a job, a sale or a loan repayment. Amount in words and payment details are filled in for you.',
    docTitle: 'PAYMENT RECEIPT',
    issuer: ['receiver', 'receiverAddress'],
    fields: [F.receiptNo, F.date, f('receiver', 'Received by (your name or business)'), f('receiverAddress', 'Your address / phone', { hint: 'Optional.', max: 160 }),
      f('payer', 'Received from'), F.amount, f('purpose', 'For', { placeholder: 'e.g. advance for interior work', max: 140 }), F.mode, F.ref,
      f('balance', 'Balance still due', { type: 'money', hint: 'Optional.' })],
    sentence: 'Received with thanks from {payer} the sum of {amountFmt} ({amountWords}) towards {purpose}, paid by {mode}[[ (ref. {ref})]].',
    extra: '[[Balance still due: {balanceFmt}]]',
    signers: [{ label: 'Received by', name: '{receiver}' }],
    content: `
  <h2>When to give a payment receipt</h2>
  <ul>
    <li>Someone pays you an advance or a deposit for work</li>
    <li>You sell something privately and get paid</li>
    <li>A friend or relative repays money you lent them</li>
    <li>Any cash payment, so both sides have proof</li>
  </ul>
  <p>A receipt protects both sides: the payer has proof they paid, and you have a record of what was received and why.</p>`,
    faqs: [
      ['Is a handwritten or self-made receipt valid?', 'Yes. A receipt is simply a signed acknowledgment that money was received. What matters is that it\'s accurate and signed by the person who received the money.'],
      ['Do I need a revenue stamp?', 'A revenue stamp is traditionally used on receipts for cash payments over ₹5,000. It isn\'t needed for UPI, bank transfers or cheques, because the bank record is proof.'],
      ['Can I record a part payment?', 'Yes. Enter the amount you received now, and the remaining amount in "Balance still due". It will show on the receipt.']
    ]
  },
  {
    path: '/fee-receipt-generator/',
    name: 'Fee Receipt',
    title: 'Fee Receipt Generator – Tuition & Coaching Fee Receipt PDF | LiveLifeTricks',
    description: 'Free fee receipt maker for tutors, coaching classes, music and dance teachers. Add student, course and period, print or save as PDF with an office copy.',
    h1: 'Fee Receipt Generator',
    lead: 'For tutors, coaching classes, and music, dance or sports teachers. Make a neat fee receipt for each student in seconds, with an office copy.',
    docTitle: 'FEE RECEIPT',
    issuer: ['institute', 'instituteAddress'],
    fields: [F.receiptNo, F.date, f('institute', 'Tutor / institute name'), f('instituteAddress', 'Address / phone', { hint: 'Optional.', max: 160 }),
      f('student', 'Student name'), f('parent', 'Parent / guardian', { hint: 'Optional.' }), f('course', 'Class / course', { placeholder: 'e.g. Class 10 Maths' }),
      f('period', 'Fee for the period', { placeholder: 'e.g. October 2026', hint: 'Optional.' }), F.amount, F.mode, F.ref],
    sentence: 'Received from {student}[[ (parent / guardian: {parent})]] the sum of {amountFmt} ({amountWords}) as fees for {course}[[ for {period}]], paid by {mode}[[ (ref. {ref})]].',
    signers: [{ label: 'For', name: '{institute}' }],
    content: `
  <h2>Tips for tutors and coaching classes</h2>
  <ul>
    <li>Give a receipt every time you're paid, especially for cash.</li>
    <li>Number receipts in order (RCPT-001, RCPT-002…) so your records are easy to check.</li>
    <li>Tick "Print an office copy too" to keep a duplicate for your records.</li>
    <li>If your yearly fee income goes above ₹20 lakh (₹10 lakh in some states), you may need GST registration. Use the <a href="/invoice-generator/">invoice generator</a> then.</li>
  </ul>`,
    faqs: [
      ['Can parents claim tax benefit on these fees?', 'Only tuition fees paid to a school, college or university in India for full-time education qualify under Section 80C (old regime), for up to two children. Fees for private tuition or coaching classes don\'t qualify.'],
      ['Is this receipt valid for my records?', 'Yes. It\'s a signed acknowledgment of the fee you received, which is what most tutors and parents need.'],
      ['Can I make receipts for many students?', 'Yes. Fill in one student, print, then change the name, number and amount for the next. Your institute details stay saved on this device.']
    ]
  },
  {
    path: '/security-deposit-receipt/',
    name: 'Security Deposit Receipt',
    title: 'Security Deposit Receipt for Rent – Free Format & PDF | LiveLifeTricks',
    description: 'Make a security deposit receipt for a rented house or shop, with refund terms, landlord PAN and payment details. Print or save as PDF. Free.',
    h1: 'Security Deposit Receipt',
    lead: 'When a tenant pays a security deposit, the landlord should give a receipt. It saves a lot of arguments when the tenant moves out.',
    docTitle: 'SECURITY DEPOSIT RECEIPT',
    issuer: ['landlord', 'landlordContact'],
    fields: [F.receiptNo, F.date, f('landlord', 'Landlord name'), f('landlordContact', 'Landlord address / phone', { hint: 'Optional.', max: 160 }),
      f('landlordPan', 'Landlord PAN', { hint: 'Optional.', max: 10 }), f('tenant', 'Tenant name'), f('address', 'Rented property address', { max: 200 }),
      F.amount, F.mode, F.ref,
      f('terms', 'Refund terms', { type: 'textarea', value: 'Refundable when the tenant vacates and hands over the keys, after deducting unpaid rent, bills or repair costs for damage beyond normal wear and tear, if any.', max: 500 })],
    sentence: 'Received from {tenant} the sum of {amountFmt} ({amountWords}) as a refundable security deposit for the property at {address}, paid by {mode}[[ (ref. {ref})]].',
    note: 'terms',
    signers: [{ label: 'Landlord', name: '{landlord}', sub: '[[PAN: {landlordPan}]]' }, { label: 'Tenant', name: '{tenant}' }],
    content: `
  <h2>Why a deposit receipt matters</h2>
  <ul>
    <li>It proves how much was paid and when, which matters most when the tenant moves out.</li>
    <li>Clear refund terms prevent disputes about deductions.</li>
    <li>Pay deposits by bank transfer or UPI so there's a record.</li>
    <li>Mention the deposit in the rent agreement too.</li>
  </ul>`,
    faqs: [
      ['Is the security deposit taxable for the landlord?', 'No, a refundable deposit isn\'t income. It becomes income only if the landlord keeps part of it, for example to cover unpaid rent.'],
      ['How much security deposit is normal?', 'It varies by city: usually 1–3 months\' rent, but up to 6–10 months in some cities like Bengaluru. States that adopt the Model Tenancy Act cap it at 2 months for homes.'],
      ['Should both landlord and tenant sign?', 'Yes, ideally. The landlord signs to confirm they received it, and the tenant signs to agree to the refund terms.']
    ]
  },
  {
    path: '/maintenance-receipt-generator/',
    name: 'Society Maintenance Receipt',
    title: 'Society Maintenance Receipt Generator – Free PDF | LiveLifeTricks',
    description: 'Free maintenance receipt maker for housing societies and apartment associations. Flat number, period, amount in words and payment details. Print or save as PDF.',
    h1: 'Society Maintenance Receipt',
    lead: 'For housing society and apartment association treasurers. Make a maintenance receipt for any flat in seconds, with an office copy.',
    docTitle: 'MAINTENANCE RECEIPT',
    issuer: ['society', 'societyReg'],
    fields: [F.receiptNo, F.date, f('society', 'Society / association name'), f('societyReg', 'Registration no. / address', { hint: 'Optional.', max: 160 }),
      f('member', 'Member / flat owner name'), f('flat', 'Flat / unit no.', { max: 30 }), f('period', 'For the period', { placeholder: 'e.g. Oct–Dec 2026', hint: 'Optional.' }),
      F.amount, F.mode, F.ref, f('treasurer', 'Signed by', { placeholder: 'e.g. Treasurer', hint: 'Optional.' })],
    sentence: 'Received from {member}, Flat {flat}, the sum of {amountFmt} ({amountWords}) towards society maintenance charges[[ for {period}]], paid by {mode}[[ (ref. {ref})]].',
    signers: [{ label: 'For', name: '{society}', sub: '[[{treasurer}]]' }],
    content: `
  <h2>Good practice for society treasurers</h2>
  <ul>
    <li>Give a receipt for every payment, and keep an office copy.</li>
    <li>Use one numbering series for the year, e.g. MNT-2026-001.</li>
    <li>Encourage UPI or bank transfers to the society's account rather than cash.</li>
  </ul>`,
    faqs: [
      ['Does GST apply to society maintenance?', 'Only if the society\'s yearly turnover is over ₹20 lakh and a member pays more than ₹7,500 a month. Then GST at 18% applies to that member\'s whole amount. Most small societies don\'t charge GST.'],
      ['Can a tenant claim tax benefit for maintenance?', 'No. Maintenance charges aren\'t deductible for a tenant. For an owner who lets the flat out, they\'re covered by the 30% standard deduction on rent.'],
      ['Can I print receipts for many flats?', 'Yes. Your society details stay saved. Change the member, flat, number and amount for each receipt.']
    ]
  },
  {
    path: '/sale-receipt-generator/',
    name: 'Vehicle & Item Sale Receipt',
    title: 'Vehicle Sale Receipt / Sale Letter – Bike, Car, Item | LiveLifeTricks',
    description: 'Free sale receipt for selling a used bike, car, phone or any item: buyer and seller details, registration, chassis and engine numbers, handover time and signatures. Print or save as PDF.',
    h1: 'Vehicle & Item Sale Receipt',
    lead: 'Selling your old bike, car, phone or furniture? Make a sale receipt with the handover date and time, so it\'s clear who is responsible from that moment.',
    docTitle: 'SALE RECEIPT',
    issuer: ['seller', 'sellerAddress'],
    fields: [F.date, f('time', 'Handover time', { type: 'time', hint: 'Important for vehicles.' }),
      f('seller', 'Seller name'), f('sellerAddress', 'Seller address / phone', { hint: 'Optional.', max: 160 }),
      f('buyer', 'Buyer name'), f('buyerAddress', 'Buyer address / phone', { hint: 'Optional.', max: 160 }),
      f('item', 'Item sold', { placeholder: 'e.g. Honda Activa 6G, 2021, white', max: 140 }),
      f('regNo', 'Vehicle registration no.', { hint: 'Vehicles only.', max: 20 }), f('chassis', 'Chassis no.', { hint: 'Optional.', max: 30 }), f('engine', 'Engine no.', { hint: 'Optional.', max: 30 }),
      F.amount, F.mode, F.ref],
    sentence: 'I, {seller}, have sold {item}[[ bearing registration number {regNo}]][[, chassis no. {chassis}]][[, engine no. {engine}]] to {buyer} for {amountFmt} ({amountWords}), received in full by {mode}[[ (ref. {ref})]]. The item was handed over on {dateFmt}[[ at {time}]], in its present condition as seen and accepted by the buyer.',
    extra: '[[From the time of handover, the buyer is responsible for the vehicle ({regNo}), including any traffic challans, accidents or legal matters, and will complete the RC transfer at the RTO.]]',
    signers: [{ label: 'Seller', name: '{seller}' }, { label: 'Buyer', name: '{buyer}' }, { label: 'Witness', name: '' }],
    content: `
  <h2>Selling a vehicle? Do these too</h2>
  <ul>
    <li><strong>Note the exact handover time</strong> on the receipt. Challans or accidents after that time are the buyer's responsibility.</li>
    <li><strong>Transfer the RC:</strong> the seller informs the RTO with Form 29, and the buyer applies with Form 30. Many states let you do this on the Parivahan website.</li>
    <li>Hand over the RC, insurance papers, PUC and spare keys, and keep a photocopy of the buyer's ID.</li>
    <li>Transfer or cancel the insurance policy in the buyer's name.</li>
    <li>Until the RC is transferred, the vehicle is still legally in your name, so follow up.</li>
  </ul>`,
    faqs: [
      ['Is a sale receipt enough to transfer a vehicle?', 'No. It\'s proof of the sale between you and the buyer, but the RC must still be transferred at the RTO (Forms 29 and 30). Keep the receipt until the transfer is complete.'],
      ['Why does the handover time matter?', 'If the buyer gets a challan or has an accident before the RC is transferred, the receipt shows that the vehicle was no longer in your hands at that time.'],
      ['Can I use this for phones, laptops or furniture?', 'Yes. Leave the vehicle fields empty and describe the item, for example "iPhone 13, 128 GB, IMEI …".']
    ]
  }
];

function fieldHtml(fd) {
  const id = 'f-' + fd.key;
  const hint = fd.hint ? ` <span class="hint">${fd.hint}</span>` : '';
  const ph = fd.placeholder ? ` placeholder="${fd.placeholder}"` : '';
  let input;
  if (fd.type === 'select') input = `<select id="${id}" data-key="${fd.key}">${fd.options.map(o => `<option>${o}</option>`).join('')}</select>`;
  else if (fd.type === 'money') input = `<div class="money"><input id="${id}" data-key="${fd.key}" data-money inputmode="numeric" type="text"${fd.value ? ` value="${fd.value}"` : ''}></div>`;
  else if (fd.type === 'textarea') input = `<textarea id="${id}" data-key="${fd.key}" rows="3" maxlength="${fd.max || 500}">${fd.value || ''}</textarea>`;
  else if (fd.type === 'date' || fd.type === 'time') input = `<input id="${id}" data-key="${fd.key}" type="${fd.type}">`;
  else input = `<input id="${id}" data-key="${fd.key}" type="text" maxlength="${fd.max || 100}"${fd.value ? ` value="${fd.value}"` : ''}${ph}>`;
  const wide = fd.type === 'textarea' || /address|item|purpose|terms/i.test(fd.key);
  return `<div class="field${wide ? ' span-all' : ''}"><label for="${id}">${fd.label}${hint}</label>${input}</div>`;
}

function page(p) {
  const config = { docTitle: p.docTitle, issuer: p.issuer, sentence: p.sentence, extra: p.extra || '', note: p.note || '', signers: p.signers };
  const faqs = p.faqs.map(([q, a]) => `    <details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  return {
    meta: {
      title: p.title,
      description: p.description,
      path: p.path,
      priority: '0.8',
      breadcrumb: p.name,
      breadcrumbParent: { name: 'Receipt & invoice generators', path: '/receipt-generators/' },
      scripts: ['words.js', 'doc-engine.js', 'receipt-maker.js']
    },
    body: `
<section class="hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/receipt-generators/">Receipt &amp; invoice generators</a> › ${p.name}</nav>
    <h1>${p.h1}</h1>
    <p class="lead">${p.lead}</p>
    <div class="badges"><span class="badge">Amount in words</span><span class="badge">PDF in one click</span><span class="badge">Private: nothing is uploaded</span></div>
  </div>
</section>
<script type="application/json" id="receipt-config">${JSON.stringify(config).replace(/</g, '\\u003c')}</script>
<section class="wrap">
  <div class="calc doc-calc">
    <form class="card" id="rc-form" autocomplete="off" onsubmit="return false">
      <div class="row2 fields-grid">
        ${p.fields.map(fieldHtml).join('\n        ')}
      </div>
      <label class="check"><input type="checkbox" data-key="copies"> Print an office copy too (Original + Duplicate)</label>
    </form>
    <aside class="card results" aria-live="polite">
      <h2>Your receipt</h2>
      <div class="big" id="rc-amount">–</div>
      <p class="muted small" id="rc-words" style="margin:6px 0 0"></p>
      <div class="tip" id="rc-warn" hidden></div>
      <div class="actions">
        <button type="button" class="btn btn-primary" id="rc-print">Print / Save as PDF</button>
        <button type="button" class="btn" id="rc-next">Start next receipt</button>
      </div>
      <p class="small muted" style="margin:12px 0 0">Details are saved on this device only, so they're ready next time. Nothing is uploaded.</p>
    </aside>
  </div>
  <h2>Preview</h2>
  <div class="doc-wrap" id="rc-docs"></div>
</section>
<article class="wrap narrow content">
  <p class="updated">Last updated: {{updated}}</p>
${p.content}
  <p><strong>Important:</strong> only make receipts for money actually received. A false receipt can be treated as forgery.</p>
  <h2>Frequently asked questions</h2>
  <div class="faq-wrap">
${faqs}
  </div>
  <div class="card cta" style="margin-top:28px">
    <div><strong>More free generators</strong><br><span class="muted">Invoices, quotations, rent and other receipts.</span></div>
    <a class="btn btn-primary" href="/receipt-generators/">See all generators →</a>
  </div>
</article>
`
  };
}

module.exports = function () { return PRESETS.map(page); };
module.exports.PRESETS = PRESETS;
