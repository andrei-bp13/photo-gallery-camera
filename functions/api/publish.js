import { jwtVerify, parseCookies } from '../_jwt.js';

const R2_BASE = 'https://pub-0d81359dcf6343cba33754dd0dad97fc.r2.dev';

async function requireAuth(ctx) {
  const cookies = parseCookies(ctx.request);
  return cookies['auth_token']
    ? await jwtVerify(cookies['auth_token'], ctx.env.JWT_SECRET)
    : null;
}

// POST /api/publish
// Accepts multipart/form-data:
//   file      — WebP blob (already converted + resized by the browser)
//   filename  — desired filename (e.g. "myphoto.webp")
//   landscape — "true" or "false"
export async function onRequestPost(ctx) {
  if (!await requireAuth(ctx)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let formData;
  try { formData = await ctx.request.formData(); }
  catch { return Response.json({ error: 'Invalid form data' }, { status: 400 }); }

  const file = formData.get('file');
  const filename = formData.get('filename');
  const landscape = formData.get('landscape') === 'true';

  if (!file || !filename) return Response.json({ error: 'Missing file or filename' }, { status: 400 });
  if (!file.type.includes('webp')) return Response.json({ error: `File must be WebP (got ${file.type})` }, { status: 415 });

  // Sanitise filename: strip path separators, ensure .webp
  const safeName = filename.replace(/[/\\]/g, '').replace(/[^a-zA-Z0-9._\- ]/g, '') || `photo-${Date.now()}.webp`;
  const finalName = safeName.endsWith('.webp') ? safeName : safeName.replace(/\.[^.]+$/, '') + '.webp';

  // Upload to R2
  await ctx.env.R2.put(finalName, file.stream(), {
    httpMetadata: { contentType: 'image/webp' },
  });

  const url = `${R2_BASE}/${encodeURIComponent(finalName)}`;
  const id = crypto.randomUUID();

  // Save to D1
  await ctx.env.DB.prepare(
    'INSERT INTO photos (id, filename, url, tags, landscape, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, finalName, url, '[]', landscape ? 1 : 0, 'current').run();

  return Response.json({ ok: true, photo: { id, filename: finalName, url, tags: [], landscape, status: 'current' } });
}
