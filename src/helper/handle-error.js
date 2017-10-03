export default function handleError() {
  return (error) => {
    if (typeof error.status === 'undefined') {
      return;
    }

    error
      .response
      .status(error.status)
      .end(error);
  };
}
