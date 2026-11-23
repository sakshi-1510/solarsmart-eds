const SORT_OPTIONS = {
  newest: (a, b) => new Date(b['published-date']) - new Date(a['published-date']),
  oldest: (a, b) => new Date(a['published-date']) - new Date(b['published-date']),
  'reading-time': (a, b) => parseInt(a['reading-time'], 10) - parseInt(b['reading-time'], 10),
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function createCard(post) {
  const card = document.createElement('div');
  card.className = 'bl-card';
  card.innerHTML = `
    <a href="${post.path}" class="bl-card-link">
      <div class="bl-card-img">
        <img src="${post.image || 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&q=80'}"
          alt="${post.title}" loading="lazy">
      </div>
      <div class="bl-card-body">
        ${post.category ? `<span class="bl-category">${post.category}</span>` : ''}
        <h3 class="bl-card-title">${post.title}</h3>
        <p class="bl-card-desc">${post.description || ''}</p>
        <div class="bl-card-meta">
          ${post['published-date'] ? `<span class="bl-date">${formatDate(post['published-date'])}</span>` : ''}
          ${post['reading-time'] ? `<span class="bl-reading-time">${post['reading-time']} read</span>` : ''}
        </div>
      </div>
    </a>
  `;
  return card;
}

function renderPagination(container, total, pageSize, currentPage, onPageChange) {
  container.innerHTML = '';
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return;

  const prev = document.createElement('button');
  prev.className = 'bl-page-btn';
  prev.textContent = '← Previous';
  prev.disabled = currentPage === 1;
  prev.addEventListener('click', () => onPageChange(currentPage - 1));
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i += 1) {
    const btn = document.createElement('button');
    btn.className = `bl-page-btn${i === currentPage ? ' active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => onPageChange(i));
    container.appendChild(btn);
  }

  const next = document.createElement('button');
  next.className = 'bl-page-btn';
  next.textContent = 'Next →';
  next.disabled = currentPage === totalPages;
  next.addEventListener('click', () => onPageChange(currentPage + 1));
  container.appendChild(next);
}

export default async function decorate(block) {
  // Read config from block rows
  const rows = [...block.querySelectorAll(':scope > div')];
  const config = {};
  rows.forEach((row) => {
    const cols = row.querySelectorAll(':scope > div');
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim();
      const val = cols[1].textContent.trim();
      config[key] = val;
    }
  });

  const indexPath = config['Index Path'] || '/query-index.json';
  const filterPath = config['Filter Path'] || '/blogs/';
  const pageSize = parseInt(config['Page Size'] || '6', 10);
  function decodeHTML(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }

  const categories = (config.Categories || '')
    .split(',')
    .map((c) => decodeHTML(c.trim()))
    .filter(Boolean);

  const sortOptions = (config['Sort Options'] || 'newest')
    .split(',')
    .map((s) => s.trim());

  // State
  let currentPage = 1;
  let currentCategory = '';
  let currentSort = sortOptions[0] || 'newest';
  let searchQuery = '';
  let allPosts = [];

  // Build UI shell FIRST so controls always show
  block.innerHTML = `
    <div class="bl-controls">
      <div class="bl-search-wrap">
        <input type="search" class="bl-search" placeholder="Search articles…" aria-label="Search blog articles">
      </div>
      <div class="bl-filters">
        <select class="bl-category-filter" aria-label="Filter by category">
          <option value="">All Categories</option>
          ${categories.map((c) => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select class="bl-sort" aria-label="Sort articles">
          ${sortOptions.map((s) => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="bl-results-info"></div>
    <div class="bl-grid"><p class="bl-loading">Loading articles…</p></div>
    <div class="bl-pagination"></div>
  `;

  const searchEl = block.querySelector('.bl-search');
  const categoryEl = block.querySelector('.bl-category-filter');
  const sortEl = block.querySelector('.bl-sort');
  const gridEl = block.querySelector('.bl-grid');
  const paginationEl = block.querySelector('.bl-pagination');
  const resultsEl = block.querySelector('.bl-results-info');

  // Fetch query index
  try {
    const resp = await fetch(indexPath);
    if (!resp.ok) throw new Error('Index unavailable');
    const json = await resp.json();
    allPosts = (json.data || []).filter((p) => p.path && p.path.startsWith(filterPath));
  } catch {
    gridEl.innerHTML = '<p class="bl-error">No articles available yet. Check back soon!</p>';
  }

  function getFiltered() {
    let posts = [...allPosts];
    if (currentCategory) {
      posts = posts.filter((p) => p.category === currentCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter((p) => (p.title || '').toLowerCase().includes(q)
        || (p.description || '').toLowerCase().includes(q)
        || (p.tags || '').toLowerCase().includes(q));
    }
    if (SORT_OPTIONS[currentSort]) {
      posts.sort(SORT_OPTIONS[currentSort]);
    }
    return posts;
  }

  function render() {
    const filtered = getFiltered();
    const total = filtered.length;
    const start = (currentPage - 1) * pageSize;
    const pagePosts = filtered.slice(start, start + pageSize);

    if (total === 0 && allPosts.length === 0) {
      resultsEl.textContent = '';
      gridEl.innerHTML = '<p class="bl-empty">No articles available yet. Check back soon!</p>';
      paginationEl.innerHTML = '';
      return;
    }

    resultsEl.textContent = total === 0
      ? 'No articles found.'
      : `Showing ${start + 1}–${Math.min(start + pageSize, total)} of ${total} article${total !== 1 ? 's' : ''}`;

    gridEl.innerHTML = '';
    if (pagePosts.length === 0) {
      gridEl.innerHTML = '<p class="bl-empty">No articles match your search. Try different keywords or clear the filters.</p>';
    } else {
      pagePosts.forEach((post) => gridEl.appendChild(createCard(post)));
    }

    renderPagination(paginationEl, total, pageSize, currentPage, (page) => {
      currentPage = page;
      render();
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Event listeners
  let searchTimeout;
  searchEl.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = searchEl.value.trim();
      currentPage = 1;
      render();
    }, 300);
  });

  categoryEl.addEventListener('change', () => {
    currentCategory = categoryEl.value;
    currentPage = 1;
    render();
  });

  sortEl.addEventListener('change', () => {
    currentSort = sortEl.value;
    currentPage = 1;
    render();
  });

  render();
}
