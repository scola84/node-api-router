export default function extractData(request, response, next) {
  const chunks = [];

  request.once('error', (error) => {
    request.removeAllListeners();
    next(error);
  });

  request.on('data', (chunk) => {
    chunks.push(chunk);
  });

  request.once('end', () => {
    request.removeAllListeners();

    let data = null;

    if (chunks.length === 1) {
      data = chunks[0];
    } else if (Buffer.isBuffer(chunks[0])) {
      data = Buffer.concat(chunks);
    } else {
      data = chunks.join('');
    }

    request.data(data);
    next();
  });
}
