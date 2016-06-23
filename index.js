export { default as errorHandler } from './src/helper/error-handler';

import Router from './src/router';
export { Router };

export function router(url) {
  return new Router(url);
}
