module.exports = (logger) => {
  return (error, request, response) => {
    const match = error.message.match(/(\d{3})\s(.*)/);

    if (match && response) {
      const status = Number(match[1]);
      let message = match[1];

      if (match[2] && status === 400) {
        message += ' ' + match[2];
      }

      response.clear();
      response.removeHeader('Content-Type');
      response.removeHeader('Content-Encoding');
      response.writeHead(status);
      response.end(message);
    }

    if (logger) {
      logger.error((request && request.address) + ' - - ' + error.message);
    }
  };
};
