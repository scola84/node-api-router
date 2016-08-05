export default function errorHandler(error, request, response) {
  if (!error.status) {
    return;
  }

  response.clear();
  response.removeHeader('Content-Type');
  response.removeHeader('Content-Encoding');
  response.writeHead(error.status);
  response.end(error.toString());
}
