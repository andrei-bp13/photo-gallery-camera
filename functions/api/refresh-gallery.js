import { jwtVerify, parseCookies } from '../_jwt.js';

async function requireAuth(ctx) {
  const cookies = parseCookies(ctx.request);
  return cookies['auth_token']
    ? await jwtVerify(cookies['auth_token'], ctx.env.JWT_SECRET)
    : null;
}

// POST /api/refresh-gallery
// Reads every current photo (filename, tags, orientation) from D1 and writes a
// public gallery-manifest.json snapshot to R2. The frontpage reads that snapshot
// to build the gallery + camera slideshow, so this is what makes published and
// deleted photos (and tag edits) take effect on the public site.
export async function onRequestPost(ctx) {
  if (!await requireAuth(ctx)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { results } = await ctx.env.DB
    .prepare("SELECT filename, tags, landscape FROM photos WHERE status = 'current' ORDER BY upload_date DESC")
    .all();

  const manifest = results.map(p => ({
    name: p.filename,
    landscape: !!p.landscape,
    tags: JSON.parse(p.tags || '[]'),
  }));

  await ctx.env.R2.put('gallery-manifest.json', JSON.stringify(manifest), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=60',
    },
  });

  return Response.json({ ok: true, count: manifest.length });
}
