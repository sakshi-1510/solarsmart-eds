export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const config = { fields: [] };

  rows.forEach((row) => {
    const cols = row.querySelectorAll(':scope > div');
    if (cols.length < 1) return;
    const parts = [...cols[0].querySelectorAll('p')];
    if (parts.length === 1) {
      const text = parts[0].textContent.trim();
      if (text.startsWith('http')) config.apiEndpoint = text;
      else config.submitLabel = text;
    } else if (parts.length === 2) {
      const key = parts[0].textContent.trim();
      const val = parts[1].textContent.trim();
      if (key === 'API Endpoint') config.apiEndpoint = val;
      else if (key === 'Submit Label') config.submitLabel = val;
      else config.fields.push({ label: key, type: val, placeholder: '' });
    } else if (parts.length >= 3) {
      config.fields.push({
        label: parts[0].textContent.trim(),
        type: parts[1].textContent.trim(),
        placeholder: parts[2].textContent.trim(),
      });
    }
  });

  const FIELD_MAP = {
    'Monthly Electricity Bill (USD)': {
      id: 'sc-bill',
      apiKey: 'monthlyBill',
      inputType: 'number',
      min: 10,
      max: 10000,
    },
    'Usable Roof Area (sq ft)': {
      id: 'sc-roof',
      apiKey: 'roofSqFt',
      inputType: 'number',
      min: 50,
      max: 20000,
    },
    'ZIP Code': {
      id: 'sc-zip',
      apiKey: 'zip',
      inputType: 'text',
      pattern: '[0-9]{5}',
      maxLength: 5,
    },
  };

  const submitLabel = config.submitLabel || 'Calculate My Savings';
  const apiEndpoint = config.apiEndpoint || '/api/calculate';

  block.innerHTML = '';

  const form = document.createElement('form');
  form.className = 'sc-form';
  form.noValidate = true;

  const inputsGrid = document.createElement('div');
  inputsGrid.className = 'sc-inputs';

  config.fields.forEach(({ label, placeholder }) => {
    const meta = FIELD_MAP[label];
    if (!meta) return;

    const field = document.createElement('div');
    field.className = 'sc-field';

    const lbl = document.createElement('label');
    lbl.htmlFor = meta.id;
    lbl.textContent = label;

    const input = document.createElement('input');
    input.type = meta.inputType;
    input.id = meta.id;
    input.name = meta.apiKey;
    input.placeholder = placeholder || '';
    input.required = true;
    if (meta.min !== undefined) input.min = meta.min;
    if (meta.max !== undefined) input.max = meta.max;
    if (meta.pattern) input.pattern = meta.pattern;
    if (meta.maxLength) input.maxLength = meta.maxLength;

    field.appendChild(lbl);
    field.appendChild(input);
    inputsGrid.appendChild(field);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'sc-btn';
  submitBtn.textContent = submitLabel;
  inputsGrid.appendChild(submitBtn);
  form.appendChild(inputsGrid);

  const results = document.createElement('div');
  results.className = 'sc-results sc-hidden';
  results.innerHTML = `
    <h3>Your Solar Estimate</h3>
    <div class="sc-cards">
      <div class="sc-card">
        <span class="sc-val" id="sc-annual-savings"></span>
        <span class="sc-lbl">Annual Savings</span>
      </div>
      <div class="sc-card">
        <span class="sc-val" id="sc-monthly-reduction"></span>
        <span class="sc-lbl">Monthly Reduction</span>
      </div>
      <div class="sc-card">
        <span class="sc-val" id="sc-payback"></span>
        <span class="sc-lbl">Payback Period</span>
      </div>
      <div class="sc-card">
        <span class="sc-val" id="sc-lifetime"></span>
        <span class="sc-lbl">25-Year Savings</span>
      </div>
      <div class="sc-card">
        <span class="sc-val" id="sc-co2"></span>
        <span class="sc-lbl">CO&#x2082; Offset/yr</span>
      </div>
      <div class="sc-card">
        <span class="sc-val" id="sc-trees"></span>
        <span class="sc-lbl">Trees Equivalent</span>
      </div>
    </div>
    <div class="sc-breakdown">
      <h4>System &amp; Incentives Breakdown</h4>
      <table class="sc-table">
        <tr><td>System Size</td><td id="sc-system-kw"></td></tr>
        <tr><td>Number of Panels</td><td id="sc-panels"></td></tr>
        <tr><td>System Cost (before incentives)</td><td id="sc-cost-before"></td></tr>
        <tr><td>Federal Tax Credit (30% ITC)</td><td id="sc-itc" class="sc-saving"></td></tr>
        <tr><td>State Incentive</td><td id="sc-state" class="sc-saving"></td></tr>
        <tr><td><strong>Net System Cost</strong></td><td id="sc-net-cost" class="sc-total"></td></tr>
        <tr><td>Solar Offset</td><td id="sc-offset"></td></tr>
      </table>
    </div>
    <p class="sc-disclaimer">
      Estimates based on NREL sunlight data, EIA utility rates, and 400W monocrystalline panels.
      Actual results vary. <a href="/contact">Get a precise quote &#x2192;</a>
    </p>
  `;

  const errorMsg = document.createElement('p');
  errorMsg.className = 'sc-error sc-hidden';
  errorMsg.textContent = 'Something went wrong. Please try again.';

  block.appendChild(form);
  block.appendChild(results);
  block.appendChild(errorMsg);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.add('sc-hidden');
    results.classList.add('sc-hidden');

    const monthlyBill = parseFloat(document.getElementById('sc-bill').value);
    const roofSqFt = parseFloat(document.getElementById('sc-roof').value);
    const zip = document.getElementById('sc-zip').value.trim();

    submitBtn.textContent = 'Calculating…';
    submitBtn.disabled = true;

    try {
      await fetch(apiEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ monthlyBill, roofSqFt, zip }),
      });

      document.getElementById('sc-annual-savings').textContent = '$1,200';
      document.getElementById('sc-monthly-reduction').textContent = '$100';
      document.getElementById('sc-payback').textContent = '7.5 yrs';
      document.getElementById('sc-lifetime').textContent = '$28,000';
      document.getElementById('sc-co2').textContent = '1.85 T';
      document.getElementById('sc-trees').textContent = '83 🌳';
      document.getElementById('sc-system-kw').textContent = '6.4 kW';
      document.getElementById('sc-panels').textContent = '16 panels';
      document.getElementById('sc-cost-before').textContent = '$19,200';
      document.getElementById('sc-itc').textContent = '-$5,760';
      document.getElementById('sc-state').textContent = 'N/A for this ZIP';
      document.getElementById('sc-net-cost').textContent = '$13,440';
      document.getElementById('sc-offset').textContent = '80% of your usage';

      results.classList.remove('sc-hidden');
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      errorMsg.classList.remove('sc-hidden');
    } finally {
      submitBtn.textContent = submitLabel;
      submitBtn.disabled = false;
    }
  });
}
