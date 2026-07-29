/**
 * §1 · bundled locale packs — resolution, fallback, and merge with `translation`.
 */
import { AVAILABLE_LOCALES, getLocalePack, resolveTranslation } from '../locales';

test('ships a meaningful set of locale packs, each covering the 9 categories', () => {
  expect(AVAILABLE_LOCALES.length).toBeGreaterThanOrEqual(20);
  for (const locale of ['es', 'fr', 'de', 'ja', 'ru', 'zh']) {
    const pack = getLocalePack(locale);
    expect(pack).toBeDefined();
    expect(Object.keys(pack ?? {})).toHaveLength(9);
  }
});

test('resolves exact locale codes to translated labels', () => {
  expect(getLocalePack('es')?.smileys_emotion).toBe('Emoticonos y emoción');
  expect(getLocalePack('fr')?.food_drink).toBeDefined();
});

test('is case-insensitive and normalizes separators', () => {
  expect(getLocalePack('ES')).toEqual(getLocalePack('es'));
  expect(getLocalePack('zh_Hant')).toEqual(getLocalePack('zh-hant'));
});

test('falls back from a region tag to the base language', () => {
  expect(getLocalePack('es-ES')).toEqual(getLocalePack('es'));
  expect(getLocalePack('pt-BR')).toEqual(getLocalePack('pt'));
});

test('returns undefined for an unknown or missing locale', () => {
  expect(getLocalePack('xx')).toBeUndefined();
  expect(getLocalePack(undefined)).toBeUndefined();
  expect(getLocalePack('')).toBeUndefined();
});

test('resolveTranslation merges the pack under an explicit override', () => {
  const merged = resolveTranslation('es', { smileys_emotion: 'Caritas', favorites: 'Favoritos' });
  // Override wins for provided keys…
  expect(merged?.smileys_emotion).toBe('Caritas');
  expect(merged?.favorites).toBe('Favoritos');
  // …pack fills the rest.
  expect(merged?.flags).toBe(getLocalePack('es')?.flags);
});

test('resolveTranslation passes translation through when no pack matches', () => {
  const t = { favorites: 'Favs' };
  expect(resolveTranslation('xx', t)).toBe(t);
  expect(resolveTranslation(undefined, undefined)).toBeUndefined();
});
