// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// The example app lives one level below the monorepo root.
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the monorepo packages so edits to the linked libs hot-reload.
config.watchFolders = [path.resolve(monorepoRoot, 'packages')];

// 2. Resolve modules from the app first, then the monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Honor the packages' `exports`/`react-native` fields so the linked libs
//    resolve their TypeScript source entry (src/index.ts) directly.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
