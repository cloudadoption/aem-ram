import { declaredIsPhoto } from './card-icons.js';

/**
 * Carry an image's declared intrinsic size onto the picture that replaces it.
 *
 * createOptimizedPicture builds its fallback img with loading, alt and src only, so a card image
 * reserves no space until it arrives and the card reflows around it. The served markup already
 * declares the size, width="60" height="80" on checked-baggage, so nothing has to be measured.
 *
 * Both values are needed for the browser to reserve a box, so a lone width is not carried.
 *
 * @param {Element} from the image the served markup declared
 * @param {Element} to the image createOptimizedPicture built
 */
// The declared attributes reserve nothing on their own: `main img { width: auto; height: auto }`
// makes both used values auto, so the attributes give an aspect ratio and no definite size and the
// box is 0 until the image loads. Sampled every frame, an icon card is 0px tall until 203ms and
// then jumps to 156px. The final box is exactly the declared size, so writing it as an inline pixel
// size reserves precisely what will be occupied.
//
// Icons only. A photo card is styled `width: 100%; height: 200px; object-fit: cover`, so a pixel
// size would fight the CSS; that case reserves its band by being classed during decoration.
export function reserveIconBox(img) {
  if (declaredIsPhoto(img) !== false) return;
  const width = Number(img.getAttribute('width'));
  const height = Number(img.getAttribute('height'));
  if (!Number.isFinite(height) || height <= 0) return;
  img.style.width = `${width}px`;
  img.style.height = `${height}px`;
}

export default function copyIntrinsicSize(from, to) {
  if (!from || !to) return;
  const width = Number(from.getAttribute('width'));
  const height = Number(from.getAttribute('height'));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
  if (to.getAttribute('width') || to.getAttribute('height')) return;
  to.setAttribute('width', width);
  to.setAttribute('height', height);
}
