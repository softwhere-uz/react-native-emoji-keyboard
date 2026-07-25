/**
 * React context carrying the resolved `{ theme, styles }` pair.
 *
 * `ThemeProvider` merges partial `theme` / `styles` props against the defaults
 * (memoized) and provides the result. `useTheme` / `useStyles` read it, falling
 * back to `defaultTheme` / `emptyStyles` when no provider is present. Web-safe:
 * no react-native import, no direct DOM access.
 */
import type * as React from 'react';
import { createContext, createElement, useContext, useMemo } from 'react';

import type { RecursivePartial, Styles, Theme } from '../types';
import { defaultTheme, emptyStyles } from './defaultTheme';
import { mergeStyles, mergeTheme } from './mergeTheme';

/** The resolved theming payload shared through context. */
export type ResolvedTheme = {
  theme: Theme;
  styles: Styles;
};

const DEFAULT_RESOLVED: ResolvedTheme = {
  theme: defaultTheme,
  styles: emptyStyles,
};

const ThemeContext = createContext<ResolvedTheme>(DEFAULT_RESOLVED);

export type ThemeProviderProps = {
  theme?: RecursivePartial<Theme>;
  styles?: RecursivePartial<Styles>;
  children: React.ReactNode;
};

/** Provides a resolved `{ theme, styles }` derived from the partial overrides. */
export function ThemeProvider({ theme, styles, children }: ThemeProviderProps): React.ReactElement {
  const value = useMemo<ResolvedTheme>(
    () => ({
      theme: mergeTheme(defaultTheme, theme),
      styles: mergeStyles(emptyStyles, styles),
    }),
    [theme, styles],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

/** Read the resolved color-token theme (defaults to `defaultTheme`). */
export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

/** Read the resolved style overrides (defaults to `emptyStyles`). */
export function useStyles(): Styles {
  return useContext(ThemeContext).styles;
}
