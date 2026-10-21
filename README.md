# LiveLifeTricks – Income Tax & EMI Calculators

Website for **livelifetricks.com**:

- **Income Tax Calculator** (`/income-tax-calculator/`): new vs old regime for FY 2026-27 and FY 2025-26, with HRA (including the new 8-city list), 80C, 80D, NPS, home loan interest, 87A rebate, marginal relief, surcharge and cess. It shows which regime is cheaper and how many extra deductions the old regime would need to match.
- **EMI Calculator** (`/emi-calculator/`): home, car, personal and education loans, with a year-by-year schedule (tap a year to see its months), extra-payment savings, a CSV download and a shareable link.
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

How it works: the VPS keeps a copy of this repo in `/opt/llt_new`. A script there pulls the latest code, runs the tests, builds the site and copies it into the folder nginx serves. GitHub Actions runs that script for you on every push to `main`.

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
git clone --depth 1 https://github.com/khemkaran14/llt_new.git /opt/llt_new
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
git clone --depth 1 git@github-llt:khemkaran14/llt_new.git /opt/llt_new
```

### 2.4 Publish the site into your folder

```bash
SITE_DIR=/var/www/livelifetricks.com bash /opt/llt_new/deploy/update-from-github.sh
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
cp /opt/llt_new/deploy/nginx-livelifetricks.conf /etc/nginx/sites-available/livelifetricks.com
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
| `SITE_DIR` | your site folder, e.g. `/var/www/livelifetricks.com` |
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
SITE_DIR=/var/www/livelifetricks.com bash /opt/llt_new/deploy/update-from-github.sh
```

## Using a panel or Apache instead

- **CloudPanel, aaPanel, Hestia or the Hostinger panel:** create a static site for livelifetricks.com and turn on its free SSL. Then use that site's document root as `SITE_DIR` everywhere above, and skip 2.6 and Part 4.
- **Apache:** use a `<VirtualHost>` with `DocumentRoot /var/www/livelifetricks.com` and `ErrorDocument 404 /404.html`, then run `certbot --apache`. Clean URLs work without extra rules.

---

## Keeping the tax calculator accurate

Tax rules live in one file: `src/assets/js/tax-engine.js`.

- **Slabs and rates:** `NEW_SLABS`, `oldSlabs()` and `SURCHARGE`
- **Year list and HRA metro cities:** `YEARS`
- **Rebate, standard deduction and deduction limits:** inside `compute()`

After every Union Budget (1 February), check the rules, add the new year to `YEARS`, update `tests/engines.test.js`, and run `npm test` before pushing. GitHub Actions also refuses to deploy if any test fails.
