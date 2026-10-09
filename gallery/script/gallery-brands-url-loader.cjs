// The pinned HA demo mode loads brand images from the public CDN, which the offline gallery must not reach.
module.exports = function galleryBrandsUrl(source) {
  const original = "`https://brands.home-assistant.io/${options.domain}/";
  if (!source.includes(original)) {
    throw new Error("HA brands URLs changed; review the gallery-only brands adapter");
  }
  return source.replace(original, "`${__STATIC_PATH__}brands/${options.domain}/");
};
