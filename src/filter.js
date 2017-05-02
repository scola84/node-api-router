import series from 'async/series';
import pathToRegexp from 'path-to-regexp';
import { debuglog } from 'util';

export default class Filter {
  constructor() {
    this._log = debuglog('router');

    this._path = null;
    this._handlers = [];
    this._regexp = null;
  }

  path(value = null) {
    if (value === null) {
      return this._path;
    }

    this._path = value;
    this._regexp = pathToRegexp(this._path + '*');

    return this;
  }

  handlers(value = null) {
    if (value === null) {
      return this._handlers;
    }

    this._handlers = value;
    return this;
  }

  handleRequest(request, response, next) {
    this._log('Filter handleRequest %s %s (%s)', request.method(),
      request.path(), this._path);

    const match = this._regexp.exec(request.path());

    if (match === null) {
      next();
      return;
    }

    series(this._handlers.map((handler) => {
      return (callback) => {
        try {
          handler(request, response, callback);
        } catch (error) {
          next(error);
        }
      };
    }), next);
  }
}
