export default function handleError() {
  return (error) => {
    if (typeof error.status === 'undefined') {
      return;
    }

    const string = error.toString();

    error
      .response
      .status(error.status)
      .codec(false)
      .header('Content-Length', string.length)
      .end(string);
  };
}
