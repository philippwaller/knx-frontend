/** Resolve against the gallery document, including when it is hosted below /pr/<id>/. */
export const galleryUrl = (relativePath: string): string =>
  new URL(relativePath, document.baseURI).href;
