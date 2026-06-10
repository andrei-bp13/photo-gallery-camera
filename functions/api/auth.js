import { jwtSign, sha256hex } from '../_jwt.js';

export async function onRequestPost(ctx) {
  let body;
  try { body = await ctx.request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { username, password } = body;
  if (!username || !password) {
    return Response.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const hash = await sha256hex(password);
  const validUser = username === ctx.env.AUTH_USERNAME;
  const validPass = hash === ctx.env.AUTH_PASSWORD_HASH?.toLowerCase();

  if (!validUser || !validPass) {
    // Constant-time-ish delay to slow brute force
    await new Promise(r => setTimeout(r, 300));
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await jwtSign(
    { sub: username, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 },
    ctx.env.JWT_SECRET
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}`,
    },
  });
}

export async function onRequestDelete(ctx) {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'auth_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    },
  });
}
