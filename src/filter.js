import pathToRegexp from 'path-to-regexp';

export default class Filter {
  constructor(path, callback) {
    this._path = path;
    this._callback = callback;
    this._regexp = pathToRegexp(path + '*');
  }

  handle(request, response, next) {
    const match = this._regexp.exec(request.path);

    if (match) {
      this._callback(request, response, next);
      return;
    }

    next();
  }
}
