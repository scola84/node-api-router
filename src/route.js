import pathToRegexp from 'path-to-regexp';
import series from 'async-series';
import matchVersion from './helper/match-version';

export default class Route {
  constructor(method, url, handlers) {
    const [path, version = ''] = url.split('@');

    this._method = method;
    this._path = path;
    this._version = version;
    this._handlers = handlers;
    this._keys = [];
    this._regexp = pathToRegexp(path, this._keys);
  }

  handle(request, response, next) {
    request.allowedMethods.push(this._method);
    const matchedPath = this._regexp.exec(request.path);

    if (!matchedPath ||
      request.method !== this._method ||
      !matchVersion(request, this._version)) {

      return next();
    }

    request.matchedPath = this._path;
    request.matchedMethod = this._method;
    request.matchedVersion = this._version || '*';
    request.params = this._createParams(this._keys, matchedPath);

    return series(this._handlers.map((handler) => {
      return (callback) => {
        handler(request, response, callback);
      };
    }), next);
  }

  _createParams(keys, match) {
    const params = {};

    keys.forEach((key, index) => {
      params[key.name] = match[index + 1];
    });

    return params;
  }
}
