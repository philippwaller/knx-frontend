// The pinned HA icon loader assumes an origin-root installation.
module.exports = function galleryIconPath(source) {
  const original = "`/static/mdi/${chunk}.json`";
  if (!source.includes(original)) {
    throw new Error("HA icon loading changed; review the gallery-only path adapter");
  }
  return source.replace(original, "`${__STATIC_PATH__}mdi/${chunk}.json`");
};
