import series from 'async/series';
import isEqual from 'lodash-es/isEqual';
import pathToRegexp from 'path-to-regexp';
import matchVersion from './helper/match-version';

export default class Route {
  constructor() {
    this._method = null;
    this._url = null;
    this._path = null;
    this._version = null;
    this._handlers = null;
    this._keys = [];
    this._regexp = null;
  }

  method(value = null) {
    if (value === null) {
      return this._method;
    }

    this._method = value;
    return this;
  }

  url(value = null) {
    if (value === null) {
      return this._url;
    }

    this._url = value;

    const [path, version = ''] = this._url.split('@');

    this._path(path);
    this._version(version);

    return this;
  }

  path(value = null) {
    if (value === null) {
      return this._path;
    }

    this._path = value;
    this._regexp = pathToRegexp(this._path, this._keys);

    return this;
  }

  version(value = null) {
    if (value === null) {
      return this._version;
    }

    this._version = value;
    return this;
  }

  handlers(value = null) {
    if (value === null) {
      return this._handlers;
    }

    this._handlers = value;
    return this;
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
