/**
 * Platform-specific extra style for the search `TextInput`.
 *
 * Native default: no extra styling. The `.web.ts` sibling supplies web-only
 * affordances (removing the focus outline, text cursor) that have no meaning on
 * native. Kept in its own module so `SearchBar` stays a single shared component.
 */
import type { TextStyle } from 'react-native';

/** No native-specific input styling. */
export const inputPlatformStyle: TextStyle = {};
