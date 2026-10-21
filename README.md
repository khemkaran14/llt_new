# LiveLifeTricks – Income Tax & EMI Calculators

Website for **livelifetricks.com**:

- **Income Tax Calculator** (`/income-tax-calculator/`): new vs old regime for FY 2026-27 and FY 2025-26, with HRA (including the new 8-city list), 80C, 80D, NPS, home loan interest, 87A rebate, marginal relief, surcharge and cess. It shows which regime is cheaper and how many extra deductions the old regime would need to match.
- **EMI Calculator** (`/emi-calculator/`): home, car, personal and education loans, with a year-by-year schedule (tap a year to see its months), extra-payment savings, a CSV download and a shareable link.
- **In-Hand Salary** (`/salary-calculator/`): CTC to monthly take-home after PF, gratuity, professional tax and income tax.
- **SIP** (`/sip-calculator/`): monthly SIP, yearly step-up, lumpsum and a goal planner.
- **HRA** (`/hra-calculator/`): tax-free HRA with the FY 2026-27 8-city rule.
- **PPF** (`/ppf-calculator/`), **FD** (`/fd-calculator/`) and **RD** (`/rd-calculator/`): maturity and interest.
- **GST** (`/gst-calculator/`): add or remove GST at the GST 2.0 rates, with CGST/SGST/IGST split.
- **Free tools:** Prepay Loan or Invest? (`/prepay-or-invest/`), Rent Receipt Generator (`/rent-receipt-generator/`), Tax Calendar with calendar reminders (`/tax-calendar/`).
- **Marriage biodata maker** (`/biodata/`): 45 designs (15 free, 30 premium at ₹20) from `src/assets/js/biodata-templates.js`, religious icons for every faith from `src/assets/js/biodata-icons.js` (plus custom god-picture upload), a live preview, and PDF/JPG export in the browser. Free downloads need an email; premium needs a Razorpay payment, and the paid biodata is locked (changing it needs a new ₹20 payment). The server in `server/` stores orders and runs the admin dashboard at `/admin`. Biodata details and photos never leave the visitor's browser.
- **Receipt & invoice generators** (`/receipt-generators/`): GST/non-GST invoice with UPI QR code, quotation, proforma invoice and delivery challan (`src/generators/invoice-pages.js` + `assets/js/invoice.js`), plus payment, fee, security deposit, society maintenance and vehicle/item sale receipts. Each receipt type is a small definition in `src/generators/receipt-pages.js`, so new ones are quick to add. Deliberately no fuel, restaurant, medical, hotel/travel bills or salary slips, because self-made versions of those are used for fake claims.
- **Income tax by salary:** 24 pages from ₹5 lakh to ₹50 lakh (`/income-tax-on-salary/…`), generated at build time by `src/generators/salary-pages.js` from the same tax engine. Add more amounts to `LAKHS` there.
- **Embeddable calculators:** any page with `"embed": true` gets an "Add this calculator to your website" box. Opening a page with `?embed=1` shows only the calculator plus a credit link back to the site, which earns backlinks.
- Home, About, Contact, Privacy policy, Disclaimer and 404 pages (needed for AdSense approval), plus an automatic `sitemap.xml` and `robots.txt`, SEO tags, FAQ structured data and dark mode.

It's a plain static site with no database and no server code, so it's fast and cheap to host next to your other sites. See [docs/GROWTH-PLAN.md](docs/GROWTH-PLAN.md) for the plan to grow it towards a sale.

## Folder layout

```
├── src/
│   ├── layout.html        shared header, footer and SEO tags
│   ├── pages/             one file per page (meta block at the top)
│   ├── assets/css, js     styles and calculator code
│   └── static/            favicon, share image, manifest
├── tests/                 checks the tax and EMI maths
├── deploy/                nginx config and deploy scripts
├── .github/workflows/     automatic deploy to the VPS
├── build.js               builds everything into dist/
└── site.config.json       site URL, email, Google Analytics / AdSense IDs
```

## Everyday commands (needs Node.js 18+)

```bash
npm test          # check the calculations
npm run build     # build the site into dist/
npm run serve     # build and preview at http://localhost:8080
```

**To add a page**, copy `src/pages/about.html`, change the meta block (`title`, `description`, `path`) and the content, then run `npm run build`. It's added to the sitemap automatically.

**To turn on Google Analytics or AdSense**, put your IDs in `site.config.json` (`ga4Id`, for example `G-XXXXXXX`, and `adsenseClient`, for example `ca-pub-123...`) and push.

---

# Deploying to the Hostinger VPS

How it works: the VPS keeps a copy of this repo in `/root/livelifetricks`. A script there pulls the latest code, runs the tests, builds the site and copies it into the folder nginx serves. GitHub Actions runs that script for you on every push to `main`.

In the commands below, replace:
- `YOUR_VPS_IP` with your VPS IP address
- `/var/www/livelifetricks.com` with the folder you created for the site. That folder must hold **only** this website, because the deploy replaces everything in it.

## Part 1 – Before you start

1. **Back up the old site.** If it's WordPress, use All-in-One WP Migration → Export, or download its files and database from the current host.
2. **Take a screenshot of the domain's DNS records.** You'll need the **MX** and **TXT** records later. They control email on this domain, so don't lose them.

## Part 2 – One-time setup on the VPS

### 2.1 Log in

```bash
ssh root@YOUR_VPS_IP
```

### 2.2 Install git, rsync and Node.js

```bash
apt update && apt install -y git rsync curl
node -v
```

If `node -v` doesn't show v18 or higher, install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 2.3 Download this repo

If the repo is **public**:

```bash
git clone --depth 1 https://github.com/khemkaran14/llt_new.git /root/livelifetricks
```

If the repo is **private**, give the VPS read-only access first:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/llt_repo -N ""
cat ~/.ssh/llt_repo.pub
```

Copy the line that's printed. On GitHub, open the repo → **Settings → Deploy keys → Add deploy key**, paste it in, and leave "Allow write access" **off**. Then run:

```bash
cat >> ~/.ssh/config <<'CFG'
Host github-llt
  HostName github.com
  User git
  IdentityFile ~/.ssh/llt_repo
CFG
git clone --depth 1 git@github-llt:khemkaran14/llt_new.git /root/livelifetricks
```

### 2.4 Publish the site into your folder

```bash
SITE_DIR=/var/www/livelifetricks.com bash /root/livelifetricks/deploy/update-from-github.sh
```

It should end with `==> Done`.

### 2.5 Check your web server

```bash
systemctl is-active nginx apache2
```

- If it shows **nginx: active**, continue with 2.6.
- If it shows **Apache**, or you use a panel such as CloudPanel or aaPanel, see the [section on panels and Apache](#using-a-panel-or-apache-instead) at the end.

### 2.6 Add the nginx config

```bash
cp /root/livelifetricks/deploy/nginx-livelifetricks.conf /etc/nginx/sites-available/livelifetricks.com
nano /etc/nginx/sites-available/livelifetricks.com   # change the "root" line if your folder is different
ln -s /etc/nginx/sites-available/livelifetricks.com /etc/nginx/sites-enabled/
nginx -t                  # must say "test is successful"
systemctl reload nginx
```

If `/etc/nginx/sites-available` doesn't exist, copy the file to `/etc/nginx/conf.d/livelifetricks.com.conf` instead and skip the `ln -s` line. `nginx -t` checks the config before reloading, so a mistake can't take your other sites down.

### 2.7 Test it before moving the domain

```bash
curl -s -H "Host: livelifetricks.com" http://localhost | grep "<title>"
```

You should see `LiveLifeTricks – Free Income Tax, EMI...`.

## Part 3 – Point the domain to the VPS

Open the DNS settings wherever your domain is managed:

- **Hostinger:** hPanel → Domains → livelifetricks.com → DNS / Nameservers
- **GoDaddy, Namecheap and others:** their DNS page. You don't need to transfer the domain.
- **Cloudflare:** set the record to "DNS only" (grey cloud) until HTTPS works

| Type  | Name | Points to |
|-------|------|-----------|
| A     | @    | YOUR_VPS_IP (delete any other A record for @) |
| CNAME | www  | livelifetricks.com |

Leave the MX and TXT records as they are. Check progress at https://dnschecker.org. It's ready when most places show your VPS IP, which usually takes 10 minutes to a few hours.

## Part 4 – Free HTTPS

Do this once dnschecker shows your IP:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d livelifetricks.com -d www.livelifetricks.com
```

Choose **redirect** if it asks. The certificate renews itself.

## Part 5 – Automatic deploys from GitHub

After this, every push to `main` goes live within about a minute.

### 5.1 Create a login key for GitHub Actions (on the VPS)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions
```

Copy everything the last command prints, including the `-----BEGIN` and `-----END` lines.

### 5.2 Add the secrets on GitHub

Open the repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `VPS_HOST` | your VPS IP |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | the private key from 5.1 |
| `SITE_DIR` | the folder nginx serves, e.g. `/var/www/livelifetricks.com` |
| `REPO_DIR` | only if the code isn't in `/root/livelifetricks` |
| `VPS_PORT` | only if SSH isn't on port 22 |

### 5.3 Run it

Open the **Actions** tab → **Deploy to VPS** → **Run workflow**. A green tick means the site was updated. If an earlier run failed because the secrets weren't added yet, re-run it now.

If it fails with "connection timed out", allow port 22 in hPanel → VPS → Security → Firewall.

## Part 6 – Tell Google

1. In **Google Search Console**, add livelifetricks.com and submit `https://livelifetricks.com/sitemap.xml`.
2. Use **URL Inspection → Request indexing** for `/income-tax-calculator/` and `/emi-calculator/`.
3. If old pages had visitors, redirect each one to the closest new page by adding a line inside the `server { }` block of the nginx config, then run `nginx -t && systemctl reload nginx`:

```nginx
location = /old-post-name/ { return 301 /income-tax-calculator/; }
```

## Updating the site by hand

If you ever need to deploy without GitHub Actions:

```bash
ssh root@YOUR_VPS_IP
SITE_DIR=/var/www/livelifetricks.com bash /root/livelifetricks/deploy/update-from-github.sh
```

## Using a panel or Apache instead

- **CloudPanel, aaPanel, Hestia or the Hostinger panel:** create a static site for livelifetricks.com and turn on its free SSL. Then use that site's document root as `SITE_DIR` everywhere above, and skip 2.6 and Part 4.
- **Apache:** use a `<VirtualHost>` with `DocumentRoot /var/www/livelifetricks.com` and `ErrorDocument 404 /404.html`, then run `certbot --apache`. Clean URLs work without extra rules.

---

## Keeping the tax calculator accurate

Tax rules live in one file: `src/assets/js/tax-engine.js`.

Other things to update each year: the deadlines list at the top of `src/assets/js/tax-calendar.js`, the PPF default rate in `src/pages/ppf-calculator.html` (reviewed every quarter), and the GST slabs listed in `src/pages/gst-calculator.html`.

- **Slabs and rates:** `NEW_SLABS`, `oldSlabs()` and `SURCHARGE`
- **Year list and HRA metro cities:** `YEARS`
- **Rebate, standard deduction and deduction limits:** inside `compute()`

After every Union Budget (1 February), check the rules, add the new year to `YEARS`, update `tests/engines.test.js`, and run `npm test` before pushing. GitHub Actions also refuses to deploy if any test fails.


---

# Biodata maker: server, payments and admin

The biodata page is static, but payments, emails and the admin dashboard need the small Node server in `server/` (no npm packages). nginx sends `/api/*` and `/admin` to it.

| File | What it is |
|---|---|
| `server/server.js` | Starts the server (port 3077 by default) |
| `server/api.js` | Orders, Razorpay verification, download checks, admin API |
| `server/admin.html` | Admin dashboard: orders, revenue, emails, CSV export |
| `deploy/llt-api.service` | systemd service that keeps the server running |
| `deploy/nginx-api.conf` | nginx lines that send `/api` and `/admin` to the server |
| `deploy/api.env.example` | Settings (admin password, Razorpay keys) |

**Test locally** (fake payments, no Razorpay needed):

```bash
npm run build
STATIC_DIR=dist DEV_PAYMENTS=1 ADMIN_PASSWORD=test node server/server.js
# open http://localhost:3077/biodata/ and http://localhost:3077/admin
```

**How "no edits after payment" works:** when someone pays, the page sends the server a fingerprint (SHA-256) of the finished biodata, not the biodata itself. Each download must match that fingerprint, within 48 hours and up to 10 downloads. The page also locks the form. Anyone technical enough to edit the page's code could get around this, as with any in-browser PDF tool; making that impossible would need the PDF to be built on the server.

**Moving to a subdomain later** (e.g. `biodata.livelifetricks.com`): add a DNS A record for `biodata`, create an nginx server block with `root /var/www/livelifetricks.com;`, the same `include .../nginx-api.conf;` line and `location = / { return 302 /biodata/; }`, then run certbot for the new name.
