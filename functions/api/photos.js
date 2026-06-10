import { jwtVerify, parseCookies } from '../_jwt.js';

async function requireAuth(ctx) {
  const cookies = parseCookies(ctx.request);
  const payload = cookies['auth_token']
    ? await jwtVerify(cookies['auth_token'], ctx.env.JWT_SECRET)
    : null;
  return payload;
}

// GET /api/photos?status=current|new  — list photos from D1
export async function onRequestGet(ctx) {
  if (!await requireAuth(ctx)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(ctx.request.url);
  const status = url.searchParams.get('status');

  let stmt;
  if (status) {
    stmt = ctx.env.DB.prepare('SELECT * FROM photos WHERE status = ? ORDER BY upload_date DESC').bind(status);
  } else {
    stmt = ctx.env.DB.prepare('SELECT * FROM photos ORDER BY upload_date DESC');
  }

  const { results } = await stmt.all();
  const photos = results.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]'), landscape: !!p.landscape }));
  return Response.json({ photos });
}

// PATCH /api/photos  — update tags for a photo
export async function onRequestPatch(ctx) {
  if (!await requireAuth(ctx)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await ctx.request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { id, tags } = body;
  if (!id || !Array.isArray(tags)) return Response.json({ error: 'Missing id or tags' }, { status: 400 });

  await ctx.env.DB.prepare('UPDATE photos SET tags = ? WHERE id = ?')
    .bind(JSON.stringify(tags), id)
    .run();

  return Response.json({ ok: true });
}

// DELETE /api/photos?id=xxx&filename=xxx  — delete from R2 and D1
export async function onRequestDelete(ctx) {
  if (!await requireAuth(ctx)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(ctx.request.url);
  const id = url.searchParams.get('id');
  const filename = url.searchParams.get('filename');

  if (!id || !filename) return Response.json({ error: 'Missing id or filename' }, { status: 400 });

  await Promise.all([
    ctx.env.R2.delete(filename),
    ctx.env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run(),
  ]);

  return Response.json({ ok: true });
}
