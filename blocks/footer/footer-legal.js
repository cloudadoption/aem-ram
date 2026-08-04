/*
 * Live closes its footer with a centred row of legal links and a copyright line.
 * This footer had neither until the row was authored into the ten footer
 * documents, with live's own labels and our own hrefs: live's three answer 404.
 *
 * The row is found by its © rather than by position. A `:last-child` selector on
 * the section would be true only because the tool appends this row last.
 */

// The airline name alone is in 72 other footer links, so the year is part of it.
const NOTICE = /©\s*\d{4}/;

const markIn = (container) => {
  const children = [...(container.children || [])];
  const copy = children.find((child) => child.tagName === 'P' && NOTICE.test(child.textContent || ''));
  if (!copy || container.classList.contains('footer-legal')) return 0;
  container.classList.add('footer-legal');
  copy.classList.add('footer-legal-copy');
  return 1;
};

const markLegalRow = (root, depth = 6) => {
  if (!root || depth < 0) return 0;
  const nested = [...(root.children || [])]
    .reduce((total, child) => total + markLegalRow(child, depth - 1), 0);
  return markIn(root) + nested;
};

export default markLegalRow;
export { markLegalRow };
