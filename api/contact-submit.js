const REQUIRED_FIELDS = ['first-name', 'last-name', 'email', 'message'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-+().]{7,20}$/;

const SUBMISSIONS_SHEET = 'https://admin.hlx.page/form/sakshi-1510/solarsmart-eds/main/contact-submissions';

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const errors = {};

  REQUIRED_FIELDS.forEach((field) => {
    if (!body[field] || !String(body[field]).trim()) {
      errors[field] = `${field} is required`;
    }
  });

  if (body.email && !EMAIL_REGEX.test(body.email)) {
    errors.email = 'Invalid email address';
  }

  if (body.phone && body.phone.trim() && !PHONE_REGEX.test(body.phone)) {
    errors.phone = 'Invalid phone number';
  }

  if (Object.keys(errors).length > 0) {
    return new Response(JSON.stringify({ error: 'Validation failed', fields: errors }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sanitize = (str) => String(str || '').trim().substring(0, 2000);

  const submission = {
    timestamp: new Date().toISOString(),
    'first-name': sanitize(body['first-name']),
    'last-name': sanitize(body['last-name']),
    email: sanitize(body.email).toLowerCase(),
    phone: sanitize(body.phone),
    interest: sanitize(body.interest),
    message: sanitize(body.message),
    source: 'contact-page',
  };

  try {
    await fetch(SUBMISSIONS_SHEET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
  } catch (err) {
    // Sheet write failed — do not break the user experience
    void err;
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Thank you! We'll be in touch within one business day.",
    submittedAt: submission.timestamp,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
