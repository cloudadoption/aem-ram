/*
 * Live shows a breadcrumb on 1,366 of 1,506 captures and we showed none. Its styling carries across
 * the theme split where the band around it does not. Measured in a browser on 2026-08-04, on
 * /en-gb/american-airlines (2022 theme) against /en-gb/fiji-airways (2025):
 *   link       14px / 16px, weight 400, rgb(89, 88, 85)
 *   divider    a "|" span, weight 600, rgb(123, 122, 120)
 *   last crumb weight 600, rgb(141, 43, 97), our --ram-brand-primary-dark-color
 *
 * The trail is not derivable from our URLs. /en-gb/american-airlines is flat and live's trail is
 * four levels deep, drawn from its Liferay navigation. It arrives as page metadata instead.
 *
 * THE CRUMBS CARRY NO LINKS. Live's do, and all 45 distinct /en and /en-gb crumb targets answer 404
 * on live while two control URLs answer 200 through the same probe. Against our own estate they
 * resolve 493 of 3,426. So the labels ship and the hrefs wait on a ruling.
 */

// Live's own visible separator, so the authored value reads the way the page renders.
const SEPARATOR = '|';

// A trail of one is the page itself and tells a reader nothing. Live's shortest is three.
const SHORTEST = 2;

export const crumbLabels = (value) => {
  const parts = String(value ?? '')
    .split(SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length >= SHORTEST ? parts : [];
};

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export const breadcrumbHtml = (labels) => {
  if (!labels || !labels.length) return '';
  const items = labels
    .map((label, i) => {
      const current = i === labels.length - 1 ? ' aria-current="page"' : '';
      return `<li${current}>${escapeHtml(label)}</li>`;
    })
    .join('');
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items}</ol></nav>`;
};

/*
 * Insert the trail above the first section, which is where live has it: its band sits at top 80,
 * directly under the header, with the crumbs above the title.
 */
export default function buildBreadcrumb(main, value) {
  const html = breadcrumbHtml(crumbLabels(value));
  if (!html || !main) return 0;
  const section = document.createElement('div');
  section.innerHTML = html;
  main.prepend(section);
  return 1;
}
