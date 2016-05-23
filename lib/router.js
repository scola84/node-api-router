const events = require('events');
const pathToRegexp = require('path-to-regexp');
const series = require('async-series');
const matchVersion = require('./helper/match-version');
const Filter = require('./filter');
const Route = require('./route');

class Router extends events.EventEmitter {
  constructor(url = '') {
    super();

    const [path, version = ''] = url.split('@');

    this.path = path;
    this.version = version;

    this.keys = [];
    this.layers = [];
    this.regexp = pathToRegexp(path + '*', this.keys);
  }

  mount(path) {
    const router = new Router(this.path + path, this);
    this.layers.push(router);

    return router;
  }

  filter(path, callback) {
    if (typeof path === 'function') {
      callback = path;
      path = '*';
    }

    const filter = new Filter(this.path + path, callback);
    this.layers.push(filter);

    return filter;
  }

  get(...args) {
    return this.route('GET', ...args);
  }

  post(...args) {
    return this.route('POST', ...args);
  }

  put(...args) {
    return this.route('PUT', ...args);
  }

  delete(...args) {
    return this.route('DELETE', ...args);
  }

  route(method, path, ...callbacks) {
    const route = new Route(method, this.path + path, callbacks);
    this.layers.push(route);

    return route;
  }

  handleRequest(request, response) {
    this.handle(request, response, (error) => {
      if (error) {
        this.emit('error', error, request, response);
      } else if (!request.matchedPath) {
        this.emit('error', new Error('404 Route ' +
          request.method + ' ' + request.url), request, response);
      } else if (!request.matchedMethod) {
        response.setHeader('Allow', request.allowedMethods.join(', '));
        this.emit('error', new Error('405 Method ' +
          request.method + ' ' + request.url), request, response);
      } else if (!request.matchedVersion) {
        this.emit('error', new Error('404 Version ' +
          request.method + ' ' + request.url), request, response);
      }
    });
  }

  handle(request, response, next) {
    const match = this.regexp.exec(request.path) &&
      matchVersion(request, this.version);

    if (match) {
      return series(this.layers.map((layer) => {
        return (callback) => {
          layer.handle(request, response, callback);
        };
      }), next);
    }

    return next && next();
  }
}

module.exports = Router;
