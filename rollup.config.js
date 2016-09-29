import buble from 'rollup-plugin-buble';

export default {
  dest: './dist/api-router.js',
  entry: 'index.js',
  format: 'cjs',
  external: [
    '@scola/error',
    'async/series',
    'events',
    'path-to-regexp',
    'semver'
  ],
  plugins: [
    buble()
  ]
};
