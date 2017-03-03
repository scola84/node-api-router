import Router from './src/router';
import handleError from './src/helper/handle-error';
import strings from './src/i18n/strings';

function load(app) {
  if (app.i18n()) {
    app.i18n().strings(strings);
  }
}

export {
  Router,
  handleError,
  load
};
