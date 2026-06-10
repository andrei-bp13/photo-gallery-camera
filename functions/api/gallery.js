// GET /api/gallery
// Public, no auth. Returns the gallery manifest snapshot that the admin
// "Clear cache + refresh database" button wrote to R2. Served same-origin so the
// frontpage can fetch it without cross-origin (CORS) issues on the public r2.dev
// URL. Returns [] when no snapshot exists yet, so the frontpage keeps its static
// build until the first refresh.
export async function onRequestGet(ctx) {
  const obj = await ctx.env.R2.get('gallery-manifest.json');
  if (!obj) {
    return Response.json([], { headers: { 'Cache-Control': 'public, max-age=60' } });
  }
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
