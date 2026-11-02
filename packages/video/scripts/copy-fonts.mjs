// Copies the curated font files from @fontsource packages into public/fonts so renders
// never depend on Google Fonts being reachable at render time.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "fonts");
mkdirSync(outDir, { recursive: true });

const files = [
  ["anton", "anton-latin-400-normal.woff2"],
  ["bebas-neue", "bebas-neue-latin-400-normal.woff2"],
  ["archivo-black", "archivo-black-latin-400-normal.woff2"],
  ["montserrat", "montserrat-latin-600-normal.woff2"],
  ["montserrat", "montserrat-latin-800-normal.woff2"],
  ["montserrat", "montserrat-latin-900-normal.woff2"],
  ["poppins", "poppins-latin-800-normal.woff2"],
  ["oswald", "oswald-latin-700-normal.woff2"],
  ["playfair-display", "playfair-display-latin-800-normal.woff2"],
  ["dm-serif-display", "dm-serif-display-latin-400-normal.woff2"],
];
for (const [pkg, file] of files) {
  const pkgDir = dirname(require.resolve(`@fontsource/${pkg}/package.json`));
  copyFileSync(join(pkgDir, "files", file), join(outDir, file));
}
console.log(`copied ${files.length} fonts to ${outDir}`);
