const DISMISSED_KEY = 'ss-offer-dismissed';

function formatTime(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hrs = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (days > 0) return `${days}d ${hrs}h ${mins}m`;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default async function decorate(block) {
  block.innerHTML = '';

  const dismissed = sessionStorage.getItem(DISMISSED_KEY);

  try {
    const resp = await fetch('https://solarsmart.free.beeceptor.com/offers');
    if (!resp.ok) throw new Error('API unavailable');
    const { offer, remainingMs } = await resp.json();

    if (!offer || dismissed === offer.id) {
      block.closest('.section')?.remove();
      return;
    }

    const banner = document.createElement('div');
    banner.className = 'ob-banner';
    banner.setAttribute('role', 'banner');
    banner.setAttribute('aria-label', 'Promotional offer');

    banner.innerHTML = `
      ${offer.badge ? `<span class="ob-badge">${offer.badge}</span>` : ''}
      <div class="ob-content">
        <strong class="ob-headline">${offer.headline}</strong>
        <span class="ob-subtext">${offer.subtext}</span>
      </div>
      ${remainingMs ? `<div class="ob-countdown" aria-live="polite">
        <span class="ob-countdown-label">Offer ends in:</span>
        <span class="ob-timer" id="ob-timer"></span>
      </div>` : ''}
      <a href="${offer['cta-url']}" class="ob-cta">${offer['cta-label']}</a>
      <button class="ob-close" aria-label="Dismiss offer" title="Dismiss">✕</button>
    `;

    block.appendChild(banner);

    if (remainingMs) {
      let remaining = remainingMs;
      const timerEl = banner.querySelector('#ob-timer');
      timerEl.textContent = formatTime(remaining);

      const interval = setInterval(() => {
        remaining -= 1000;
        if (remaining <= 0) {
          clearInterval(interval);
          banner.classList.add('ob-expired');
          timerEl.textContent = 'Expired';
          setTimeout(() => block.closest('.section')?.remove(), 2000);
        } else {
          timerEl.textContent = formatTime(remaining);
        }
      }, 1000);
    }

    banner.querySelector('.ob-close').addEventListener('click', () => {
      sessionStorage.setItem(DISMISSED_KEY, offer.id);
      banner.classList.add('ob-dismissed');
      setTimeout(() => block.closest('.section')?.remove(), 400);
    });
  } catch {
    block.closest('.section')?.remove();
  }
}
