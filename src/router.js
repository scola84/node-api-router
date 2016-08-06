import EventEmitter from 'events';
import pathToRegexp from 'path-to-regexp';
import series from 'async-series';
import { ScolaError } from '@scola/error';
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

  sub(...args) {
    return this._route('SUB', ...args);
  }

  pub(...args) {
    return this._route('PUB', ...args);
  }

  handleRequest(request, response) {
    this._handle(request, response, (error) => {
      error = error || this._error(request, response);

      if (error) {
        this.emit('error', error, request, response);
      }
    });
  }

  _route(method, path, ...callbacks) {
    const route = new Route(method, this._path + path, callbacks);
    this._layers.push(route);

    return route;
  }

  _handle(request, response, next) {
    const match = this._regexp.exec(request.path()) &&
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
