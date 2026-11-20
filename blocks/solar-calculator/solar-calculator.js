export default function decorate(block) {
  let apiEndpoint = 'https://api.solarsmart.com/v1/calculate';
  let submitLabel = 'Calculate My Savings';
  const fields = [];

  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = [...row.querySelectorAll('p')];
    if (!cells.length) return;
    const key = cells[0]?.textContent?.trim();
    const val = cells[1]?.textContent?.trim();
    const def = cells[2]?.textContent?.trim();
    if (key === 'API Endpoint') { apiEndpoint = val; return; }
    if (key === 'Submit Label') { submitLabel = val; return; }
    if (key && val) fields.push({ label: key, type: val, defaultValue: def || '' });
  });

  block.innerHTML = '';
  const form = document.createElement('form');
  form.noValidate = true;

  fields.forEach(({ label, type, defaultValue }) => {
    const lbl = document.createElement('label');
    const input = document.createElement('input');
    input.type = type === 'number' ? 'number' : 'text';
    input.name = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    input.placeholder = defaultValue;
    input.value = defaultValue;
    if (type === 'number') input.min = '0';
    lbl.textContent = label;
    lbl.appendChild(input);
    form.appendChild(lbl);
  });

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = submitLabel;
  form.appendChild(btn);

  const resultsEl = document.createElement('div');
  resultsEl.className = 'results';
  resultsEl.hidden = true;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Calculating…';
    resultsEl.hidden = true;
    resultsEl.innerHTML = '';

    const payload = {};
    form.querySelectorAll('input').forEach((input) => {
      payload[input.name] = input.value;
    });

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      const metrics = [
        {
          value: data.annualSavings
            ? `$${Number(data.annualSavings).toLocaleString()}`
            : '—',
          label: 'Est. Annual Savings',
        },
        {
          value: data.paybackYears ? `${data.paybackYears} yrs` : '—',
          label: 'Payback Period',
        },
        {
          value: data.co2Tons ? `${data.co2Tons} T` : '—',
          label: 'CO₂ Offset / Year',
        },
        {
          value: data.homeValueIncrease
            ? `+${data.homeValueIncrease}%`
            : '—',
          label: 'Home Value Uplift',
        },
      ];

      metrics.forEach(({ value, label }) => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `<div class="value">${value}</div>`
          + `<div class="label">${label}</div>`;
        resultsEl.appendChild(card);
      });

      resultsEl.hidden = false;
    } catch {
      resultsEl.innerHTML = '<div class="error">Something went wrong. '
        + 'Please try again or <a href="/contact">contact us</a> '
        + 'for a personalised quote.</div>';
      resultsEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = submitLabel;
    }
  });

  block.appendChild(form);
  block.appendChild(resultsEl);
}
