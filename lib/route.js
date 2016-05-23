const pathToRegexp = require('path-to-regexp');
const series = require('async-series');
const matchVersion = require('./helper/match-version');

class Route {
  constructor(method, url, handlers) {
    const [path, version = ''] = url.split('@');

    this.method = method;
    this.path = path;
    this.version = version;
    this.handlers = handlers;
    this.regexp = pathToRegexp(path + '*', this.keys);
  }

  handle(request, response, next) {
    if (this.regexp.exec(request.path)) {
      request.matchedPath = this.path;
      request.allowedMethods.push(this.method);

      if (request.method === this.method) {
        request.matchedMethod = this.method;

        if (matchVersion(request, this.version)) {
          request.matchedVersion = this.version || '*';

          return series(this.handlers.map((handler) => {
            return (callback) => {
              handler(request, response, callback);
            };
          }), next);
        }
      }
    }

    return next();
  }
}

module.exports = Route;
