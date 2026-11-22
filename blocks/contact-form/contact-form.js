export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  let formEndpoint = '/contact-form.json';
  let submitEndpoint = '/api/contact-submit';

  rows.forEach((row) => {
    const cols = row.querySelectorAll(':scope > div');
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim();
      const val = cols[1].textContent.trim();
      if (key === 'Form Endpoint') formEndpoint = val;
      if (key === 'Submit Endpoint') submitEndpoint = val;
    }
  });

  block.innerHTML = '<p class="cf-loading">Loading form…</p>';

  let fields = [];
  try {
    const resp = await fetch(formEndpoint);
    if (!resp.ok) throw new Error('Sheet unavailable');
    const json = await resp.json();
    fields = json.data || [];
  } catch {
    block.innerHTML = '<p class="cf-error">Unable to load form. Please <a href="mailto:hello@solarsmart.com">email us</a> instead.</p>';
    return;
  }

  const form = document.createElement('form');
  form.className = 'cf-form';
  form.noValidate = true;

  fields.forEach((field) => {
    const {
      Name,
      Label,
      Type,
      Placeholder,
      Mandatory,
      Options,
    } = field;
    if (!Name || !Type) return;

    const wrapper = document.createElement('div');
    wrapper.className = `cf-field cf-type-${Type}`;

    if (Type === 'submit') {
      const btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'cf-btn';
      btn.textContent = Label || 'Submit';
      wrapper.appendChild(btn);
    } else {
      const label = document.createElement('label');
      label.htmlFor = `cf-${Name}`;
      label.innerHTML = `${Label}${Mandatory === 'true' ? ' <span class="cf-req">*</span>' : ''}`;
      wrapper.appendChild(label);

      let input;
      if (Type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 5;
        input.placeholder = Placeholder || '';
      } else if (Type === 'select') {
        input = document.createElement('select');
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = 'Select…';
        input.appendChild(blank);
        (Options || '').split(',').forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt.trim();
          o.textContent = opt.trim();
          input.appendChild(o);
        });
      } else {
        input = document.createElement('input');
        input.type = Type;
        input.placeholder = Placeholder || '';
      }

      input.id = `cf-${Name}`;
      input.name = Name;
      if (Mandatory === 'true') input.required = true;

      const errSpan = document.createElement('span');
      errSpan.className = 'cf-err';
      errSpan.id = `cf-err-${Name}`;

      wrapper.appendChild(input);
      wrapper.appendChild(errSpan);
    }

    form.appendChild(wrapper);
  });

  block.innerHTML = '';
  block.appendChild(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    block.querySelectorAll('.cf-err').forEach((el) => { el.textContent = ''; });
    let valid = true;

    block.querySelectorAll('[required]').forEach((el) => {
      if (!el.value.trim()) {
        const err = block.querySelector(`#cf-err-${el.name}`);
        if (err) err.textContent = 'This field is required.';
        valid = false;
      }
    });

    const emailEl = block.querySelector('#cf-email');
    if (emailEl?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      const err = block.querySelector('#cf-err-email');
      if (err) err.textContent = 'Please enter a valid email address.';
      valid = false;
    }

    if (!valid) return;

    const btn = form.querySelector('.cf-btn');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const resp = await fetch(submitEndpoint, {
        method: 'POST',
        body: new URLSearchParams(payload),
      });

      const result = await resp.json();

      if (!resp.ok) {
        if (result.fields) {
          Object.entries(result.fields).forEach(([name, msg]) => {
            const err = block.querySelector(`#cf-err-${name}`);
            if (err) err.textContent = msg;
          });
        }
        btn.textContent = 'Send Message';
        btn.disabled = false;
        return;
      }

      block.innerHTML = `
        <div class="cf-success">
          <div class="cf-success-icon">&#x2705;</div>
          <h3>Message Received!</h3>
          <p>${result.message || "Thank you! We'll be in touch within one business day."}</p>
          <p><a href="/solutions">Explore Our Solutions</a> while you wait.</p>
        </div>
      `;
    } catch {
      btn.textContent = 'Send Message';
      btn.disabled = false;
      const errMsg = document.createElement('p');
      errMsg.className = 'cf-submit-error';
      errMsg.textContent = 'Something went wrong. Please try again or email us at hello@solarsmart.com.';
      form.insertAdjacentElement('beforebegin', errMsg);
    }
  });
}
