import pathToRegexp from 'path-to-regexp';

export default class Filter {
  constructor(path = '', callback) {
    this.path = path;
    this.callback = callback;
    this.regexp = pathToRegexp(path + '*', this.keys);
  }

  handle(request, response, next) {
    const match = this.regexp.exec(request.path);

    if (match) {
      this.callback(request, response, next);
      return;
    }

    next();
  }
}
