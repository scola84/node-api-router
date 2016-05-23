const semver = require('semver');

module.exports = (request, version) => {
  if (!version) {
    return true;
  }

  if (!request.version) {
    return false;
  }

  if (request.matchedVersion) {
    return false;
  }

  return semver.satisfies(version, request.version);
};
