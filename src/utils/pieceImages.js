export const pieceImages = {};
export let imagesLoaded = false;
let loadPromise = null;

const pieces = ['wk', 'wq', 'wr', 'wb', 'wn', 'wp', 'bk', 'bq', 'br', 'bb', 'bn', 'bp'];

export function preloadPieceImages() {
  if (loadPromise) return loadPromise;
  
  const promises = pieces.map(name => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        pieceImages[name] = img;
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load piece image: ${name}`);
        resolve(); // resolve anyway to avoid blocking the app
      };
      img.src = `/pieces/${name}.svg`;
    });
  });

  loadPromise = Promise.all(promises).then(() => {
    imagesLoaded = true;
  });
  
  return loadPromise;
}
