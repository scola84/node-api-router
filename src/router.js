import series from 'async/series';
import { EventEmitter } from 'events';
import pathToRegexp from 'path-to-regexp';
import { ScolaError } from '@scola/error';
import matchVersion from './helper/match-version';
import Filter from './filter';
import Route from './route';

export default class Router extends EventEmitter {
  constructor(url = '', parent) {
    super();

    const [path, version = ''] = url.split('@');

    this._path = path;
    this._version = version;
    this._parent = parent;

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

  sub(...args) {
    return this._route('SUB', ...args);
  }

  pub(...args) {
    return this._route('PUB', ...args);
  }

  handleRequest(request, response, next) {
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

    const route = new Route(method, this._path + path, handlers);
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
    let error = null;

    if (!request.match('path')) {
      error = new ScolaError('404 invalid_path');
    } else if (!request.match('method')) {
      response.header('Allow', request.allow().join(', '));
      error = new ScolaError('404 invalid_method');
    } else if (!request.match('version')) {
      error = new ScolaError('404 invalid_version');
    }

    if (error) {
      error.message += ' ' + request.method() + ' ' + request.url();
    }

    return error;
  }
}
