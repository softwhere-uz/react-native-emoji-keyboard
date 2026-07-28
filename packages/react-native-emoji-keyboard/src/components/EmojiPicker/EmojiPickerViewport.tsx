/**
 * `EmojiPicker.Viewport` — the flex region that holds the `List` and any
 * `Empty` / `Loading` overlays (§5 · frimousse parity). A thin `flex: 1`
 * container so the list fills the space between the search bar and the picker's
 * bottom edge; kept as a named primitive so consumers can target/replace it.
 */
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

export type EmojiPickerViewportProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EmojiPickerViewport(props: EmojiPickerViewportProps): React.ReactElement {
  return <View style={[styles.viewport, props.style]}>{props.children}</View>;
}

const styles = StyleSheet.create({
  viewport: { flex: 1, width: '100%' },
});

EmojiPickerViewport.displayName = 'EmojiPicker.Viewport';
