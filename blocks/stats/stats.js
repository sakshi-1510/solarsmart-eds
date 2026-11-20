export default function decorate(block) {
  const numbers = block.querySelectorAll('h2');

  if (!('IntersectionObserver' in window)) return;

  const parseValue = (text) => {
    const num = parseFloat(text.replace(/[^0-9.]/g, ''));
    const suffix = text.replace(/[0-9.,\s]/g, '').trim();
    return { num, suffix };
  };

  const animateCount = (el, target, suffix, duration = 1800) => {
    const start = performance.now();
    const isDecimal = target % 1 !== 0;
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - ((1 - progress) ** 3);
      const current = target * eased;
      const display = isDecimal
        ? current.toFixed(1)
        : Math.floor(current).toLocaleString();
      el.textContent = display + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      numbers.forEach((el) => {
        const { num, suffix } = parseValue(el.textContent);
        if (!Number.isNaN(num)) animateCount(el, num, suffix);
      });
      observer.disconnect();
    });
  }, { threshold: 0.3 });

  observer.observe(block);
}
