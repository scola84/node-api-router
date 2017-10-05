export default function matchMethod(request, method) {
  if (request.method() === method) {
    return true;
  }

  if (request.method() === 'HEAD' && method === 'GET') {
    return true;
  }

  return false;
}
