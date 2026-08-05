/*
 * Live lays a run of benefits as a grid of `feature-icon-div` tiles, 397px wide and three across,
 * the icon centred on top and the copy under it. We serve the same content as default content: an
 * icon alone in a full-width paragraph, then its copy, repeating. /de-de/vorteile-von-silver runs
 * 5,145px against live's 3,882, and four of its benefits DID arrive as a cards block, so the
 * component is on the page in two shapes at once.
 *
 * 147 pages serve 483 such icons and 93 of them also carry a cards block. Our cards block at 1280
 * and above is 397px, three across, icon on top, which is live's own shape.
 */

// card-icons.js draws the icon/photo line at 200px, so an icon here is an icon there.
const ICON_MAX_WIDTH = 200;
// An icon plus a title plus copy is the longest tile live writes. More than that is prose.
const MAX_TEXT_PER_TILE = 3;
// One tile is not a grid.
const MIN_TILES = 2;

const isHeading = (el) => /^H[1-6]$/.test(el?.tagName ?? '');

export const isIconParagraph = (el) => {
  if (el?.tagName !== 'P') return false;
  if ((el.textContent ?? '').trim()) return false;
  const images = el.querySelectorAll('img');
  if (images.length !== 1) return false;
  const width = Number(images[0].getAttribute('width'));
  return Number.isFinite(width) && width > 0 && width <= ICON_MAX_WIDTH;
};

// A photograph paragraph is content of its own, so it ends a run rather than joining it.
const endsRun = (el) => isHeading(el) || (el?.tagName === 'P' && !(el.textContent ?? '').trim()
  && el.querySelectorAll('img').length > 0 && !isIconParagraph(el));

export const iconTileSets = (children) => {
  const kids = [...(children ?? [])];
  const sets = [];
  let run = [];
  const flush = () => {
    if (run.length >= MIN_TILES) sets.push(run);
    run = [];
  };
  let i = 0;
  while (i < kids.length) {
    if (!isIconParagraph(kids[i])) {
      if (endsRun(kids[i]) || run.length) flush();
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }
    const start = i;
    i += 1;
    let text = 0;
    while (i < kids.length && !isIconParagraph(kids[i]) && !endsRun(kids[i])) {
      text += 1;
      i += 1;
    }
    if (text > MAX_TEXT_PER_TILE) { run = []; } else { run.push([start, start + 1 + text]); }
  }
  flush();
  return sets;
};
