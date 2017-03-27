import { satisfies } from 'semver';

export default function matchVersion(request, version = '') {
  if (version.length === 0) {
    return true;
  }

  if (request.version().length === 0) {
    return false;
  }

  if (request.match('version') !== null) {
    return false;
  }

  return satisfies(version, request.version());
}
