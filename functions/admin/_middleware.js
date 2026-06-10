import { jwtVerify, parseCookies } from '../_jwt.js';

export async function onRequest(ctx) {
  const cookies = parseCookies(ctx.request);
  const token = cookies['auth_token'];
  const payload = token ? await jwtVerify(token, ctx.env.JWT_SECRET) : null;

  if (!payload) {
    const loginUrl = new URL('/login', ctx.request.url);
    loginUrl.searchParams.set('next', new URL(ctx.request.url).pathname);
    return Response.redirect(loginUrl.toString(), 302);
  }

  return ctx.next();
}
