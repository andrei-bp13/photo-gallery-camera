// Regenerates src/photos-manifest.json from the live R2 gallery snapshot before
// each build, so the statically-rendered homepage matches the current database
// (no rebuild/flash on load). Runs as part of `npm run build`.
//
// Defensive by design: on ANY failure (snapshot missing, network error, bad
// JSON) it logs a warning and leaves the committed manifest in place, so a
// transient issue can never break the deploy.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SNAPSHOT_URL = 'https://pub-0d81359dcf6343cba33754dd0dad97fc.r2.dev/gallery-manifest.json';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'photos-manifest.json');

try {
  const res = await fetch(SNAPSHOT_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const snapshot = await res.json();
  if (!Array.isArray(snapshot) || snapshot.length === 0) throw new Error('empty or invalid snapshot');

  const manifest = snapshot
    .map((p) => ({ name: p.name, landscape: !!p.landscape }))
    .sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`[manifest] wrote ${manifest.length} photos from the live snapshot`);
} catch (err) {
  console.warn(`[manifest] keeping committed manifest (snapshot fetch failed: ${err.message})`);
}
