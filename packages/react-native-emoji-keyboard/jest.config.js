/**
 * Jest runs the headless-core tests in a jsdom environment (no React Native
 * runtime required). This is deliberate: the §4 web-reveal guard and the data
 * integrity checks must pass on the web target, so we exercise the pure-React
 * core exactly as the browser would.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      {
        configFile: false,
        babelrc: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
  clearMocks: true,
};
