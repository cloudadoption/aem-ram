/**
 * Turns an authored link into the URL the iframe should load.
 *
 * Youtube watch and youtu.be forms normalize to the embed form. A URL that is
 * already an embed (youtube with live's ?controls=0 params, a hubspot form
 * frame) passes through verbatim. Anything else returns null and the link
 * renders as a link, so an author's stray URL never becomes a frame.
 *
 * This lives outside the block because the autoblock in `scripts.js` has to make
 * the same decision before any block script loads, and the host allowlist must
 * not exist in two places.
 *
 * @param {string} href the authored link
 * @returns {string|null} the iframe src, or null to leave the link alone
 */
export function toEmbedUrl(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const host = url.hostname;
  const isHost = (allowed) => host === allowed || host.endsWith(`.${allowed}`);
  if (host === 'youtu.be') return `https://www.youtube.com/embed${url.pathname}`;
  if (isHost('youtube.com')) {
    if (url.pathname.startsWith('/embed/')) return href;
    const id = url.searchParams.get('v');
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (isHost('hsforms.net')) return href;
  return null;
}

/**
 * Whether a paragraph holds nothing but one embeddable link.
 *
 * The migration emits live's embed URL alone in its own paragraph, linked to itself, which is
 * the shape Edge Delivery autoblocks on. Without this the URL renders as visible text: both
 * /en-gb/dreamafrica-meetmorocco and /en-gb/gateway-to-morocco read as carrying text live does
 * not have. A link inside a sentence is left alone, because replacing it with a frame would
 * take the sentence with it.
 *
 * @param {Element} paragraph the candidate paragraph
 * @returns {boolean} true when it should become an embed block
 */
export function isBareEmbedLink(paragraph) {
  if (!paragraph) return false;
  const children = [...(paragraph.children || [])];
  if (children.length !== 1) return false;
  const [link] = children;
  if ((link.tagName || '').toUpperCase() !== 'A') return false;
  const own = (paragraph.textContent || '').trim();
  if (!own || own !== (link.textContent || '').trim()) return false;
  return Boolean(toEmbedUrl(link.href));
}

/**
 * The iframe's accessible name. The migrated documents link the embed URL to itself, so the
 * link text is a URL and would read out as one; anything that parses as a URL is discarded in
 * favour of the generic label.
 *
 * @param {string} label the link's own text
 * @returns {string} the title to put on the iframe
 */
export function embedTitle(label) {
  const text = (label || '').trim();
  if (!text) return 'Embedded content';
  return URL.canParse(text) ? 'Embedded content' : text;
}
