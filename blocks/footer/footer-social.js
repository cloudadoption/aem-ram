/*
 * Live closes its footer with "Follow us on" and five links to Facebook, X,
 * Instagram, YouTube and Messenger. The row was authored into the ten footer
 * documents as five TEXT links: live draws its icons with an icon font on
 * private-use codepoints, so a font that fails to load leaves five empty boxes,
 * and each of live's anchors has no visible text and a `title` repeating the URL.
 *
 * Text labels are smaller than icons, and unstyled they were harder to tap than
 * live's. Measured in a browser at 1440 on /en-gb/checked-baggage: live's five are
 * 37x36 with 16px gaps, ours were 18px tall with 4px gaps and the X link 9px wide.
 * So the row needs a box, and the box needs a class to hang on.
 *
 * The row is found by its links rather than by position, the way markLegalRow uses
 * the ©: a :last-child selector would be true only because the tool appends this
 * row last.
 */

const SOCIAL = /^(www\.)?(facebook\.com|twitter\.com|x\.com|instagram\.com|youtube\.com|m\.me|messenger\.com)$/i;

// Two, because one social link among ordinary links is a menu rather than the row.
const MINIMUM = 2;

const isSocial = (anchor) => {
  try {
    return SOCIAL.test(new URL(anchor.href, 'https://example.com').host);
  } catch {
    return false;
  }
};

const markIn = (node) => {
  if (node.tagName !== 'P' || node.classList.contains('footer-social')) return 0;
  const anchors = typeof node.querySelectorAll === 'function' ? [...node.querySelectorAll('a')] : [];
  if (anchors.length < MINIMUM || anchors.some((a) => !isSocial(a))) return 0;
  node.classList.add('footer-social');
  return 1;
};

const markSocialRow = (root, depth = 6) => {
  if (!root || depth < 0) return 0;
  const nested = [...(root.children || [])]
    .reduce((total, child) => total + markSocialRow(child, depth - 1), 0);
  return markIn(root) + nested;
};

export default markSocialRow;
export { markSocialRow };
