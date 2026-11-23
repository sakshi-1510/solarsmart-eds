# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--solarsmart-eds--sakshi-1510.aem.page/
- Live: https://main--solarsmart-eds--sakshi-1510.aem.live/

## Documentation

Before using the aem-boilerplate, we recommend you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `solarsmart-eds` directory in your favorite IDE and start coding :)

# SolarSmart — Solar Energy Website

Built on Adobe Edge Delivery Services (EDS) with Document Authoring (DA).

## Live Site

- **Preview:** https://main--solarsmart-eds--sakshi-1510.aem.page/
- **Live:** https://main--solarsmart-eds--sakshi-1510.aem.live/

---

## Pages

| Page | URL |
|---|---|
| Homepage | / |
| About | /about |
| Solutions | /solutions |
| Calculator | /calculator |
| Contact | /contact |
| Blog Listing | /blogs |
| Blog Posts | /blogs/* |

---

## Custom Blocks

| Block | Location | Description |
|---|---|---|
| hero | blocks/hero | Full-width hero with background image and CTA buttons |
| solar-calculator | blocks/solar-calculator | Savings calculator — calls /api/calculate |
| contact-form | blocks/contact-form | Dynamic form — reads /contact-form.json sheet |
| offer-banner | blocks/offer-banner | Promo banner with countdown — calls /api/offers |
| blog-list | blocks/blog-list | Blog cards with search, filter, sort, pagination |
| tabs | blocks/tabs | Tabbed content (Block Party) |
| pricing | blocks/pricing | 3-tier pricing cards |
| faq | blocks/faq | Accordion FAQ |
| timeline | blocks/timeline | Animated step-by-step timeline |

---

## APIs

All files in `api/` are served automatically by EDS at `/api/<name>`.

| Endpoint | Method | Description |
|---|---|---|
| /api/calculate | POST | Solar savings calculator — returns savings, payback, CO₂ |
| /api/contact-submit | POST | Contact form handler — validates and stores submission |
| /api/offers | GET | Returns active promotional offer from offers.json sheet |

---

## Data Sheets

| Sheet | Path | Used By |
|---|---|---|
| Contact Form Fields | /contact-form.json | contact-form block |
| Active Offers | /offers.json | offer-banner block via /api/offers |

---

## Blog Platform

Blogs live under `/blogs/`. Adding a new post:

1. Create page in DA at `/blogs/your-post-slug`
2. Add metadata: `template`, `author`, `category`, `published-date`, `reading-time`, `image`
3. Publish the page
4. It appears automatically in `/query-index.json` and the blog listing

Blog categories: `Home Solar`, `Commercial Solar`, `Battery & Storage`, `Savings & Incentives`

---

## Analytics

`scripts/metadata-handler.js` exposes metadata on every page:

```javascript
window.solarSmartMetadata  // page and section metadata
window.solarSmartAnalytics // events array (pageview, impression, click)
window.dataLayer           // GTM compatible events
Development
npm install   # install dependencies
npm run lint  # lint JS and CSS
Note: This repo requires LF line endings. Use GitHub's web editor on Windows to avoid CRLF issues.


---
