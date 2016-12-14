import buble from 'rollup-plugin-buble';

export default {
  dest: './dist/api-router.js',
  entry: 'index.js',
  format: 'cjs',
  external: [
    '@scola/core',
    'async/series',
    'events',
    'lodash-es/isEqual',
    'path-to-regexp',
    'semver'
  ],
  plugins: [
    buble()
  ]
};
