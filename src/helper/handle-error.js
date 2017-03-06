export default function handleError() {
  return (error) => {
    if (!error.status) {
      return;
    }

    error
      .response
      .status(error.status)
      .end(error.toString());
  };
}
