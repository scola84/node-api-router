export default function errorHandler(error) {
  if (!error.status) {
    return;
  }

  error.response
    .transformer(false)
    .header('Content-Type', false)
    .header('Content-Encoding', false)
    .status(error.status)
    .end(error.toString());
}
