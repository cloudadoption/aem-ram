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
export default function copyIntrinsicSize(from, to) {
  if (!from || !to) return;
  const width = Number(from.getAttribute('width'));
  const height = Number(from.getAttribute('height'));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
  if (to.getAttribute('width') || to.getAttribute('height')) return;
  to.setAttribute('width', width);
  to.setAttribute('height', height);
}
