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

/** Complete neutral **dark** theme — the auto counterpart to {@link defaultTheme}. */
export const darkTheme: Theme = {
  backdrop: '#000000aa',
  knob: '#5a5a5e',
  container: '#1c1c1e',
  header: '#ffffff99',
  skinTonesContainer: '#2c2c2e',
  category: {
    icon: '#ffffffcc',
    iconActive: '#4aa3df',
    container: '#2c2c2e',
    containerActive: '#0a3d5c',
  },
  search: {
    background: '#ffffff14',
    text: '#ffffffe6',
    placeholder: '#ffffff66',
    icon: '#ffffff66',
  },
  customButton: {
    icon: '#ffffffcc',
    iconPressed: '#4aa3df',
    background: '#2c2c2e',
    backgroundPressed: '#0a3d5c',
  },
  emoji: {
    selected: '#3a3a3c',
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
