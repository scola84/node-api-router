import strings from './src/i18n/strings';

export { default as Router } from './src/router';
export { default as handleError } from './src/helper/handle-error';

export function load(app) {
  app.i18n().strings(strings);
}
