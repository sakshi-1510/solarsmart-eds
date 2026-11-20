export default function decorate(block) {
  // Each child div is already a row: [label-div, content-div]
  // No restructuring needed — CSS handles the layout.
  // Optionally animate items in on scroll:
  const items = block.querySelectorAll(':scope > div');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-24px)';
      item.style.transition = `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`;
      observer.observe(item);
    });
  }
}