/**
 * `EmojiPicker.Root` — the provider + themed container for the composable
 * primitives (§5 · frimousse parity). Picks a light/dark base theme from
 * `colorScheme`, wraps children in a `ThemeProvider` and the headless
 * `EmojiPickerStateProvider`, and renders a flex column container. All picker
 * state (search, skin tone, data, keyboard focus) is owned here and read by the
 * child primitives via context.
 */
import * as React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { EmojiPickerStateProvider } from '../../core';
import type { EmojiPickerStateOptions } from '../../core';
import { darkTheme, defaultTheme, ThemeProvider, useTheme } from '../../theme';
import type { RecursivePartial, Styles, Theme } from '../../types';

export type EmojiPickerRootProps = EmojiPickerStateOptions & {
  children: React.ReactNode;
  /** Partial token overrides merged over the chosen base theme. */
  theme?: RecursivePartial<Theme>;
  /** Partial style overrides. */
  styles?: RecursivePartial<Styles>;
  /** Base color scheme; `'auto'` follows the OS. Defaults to `'light'`. */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Style for the root container (e.g. a fixed height). */
  style?: StyleProp<ViewStyle>;
};

/** Themed flex container — separated so it can read `useTheme` for its bg. */
function RootContainer(props: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[localStyles.root, { backgroundColor: theme.container }, props.style]}>
      {props.children}
    </View>
  );
}

export function EmojiPickerRoot(props: EmojiPickerRootProps): React.ReactElement {
  const { children, theme, styles, colorScheme, style, ...stateOptions } = props;

  const systemScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const effective = scheme === 'auto' ? (systemScheme ?? 'light') : scheme;
  const baseTheme = effective === 'dark' ? darkTheme : defaultTheme;

  return (
    <ThemeProvider theme={theme} styles={styles} baseTheme={baseTheme}>
      <EmojiPickerStateProvider {...stateOptions}>
        <RootContainer style={style}>{children}</RootContainer>
      </EmojiPickerStateProvider>
    </ThemeProvider>
  );
}

const localStyles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
});

EmojiPickerRoot.displayName = 'EmojiPicker.Root';
