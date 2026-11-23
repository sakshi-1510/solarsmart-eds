export default function decorate(block) {
  const items = [...block.querySelectorAll(':scope > div')];

  block.innerHTML = '';

  const list = document.createElement('dl');
  list.className = 'faq-list';

  items.forEach((item) => {
    const cols = item.querySelectorAll(':scope > div');
    if (cols.length < 2) return;

    const question = cols[0].textContent.trim();
    const answer = cols[1].innerHTML;

    const dt = document.createElement('dt');
    dt.className = 'faq-question';
    dt.setAttribute('role', 'button');
    dt.setAttribute('aria-expanded', 'false');
    dt.setAttribute('tabindex', '0');
    dt.innerHTML = `
      <span>${question}</span>
      <span class="faq-icon" aria-hidden="true">+</span>
    `;

    const dd = document.createElement('dd');
    dd.className = 'faq-answer';
    dd.setAttribute('aria-hidden', 'true');
    dd.innerHTML = answer;

    function toggle() {
      const expanded = dt.getAttribute('aria-expanded') === 'true';
      dt.setAttribute('aria-expanded', !expanded);
      dd.setAttribute('aria-hidden', expanded);
      dt.querySelector('.faq-icon').textContent = expanded ? '+' : '−';
    }

    dt.addEventListener('click', toggle);
    dt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    list.appendChild(dt);
    list.appendChild(dd);
  });

  block.appendChild(list);
}
