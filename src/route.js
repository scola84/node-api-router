import pathToRegexp from 'path-to-regexp';
import series from 'async-series';
import matchVersion from './helper/match-version';

export default class Route {
  constructor(method, url, handlers) {
    const [path, version = ''] = url.split('@');

    this.method = method;
    this.path = path;
    this.version = version;
    this.handlers = handlers;
    this.keys = [];
    this.regexp = pathToRegexp(path, this.keys);
  }

  createParams(keys, match) {
    const params = {};

    keys.forEach((key, index) => {
      params[key.name] = match[index + 1];
    });

    return params;
  }

  handle(request, response, next) {
    const matchedPath = this.regexp.exec(request.path);

    if (matchedPath) {
      request.matchedPath = this.path;
      request.allowedMethods.push(this.method);
      request.params = this.createParams(this.keys, matchedPath);

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
