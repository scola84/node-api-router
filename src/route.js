import series from 'async/series';
import isEqual from 'lodash-es/isEqual';
import pathToRegexp from 'path-to-regexp';
import matchVersion from './helper/match-version';

export default class Route {
  constructor(method, url, handlers) {
    const [path, version = ''] = url.split('@');

    this._method = method;
    this._url = url;
    this._path = path;
    this._version = version;
    this._handlers = handlers;
    this._keys = [];
    this._regexp = pathToRegexp(path, this._keys);
  }

  method() {
    return this._method;
  }

  url() {
    return this._url;
  }

  path() {
    return this._path;
  }

  version() {
    return this._version;
  }

  handlers() {
    return this._handlers;
  }

  is(method, url, handlers) {
    return isEqual(this._method, method) &&
      isEqual(this._url, url) &&
      isEqual(this._handlers, handlers);
  }

  handleRequest(request, response, next) {
    request.allow(this._method);
    const matchedPath = this._regexp.exec(request.path());

    if (!matchedPath ||
      request.method() !== this._method ||
      !matchVersion(request, this._version)) {

      return next();
    }

    request.match('path', this._path);
    request.match('method', this._method);
    request.match('version', this._version || '*');
    request.params(this._createParams(this._keys, matchedPath));

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
