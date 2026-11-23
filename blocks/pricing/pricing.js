export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  block.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'pricing-grid';

  rows.forEach((row) => {
    const cols = [...row.querySelectorAll(':scope > div')];
    if (cols.length < 1) return;

    const card = document.createElement('div');
    card.className = 'pricing-card';

    // Check if this card is marked as featured (second column says "featured")
    if (cols.length >= 2 && cols[1].textContent.trim().toLowerCase() === 'featured') {
      card.classList.add('pricing-featured');
    }

    const content = cols[0];

    // Find all paragraphs and lists
    const allEls = [...content.children];
    let phase = 'header';

    allEls.forEach((el) => {
      const tag = el.tagName.toLowerCase();

      if (phase === 'header' && (tag === 'h2' || tag === 'h3')) {
        el.className = 'pricing-name';
        card.appendChild(el);
      } else if (phase === 'header' && tag === 'p' && el.querySelector('strong')) {
        el.className = 'pricing-price';
        card.appendChild(el);
        phase = 'features';
      } else if (phase === 'header' && tag === 'p') {
        el.className = 'pricing-subtitle';
        card.appendChild(el);
      } else if (tag === 'ul' || tag === 'ol') {
        el.className = 'pricing-features';
        card.appendChild(el);
        phase = 'cta';
      } else if (phase === 'cta' && tag === 'p' && el.querySelector('a')) {
        el.className = 'pricing-cta';
        card.appendChild(el);
      } else {
        card.appendChild(el);
      }
    });

    grid.appendChild(card);
  });

  block.appendChild(grid);
}
