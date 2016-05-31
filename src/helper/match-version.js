import { satisfies } from 'semver';

export default function matchVersion(request, version) {
  if (!version) {
    return true;
  }

  if (!request.version) {
    return false;
  }

  if (request.matchedVersion) {
    return false;
  }

  return satisfies(version, request.version);
}
