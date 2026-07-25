/**
 * The default neutral **light** theme and an empty `Styles` object.
 *
 * `defaultTheme` fills every key of the `Theme` color-token type with readable
 * hex colors. `emptyStyles` provides an empty `{}` style object for every key
 * of `Styles` so consumers can start from a well-formed base and override only
 * what they need.
 */
import type { Styles, Theme } from '../types';

/** Complete, sensible neutral light theme. */
export const defaultTheme: Theme = {
  backdrop: '#00000055',
  knob: '#ffffff',
  container: '#ffffff',
  header: '#00000099',
  skinTonesContainer: '#e3dbcd',
  category: {
    icon: '#000000',
    iconActive: '#005b96',
    container: '#e3dbcd',
    containerActive: '#b1d5e5',
  },
  search: {
    background: '#00000011',
    text: '#000000cc',
    placeholder: '#00000055',
    icon: '#00000055',
  },
  customButton: {
    icon: '#000000',
    iconPressed: '#005b96',
    background: '#e3dbcd',
    backgroundPressed: '#b1d5e5',
  },
  emoji: {
    selected: '#e3dbcd',
  },
};

/** Empty `Styles` — an empty `{}` style object for every key. */
export const emptyStyles: Styles = {
  container: {},
  header: {},
  knob: {},
  category: {
    container: {},
    icon: {},
  },
  searchBar: {
    container: {},
    text: {},
  },
  emoji: {
    selected: {},
  },
};
