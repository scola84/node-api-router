export default function errorHandler(error, request, response) {
  const match = error.message.match(/(\d{3})\s(\w*)(\s(.*))?/);

  if (!match) {
    return;
  }

  const status = Number(match[1]);
  let message = match[2];

  if (match[4] && status < 500) {
    message += ' ' + match[4];
  }

  response.clear();
  response.removeHeader('Content-Type');
  response.removeHeader('Content-Encoding');
  response.writeHead(status);
  response.end(message);
}
