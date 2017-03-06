export default function handleError() {
  return (error) => {
    if (!error.status) {
      return;
    }

    error.response
      .codec(false)
      .header('Content-Type', false)
      .status(error.status)
      .end(error.toString());
  };
}
