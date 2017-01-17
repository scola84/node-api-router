import pathToRegexp from 'path-to-regexp';

export default class Filter {
  constructor() {
    this._path = null;
    this._callback = null;
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

  callback(value = null) {
    if (value === null) {
      return this._callback;
    }

    this._callback = value;
    return this;
  }

  handleRequest(request, response, next) {
    const match = this._regexp.exec(request.path());

    if (match) {
      this._callback(request, response, next);
      return;
    }

    next();
  }
}
