export default function errorHandler(error, request, response) {
  if (!error.status) {
    return;
  }

  response
    .transformer(false)
    .header('Content-Type', false)
    .header('Content-Encoding', false)
    .status(error.status)
    .end(error.toString());
}
