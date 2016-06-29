import EventEmitter from 'events';
import pathToRegexp from 'path-to-regexp';
import series from 'async-series';
import matchVersion from './helper/match-version';

import Filter from './filter';
import Route from './route';

export default class Router extends EventEmitter {
  constructor(url = '') {
    super();

    const [path, version = ''] = url.split('@');

    this._path = path;
    this._version = version;

    this._keys = [];
    this._layers = [];
    this._regexp = pathToRegexp(path + '*', this._keys);
  }

  mount(path) {
    const router = new Router(this._path + path, this);
    this._layers.push(router);

    return router;
  }

  filter(path, callback) {
    if (typeof path === 'function') {
      callback = path;
      path = '';
    }

    const filter = new Filter(this._path + path, callback);
    this._layers.push(filter);

    return filter;
  }

  get(...args) {
    return this._route('GET', ...args);
  }

  post(...args) {
    return this._route('POST', ...args);
  }

  put(...args) {
    return this._route('PUT', ...args);
  }

  delete(...args) {
    return this._route('DELETE', ...args);
  }

  handleRequest(request, response) {
    const requestLine = request.method + ' ' + request.url;

    this._handle(request, response, (error) => {
      if (error) {
        this._emitError(error.message, request, response);
      } else if (!request.matchedPath) {
        this._emitError('404 Route ' + requestLine, request, response);
      } else if (!request.matchedMethod) {
        response.setHeader('Allow', request.allowedMethods.join(', '));
        this._emitError('405 Method ' + requestLine, request, response);
      } else if (!request.matchedVersion) {
        this._emitError('404 Version ' + requestLine, request, response);
      }
    });
  }

  _route(method, path, ...callbacks) {
    const route = new Route(method, this._path + path, callbacks);
    this._layers.push(route);

    return route;
  }

  _handle(request, response, next) {
    const match = this._regexp.exec(request.path) &&
      matchVersion(request, this._version);

    if (match) {
      return series(this._layers.map((layer) => {
        return (callback) => {
          layer.handle(request, response, callback);
        };
      }), next);
    }

    return next && next();
  }

  _emitError(message, request, response) {
    this.emit('error', new Error(message), request, response);
  }
}
