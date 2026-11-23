const PAGE_METADATA_KEYS = [
  'title',
  'description',
  'template',
  'author',
  'business-unit',
  'audience',
  'campaign',
  'reading-time',
];

const SECTION_METADATA_KEYS = [
  'style',
  'animate',
  'track-clicks',
  'track-impression',
  'faq-category',
  'cta-id',
];

/**
 * Read all page-level metadata from <meta> tags in <head>
 * EDS converts the metadata block to <meta> tags automatically
 */
function readPageMetadata() {
  const meta = {};
  PAGE_METADATA_KEYS.forEach((key) => {
    const el = document.querySelector(`meta[name="${key}"]`)
      || document.querySelector(`meta[property="${key}"]`);
    if (el) meta[key] = el.getAttribute('content');
  });

  // Also grab standard tags
  meta.url = window.location.href;
  meta.path = window.location.pathname;
  meta.referrer = document.referrer || '';
  meta.timestamp = new Date().toISOString();

  return meta;
}

/**
 * Read section metadata from each section's section-metadata block
 * Returns array of objects, one per section
 */
function readSectionMetadata() {
  const sections = [...document.querySelectorAll('main > div')];
  return sections.map((section, index) => {
    const sectionMeta = { sectionIndex: index };
    const metaBlock = section.querySelector('.section-metadata');
    if (metaBlock) {
      const rows = [...metaBlock.querySelectorAll(':scope > div')];
      rows.forEach((row) => {
        const cols = row.querySelectorAll(':scope > div');
        if (cols.length >= 2) {
          const key = cols[0].textContent.trim().toLowerCase();
          const val = cols[1].textContent.trim();
          if (SECTION_METADATA_KEYS.includes(key)) {
            sectionMeta[key] = val;
          }
        }
      });
    }
    return sectionMeta;
  });
}

/**
 * Set up click tracking on sections that have track-clicks: true
 */
function setupClickTracking(sections) {
  sections.forEach((sectionMeta, index) => {
    if (sectionMeta['track-clicks'] !== 'true') return;
    const sectionEl = document.querySelectorAll('main > div')[index];
    if (!sectionEl) return;

    sectionEl.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;

      const event = {
        type: 'click',
        sectionIndex: index,
        ctaId: sectionMeta['cta-id'] || null,
        trackImpression: sectionMeta['track-impression'] || null,
        element: target.tagName.toLowerCase(),
        text: target.textContent.trim().substring(0, 100),
        href: target.href || null,
        timestamp: new Date().toISOString(),
      };

      // Push to analytics layer
      window.solarSmartAnalytics = window.solarSmartAnalytics || [];
      window.solarSmartAnalytics.push({ event: 'click', ...event });

      // Also push to dataLayer for GTM compatibility
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'solarsmart_click', ...event });
    });
  });
}

/**
 * Set up impression tracking using IntersectionObserver
 * Fires when a tracked section enters the viewport
 */
function setupImpressionTracking(sections) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const sectionEl = entry.target;
      const index = [...document.querySelectorAll('main > div')].indexOf(sectionEl);
      const sectionMeta = sections[index];
      if (!sectionMeta || !sectionMeta['track-impression']) return;

      const event = {
        type: 'impression',
        sectionIndex: index,
        trackImpression: sectionMeta['track-impression'],
        ctaId: sectionMeta['cta-id'] || null,
        timestamp: new Date().toISOString(),
      };

      window.solarSmartAnalytics = window.solarSmartAnalytics || [];
      window.solarSmartAnalytics.push({ event: 'impression', ...event });

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'solarsmart_impression', ...event });

      // Only fire once per section
      observer.unobserve(sectionEl);
    });
  }, { threshold: 0.4 });

  sections.forEach((sectionMeta, index) => {
    if (!sectionMeta['track-impression']) return;
    const sectionEl = document.querySelectorAll('main > div')[index];
    if (sectionEl) observer.observe(sectionEl);
  });
}

/**
 * Main init — called on page load
 */
export default function initMetadataHandler() {
  const pageMetadata = readPageMetadata();
  const sectionMetadata = readSectionMetadata();

  // Expose globally for analytics and other scripts
  window.solarSmartMetadata = {
    page: pageMetadata,
    sections: sectionMetadata,
  };

  // Push page view event
  window.solarSmartAnalytics = window.solarSmartAnalytics || [];
  window.solarSmartAnalytics.push({
    event: 'pageview',
    ...pageMetadata,
  });

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'solarsmart_pageview',
    ...pageMetadata,
  });

  // Set up tracking
  setupClickTracking(sectionMetadata);
  setupImpressionTracking(sectionMetadata);
}
