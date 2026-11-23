export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  // First row contains all content
  const row = rows[0];
  const cols = [...row.querySelectorAll(':scope > div')];
  const content = cols[0];

  // Find the picture/image — move it to be the background
  const picture = content.querySelector('picture');
  if (picture) {
    picture.classList.add('hero-bg');
    block.prepend(picture);
  }

  // Wrap remaining content in overlay div
  const overlay = document.createElement('div');
  overlay.className = 'hero-overlay';

  // Move all content children into overlay
  [...content.childNodes].forEach((node) => {
    overlay.appendChild(node);
  });

  row.remove();
  block.appendChild(overlay);

  // Wrap all links as buttons
  block.querySelectorAll('a').forEach((a) => {
    a.classList.add('hero-btn');
  });

  // Make second button outlined
  const btns = block.querySelectorAll('.hero-btn');
  if (btns.length >= 2) {
    btns[1].classList.add('hero-btn-outline');
  }
}
