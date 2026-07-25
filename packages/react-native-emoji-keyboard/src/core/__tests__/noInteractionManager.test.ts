/**
 * §4 guard (static): the substring `InteractionManager` must not appear ANYWHERE
 * in the library source. The incumbent gated first paint on
 * `InteractionManager.runAfterInteractions`, which does not reliably fire on
 * react-native-web after a category change — leaving the grid visibly empty
 * (§4 of handover.md). This CI gate fails the build if that pattern ever returns.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

const FORBIDDEN = 'InteractionManager';
const SRC_ROOT = resolve(__dirname, '..', '..');
// Never scan build output, deps, or these tests (this file names the substring).
const SKIP_DIRS = new Set(['node_modules', 'lib', '__tests__']);
const SCAN_EXT = /\.(ts|tsx|js|jsx)$/;

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) collectSourceFiles(full, acc);
    } else if (SCAN_EXT.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('§4 CI gate: no InteractionManager in library source', () => {
  const files = collectSourceFiles(SRC_ROOT);

  it('finds source files to scan (sanity)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('contains no reference to InteractionManager in any source file', () => {
    const offenders = files.filter((file) => readFileSync(file, 'utf8').includes(FORBIDDEN));
    if (offenders.length > 0) {
      throw new Error(
        `§4 of handover.md forbids the substring "${FORBIDDEN}" anywhere in library ` +
          `source (even in comments): gating rendering on it breaks the web reveal — ` +
          `empty grid after a category change. Use requestAnimationFrame or measured ` +
          `layout instead (see src/core/useReveal.ts), and scrub the word from doc ` +
          `comments too. Offending file(s):\n` +
          offenders.join('\n')
      );
    }
    expect(offenders).toEqual([]);
  });
});
