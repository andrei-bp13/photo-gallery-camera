// GET /api/tags
// Public, no auth. Returns just { filename, tags } for every current photo so the
// frontpage can drive its tag filter for logged-out visitors too. (The admin-only
// /api/photos endpoint 401s for the public, which is why filtering used to do
// nothing on the live site.) Only non-sensitive fields for published photos.
export async function onRequestGet(ctx) {
  const { results } = await ctx.env.DB
    .prepare("SELECT filename, tags FROM photos WHERE status = 'current'")
    .all();

  const photos = results.map(p => ({
    filename: p.filename,
    tags: JSON.parse(p.tags || '[]'),
  }));

  return Response.json({ photos }, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
