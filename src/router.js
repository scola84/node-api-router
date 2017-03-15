import series from 'async/series';
import { EventEmitter } from 'events';
import pathToRegexp from 'path-to-regexp';
import { debuglog } from 'util';
import { ScolaError } from '@scola/error';
import matchVersion from './helper/match-version';
import Filter from './filter';
import Route from './route';

export default class Router extends EventEmitter {
  constructor() {
    super();

    this._log = debuglog('router');

    this._url = null;
    this._path = null;
    this._version = null;
    this._parent = null;

    this._keys = [];
    this._regexp = null;
    this._layers = [];

    this.url('');
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
    this._regexp = pathToRegexp(this._path + '*', this._keys);

    return this;
  }

  version(value = null) {
    if (value === null) {
      return this._version;
    }

    this._version = value;
    return this;
  }

  parent(value = null) {
    if (value === null) {
      return this._parent;
    }

    this._parent = value;
    return this;
  }

  mount(path) {
    const router = new Router()
      .url(this._path + path)
      .parent(this);

    this._layers.push(router);
    return router;
  }

  filter(path, callback) {
    if (typeof path === 'function') {
      callback = path;
      path = '';
    }

    const filter = new Filter()
      .path(this._path + path)
      .callback(callback);

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

  error(message) {
    return new ScolaError(message);
  }

  handleRequest(request, response, next) {
    this._log('Router handleRequest %s %s (%s)', request.method(),
      request.path(), this._path);

    this._handle(request, response, (error) => {
      if (!this._parent) {
        error = error || this._error(request, response);
      }

      if (error) {
        error.request = request;
        error.response = response;

        return this.emit('error', error);
      }

      return next && next();
    });
  }

  emit(...args) {
    if (this._parent) {
      this._parent.emit(...args);
      return;
    }

    super.emit(...args);
  }

  _route(method, path, ...handlers) {
    if (typeof path === 'function') {
      handlers = [path, ...handlers];
      path = '/';
    }

    if (handlers[handlers.length - 1] === false) {
      this._delete(method, this._path + path, handlers.slice(0, -1));
      return null;
    }

    const route = new Route()
      .method(method)
      .path(this._path + path)
      .handlers(handlers);

    this._layers.push(route);
    return route;
  }

  _delete(method, url, handlers) {
    for (let i = this._layers.length - 1; i >= 0; i -= 1) {
      if (this._layers[i].is(method, url, handlers)) {
        this._layers.splice(i, 1);
      }
    }
  }

  _handle(request, response, next) {
    const match = this._regexp.exec(request.path()) &&
      matchVersion(request, this._version);

    if (match) {
      return series(this._layers.map((layer) => {
        return (callback) => {
          layer.handleRequest(request, response, callback);
        };
      }), next);
    }

    return next && next();
  }

  _error(request, response) {
    let message = null;

    if (!request.match('path')) {
      message = '404 invalid_path';
    } else if (!request.match('method')) {
      response.header('Allow', request.allow().join(', '));
      message = '404 invalid_method';
    } else if (!request.match('version')) {
      message = '404 invalid_version';
    }

    if (message) {
      message += ' ' + request.method() + ' ' + request.url();
    }

    return message ? new ScolaError(message) : null;
  }
}
