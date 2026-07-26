/**
 * Theme system — verifies `darkTheme` is a complete counterpart to the light
 * `defaultTheme` (identical key structure, but actually different colors), and
 * that `mergeTheme` layers a partial override over whichever base is chosen.
 */
import { darkTheme, defaultTheme } from '../defaultTheme';
import { mergeTheme } from '../mergeTheme';

/** Recursively collect dotted key paths of a nested object. */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v)
      ? keyPaths(v as Record<string, unknown>, path)
      : [path];
  });
}

describe('darkTheme', () => {
  it('has exactly the same key structure as the light defaultTheme', () => {
    expect(keyPaths(darkTheme).sort()).toEqual(keyPaths(defaultTheme).sort());
  });

  it('actually differs from the light theme (real dark surfaces)', () => {
    expect(darkTheme.container).not.toBe(defaultTheme.container);
    expect(darkTheme.search.text).not.toBe(defaultTheme.search.text);
  });
});

describe('mergeTheme over a chosen base', () => {
  it('layers a partial override on the dark base, keeping other dark tokens', () => {
    const merged = mergeTheme(darkTheme, { container: '#123456' });
    expect(merged.container).toBe('#123456'); // overridden
    expect(merged.search.text).toBe(darkTheme.search.text); // untouched dark token
    expect(merged.category.iconActive).toBe(darkTheme.category.iconActive);
  });

  it('does not mutate the base theme', () => {
    const before = darkTheme.container;
    mergeTheme(darkTheme, { container: '#000000' });
    expect(darkTheme.container).toBe(before);
  });
});
