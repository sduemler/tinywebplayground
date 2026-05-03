import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Please enter a valid email address.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = import.meta.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Subscription service is not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const res = await fetch('https://api.buttondown.com/v1/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_address: email }),
  });

  if (res.ok) {
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  const data = await res.json();
  const alreadySubscribed =
    res.status === 400 && JSON.stringify(data).toLowerCase().includes('already');

  if (alreadySubscribed) {
    return new Response(
      JSON.stringify({ success: false, error: 'This email is already subscribed!' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Something went wrong. Please try again.' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
};
