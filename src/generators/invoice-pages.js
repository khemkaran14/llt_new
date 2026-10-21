/*
 * Invoice and quotation generator pages. Both use the same form and script
 * (assets/js/invoice.js); only the default document type and the text differ.
 */
'use strict';

const TYPES = [
  ['Tax Invoice', 'Tax Invoice (GST)'],
  ['Invoice', 'Invoice (no GST)'],
  ['Quotation', 'Quotation / Estimate'],
  ['Proforma Invoice', 'Proforma Invoice'],
  ['Delivery Challan', 'Delivery Challan']
];

function form(defaultType) {
  const opts = TYPES.map(([v, l]) => `<option value="${v}"${v === defaultType ? ' selected' : ''}>${l}</option>`).join('');
  return `
<section class="wrap">
  <div class="calc doc-calc">
    <form class="card" id="inv-form" autocomplete="off" onsubmit="return false">
      <div class="row2">
        <div class="field">
          <label for="docType">Document</label>
          <select id="docType" data-key="docType">${opts}</select>
        </div>
        <div class="field">
          <label for="number">Number</label>
          <input id="number" data-key="number" type="text" maxlength="30" value="INV-001">
        </div>
        <div class="field">
          <label for="date">Date</label>
          <input id="date" data-key="date" type="date">
        </div>
        <div class="field">
          <label for="due" id="due-label">Due date</label>
          <input id="due" data-key="due" type="date">
        </div>
      </div>

      <fieldset class="section">
        <legend>Your business</legend>
        <div class="row2">
          <div class="field"><label for="sName">Business name</label><input id="sName" data-key="sName" type="text" maxlength="100"></div>
          <div class="field"><label for="sGstin">GSTIN <span class="hint">Only if GST-registered.</span></label><input id="sGstin" data-key="sGstin" type="text" maxlength="15" style="text-transform:uppercase"></div>
        </div>
        <div class="field"><label for="sAddress">Address</label><input id="sAddress" data-key="sAddress" type="text" maxlength="200"></div>
        <div class="row2">
          <div class="field"><label for="sPhone">Phone</label><input id="sPhone" data-key="sPhone" type="text" maxlength="20" inputmode="tel"></div>
          <div class="field"><label for="sEmail">Email</label><input id="sEmail" data-key="sEmail" type="text" maxlength="80" inputmode="email"></div>
        </div>
        <div class="field">
          <label for="logo">Logo <span class="hint">Optional. PNG or JPG under 300 KB. Stays on your device.</span></label>
          <input id="logo" type="file" accept="image/png,image/jpeg,image/svg+xml">
          <button type="button" class="btn" id="logo-remove" hidden style="margin-top:8px">Remove logo</button>
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Bill to</legend>
        <div class="row2">
          <div class="field"><label for="bName">Customer name</label><input id="bName" data-key="bName" type="text" maxlength="100"></div>
          <div class="field"><label for="bGstin">Customer GSTIN <span class="hint">Optional.</span></label><input id="bGstin" data-key="bGstin" type="text" maxlength="15" style="text-transform:uppercase"></div>
        </div>
        <div class="field"><label for="bAddress">Customer address</label><input id="bAddress" data-key="bAddress" type="text" maxlength="200"></div>
      </fieldset>

      <fieldset class="section">
        <legend>Items</legend>
        <div class="field">
          <span class="label" id="supply-label">GST</span>
          <div class="seg" role="group" aria-labelledby="supply-label" data-key="supply" data-value="intra">
            <button type="button" data-value="intra" aria-pressed="true">Same state (CGST + SGST)</button>
            <button type="button" data-value="inter" aria-pressed="false">Other state (IGST)</button>
            <button type="button" data-value="none" aria-pressed="false">No GST</button>
          </div>
        </div>
        <div id="items"></div>
        <button type="button" class="btn" id="add-item">+ Add item</button>
      </fieldset>

      <fieldset class="section">
        <legend>Payment &amp; notes</legend>
        <div class="row2">
          <div class="field"><label for="upi">UPI ID <span class="hint">Adds a scan-to-pay QR code.</span></label><input id="upi" data-key="upi" type="text" maxlength="60" placeholder="yourname@okhdfcbank"></div>
          <div class="field"><label for="signer">Signed by</label><input id="signer" data-key="signer" type="text" maxlength="60" placeholder="Authorised signatory"></div>
        </div>
        <div class="field"><label for="bank">Bank details <span class="hint">Optional.</span></label><textarea id="bank" data-key="bank" rows="2" maxlength="300" placeholder="A/c name, A/c no., IFSC, bank"></textarea></div>
        <div class="field"><label for="notes">Notes / terms <span class="hint">Optional.</span></label><textarea id="notes" data-key="notes" rows="2" maxlength="500" placeholder="e.g. Payment due within 15 days. Thank you for your business!"></textarea></div>
      </fieldset>
    </form>

    <aside class="card results" aria-live="polite">
      <h2 id="sum-title">Invoice total</h2>
      <div class="big" id="sum-total">–</div>
      <table class="kv" id="sum-table" style="margin-top:12px"></table>
      <div class="tip" id="inv-warn" hidden></div>
      <div class="actions">
        <button type="button" class="btn btn-primary" id="inv-print">Print / Save as PDF</button>
        <button type="button" class="btn" id="inv-new">Start next one</button>
      </div>
      <p class="small muted" style="margin:12px 0 0">Your business details are saved on this device for next time. Nothing is uploaded.</p>
    </aside>
  </div>

  <h2>Preview</h2>
  <div class="doc-wrap"><div id="doc" class="doc"></div></div>
</section>
`;
}

const PAGES = [
  {
    defaultType: 'Tax Invoice',
    meta: {
      title: 'Free GST Invoice Generator – Make & Download Invoice PDF | LiveLifeTricks',
      description: 'Make a professional GST or non-GST invoice in your browser. Automatic CGST/SGST/IGST, HSN codes, amount in words and a UPI QR code for instant payment. Print or save as PDF. Free, no sign-up.',
      path: '/invoice-generator/',
      priority: '0.9',
      breadcrumb: 'Invoice Generator',
      breadcrumbParent: { name: 'Receipt & invoice generators', path: '/receipt-generators/' },
      scripts: ['vendor/qrcode.js', 'words.js', 'doc-engine.js', 'invoice.js']
    },
    h1: 'Free Invoice Generator',
    lead: 'Make a clean GST or non-GST invoice in a minute. Taxes, totals and amount in words are worked out for you, and a UPI QR code lets your customer pay by scanning.',
    content: `
  <h2>What a GST tax invoice must show</h2>
  <ul>
    <li>Your name, address and GSTIN</li>
    <li>A unique invoice number (up to 16 characters) and the date</li>
    <li>Customer's name and address, and their GSTIN if they're registered</li>
    <li>HSN code for goods or SAC code for services</li>
    <li>Quantity, value, taxable value, GST rate and amount (CGST + SGST, or IGST)</li>
    <li>Place of supply for sales to another state</li>
    <li>Signature of the supplier or an authorised person</li>
  </ul>
  <p>If you're <strong>not GST-registered</strong>, you can't charge GST. Choose "Invoice (no GST)" and "No GST" instead.</p>

  <h2>CGST + SGST or IGST?</h2>
  <p>Selling to a customer in your own state: split the GST equally into CGST and SGST. Selling to another state: charge the full amount as IGST.</p>

  <h2>Frequently asked questions</h2>
  <div class="faq-wrap">
    <details class="faq"><summary>Is this invoice valid for GST?</summary><p>Yes, as long as you fill in all the required details correctly and you're GST-registered. If your turnover needs e-invoicing (over ₹5 crore), you must also generate an IRN on the government's e-invoice portal.</p></details>
    <details class="faq"><summary>How does the UPI QR code work?</summary><p>Enter your UPI ID and the invoice shows a QR code with the exact amount filled in. Your customer scans it with any UPI app (Google Pay, PhonePe, Paytm, BHIM) and pays you directly. We never touch the money.</p></details>
    <details class="faq"><summary>Where is my data stored?</summary><p>Only in your own browser, so your business details are ready next time. Nothing is sent to our servers.</p></details>
    <details class="faq"><summary>Can I make a quotation or delivery challan too?</summary><p>Yes. Change "Document" at the top to Quotation, Proforma Invoice or Delivery Challan.</p></details>
  </div>`
  },
  {
    defaultType: 'Quotation',
    meta: {
      title: 'Free Quotation Generator – Make a Quotation / Estimate PDF | LiveLifeTricks',
      description: 'Create a professional quotation or estimate with your logo, item rates, GST and validity date. Print or save as PDF in seconds. Free, private, no sign-up.',
      path: '/quotation-generator/',
      priority: '0.8',
      breadcrumb: 'Quotation Generator',
      breadcrumbParent: { name: 'Receipt & invoice generators', path: '/receipt-generators/' },
      scripts: ['vendor/qrcode.js', 'words.js', 'doc-engine.js', 'invoice.js']
    },
    h1: 'Free Quotation Generator',
    lead: 'Send a neat quotation or estimate with your logo, rates, GST and a validity date. When the customer says yes, switch it to an invoice in one click.',
    content: `
  <h2>What to put in a quotation</h2>
  <ul>
    <li>Your business name and contact details</li>
    <li>A quotation number and date</li>
    <li>Each item or service with quantity and rate</li>
    <li>GST, if you're registered, so the customer sees the final price</li>
    <li>How long the price is valid, and payment or delivery terms</li>
  </ul>

  <h2>Quotation, proforma invoice or invoice?</h2>
  <table>
    <thead><tr><th>Document</th><th>When to use it</th></tr></thead>
    <tbody>
      <tr><td>Quotation / estimate</td><td>Before the customer agrees: "this is what it will cost"</td></tr>
      <tr><td>Proforma invoice</td><td>After they agree, before delivery: often used to collect an advance</td></tr>
      <tr><td>Tax invoice</td><td>When you supply the goods or service and charge for it</td></tr>
      <tr><td>Delivery challan</td><td>Moving goods without a sale, e.g. job work or sending samples</td></tr>
    </tbody>
  </table>

  <h2>Frequently asked questions</h2>
  <div class="faq-wrap">
    <details class="faq"><summary>Is a quotation legally binding?</summary><p>Once the customer accepts it within the validity period, it can form a contract on the quoted terms. Write clear terms and a validity date to avoid disputes.</p></details>
    <details class="faq"><summary>Should a quotation include GST?</summary><p>If you're GST-registered, yes. Show GST separately so the customer knows the final amount. If you're not registered, choose "No GST".</p></details>
    <details class="faq"><summary>Can I turn the quotation into an invoice?</summary><p>Yes. Change "Document" to Tax Invoice, update the number and date, and print again. Your items stay as they are.</p></details>
  </div>`
  }
];

module.exports = function () {
  return PAGES.map(p => ({
    meta: Object.assign({ embed: false }, p.meta),
    body: `
<section class="hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/receipt-generators/">Receipt &amp; invoice generators</a> › ${p.meta.breadcrumb}</nav>
    <h1>${p.h1}</h1>
    <p class="lead">${p.lead}</p>
    <div class="badges"><span class="badge">GST ready</span><span class="badge">UPI QR code</span><span class="badge">PDF in one click</span><span class="badge">Private: nothing is uploaded</span></div>
  </div>
</section>
<script>window.LLT_DEFAULT_DOC = ${JSON.stringify(p.defaultType)};</script>
${form(p.defaultType)}
<article class="wrap narrow content">
  <p class="updated">Last updated: {{updated}}</p>
${p.content}
  <div class="card cta" style="margin-top:28px">
    <div><strong>Need a receipt instead?</strong><br><span class="muted">Payment, fee, deposit, maintenance and sale receipts.</span></div>
    <a class="btn btn-primary" href="/receipt-generators/">See all generators →</a>
  </div>
</article>
`
  }));
};
