export default function errorHandler(error, request, response) {
  const match = error.message.match(/((\d{3})\s+\w+)(.*)?/);

  if (!match || !match[2]) {
    return;
  }

  const status = Number(match[2]);
  let message = match[1];

  if (match[3] && status < 500) {
    message += match[3];
  }

  response.clear();
  response.removeHeader('Content-Type');
  response.removeHeader('Content-Encoding');
  response.writeHead(status);
  response.end(message);
}
