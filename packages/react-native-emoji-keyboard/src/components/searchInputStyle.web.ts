/**
 * Web-only extra style for the search `TextInput` (react-native-web).
 *
 * Removes the browser focus outline and shows a text caret — both web-only CSS
 * properties that RN's `TextStyle` doesn't type but react-native-web honors at
 * runtime. Cast through `unknown` so the shared `SearchBar` stays typed while
 * these web CSS keys pass through.
 */
import type { TextStyle } from 'react-native';

export const inputPlatformStyle: TextStyle = {
  outlineStyle: 'none',
  outlineWidth: 0,
  cursor: 'text',
} as unknown as TextStyle;
