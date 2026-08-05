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
 * THE CRUMBS CARRY LINKS since decision 12 was ruled on 2026-08-05. Live's own crumb targets all
 * answer 404 or 301 on live, so 327 rows went into the redirects sheet pointing each at the page
 * live's own redirect names. Swept the 1,418 pages with a trail: 3,519 of 3,520 linkable slots now
 * resolve here. The paths arrive in their own metadata field, because the trail's own field holds
 * labels and there is nowhere in it for an href.
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

/*
 * The paths arrive in their own metadata field, one slot per label in the same order and
 * separated the same way, so a slot can be empty where the crumb has no link. Only a path on
 * this estate: an absolute URL in the field would take a reader off the site.
 */
export const crumbPaths = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  return raw
    .split(SEPARATOR)
    .map((part) => part.trim())
    // A protocol-relative `//host/x` starts with a slash and leaves the site, so it is not a path.
    .map((part) => (part.startsWith('/') && !part.startsWith('//') ? part : ''));
};

export const breadcrumbHtml = (labels, paths) => {
  if (!labels || !labels.length) return '';
  const items = labels
    .map((label, i) => {
      const last = i === labels.length - 1;
      const text = escapeHtml(label);
      // Live leaves the last crumb unlinked, because it is the page you are on.
      const path = last ? '' : (paths?.[i] ?? '');
      const inner = path ? `<a href="${escapeHtml(path)}">${text}</a>` : text;
      return `<li${last ? ' aria-current="page"' : ''}>${inner}</li>`;
    })
    .join('');
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items}</ol></nav>`;
};

/*
 * Insert the trail above the first section, which is where live has it: its band sits at top 80,
 * directly under the header, with the crumbs above the title.
 */
export default function buildBreadcrumb(main, value, pathValue) {
  const html = breadcrumbHtml(crumbLabels(value), crumbPaths(pathValue));
  if (!html || !main) return 0;
  const section = document.createElement('div');
  section.innerHTML = html;
  main.prepend(section);
  return 1;
}
