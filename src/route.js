import series from 'async/series';
import isEqual from 'lodash-es/isEqual';
import pathToRegexp from 'path-to-regexp';
import { debuglog } from 'util';
import extractData from './helper/extract-data';
import matchMethod from './helper/match-method';
import matchVersion from './helper/match-version';

export default class Route {
  constructor() {
    this._log = debuglog('router');

    this._method = null;
    this._url = null;
    this._path = null;
    this._version = null;
    this._handlers = [];
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

    this.path(path);
    this.version(version);

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

  extract() {
    this._handlers.unshift(extractData);
    return this;
  }

  is(method, url, handlers) {
    return isEqual(this._method, method) === true &&
      isEqual(this._url, url) === true &&
      isEqual(this._handlers, handlers) === true;
  }

  handleRequest(request, response, next) {
    this._log('Route handleRequest method=%s path=%s method=%s path=%s',
      request.method(), request.path(), this._method, this._path);

    const matchedPath = this._regexp.exec(request.path());
    const matchedMethod = matchMethod(request, this._method);
    const matchedVersion = matchVersion(request, this._version);

    let match = true;

    if (matchedPath !== null) {
      request.match('path', this._path);
      request.allow(this._method, true);

      if (matchedMethod === true) {
        request.match('method', this._method);

        if (matchedVersion === true) {
          request.match('version', this._version || '*');
        } else {
          match = false;
        }
      } else {
        match = false;
      }
    } else {
      match = false;
    }

    if (match === false) {
      next();
      return;
    }

    request.params(this._createParams(this._keys, matchedPath));

    series(this._handlers.map((handler) => {
      return (callback) => {
        try {
          handler(request, response, callback);
        } catch (error) {
          console.error(error);
        }
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
