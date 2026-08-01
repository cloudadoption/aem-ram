/**
 * Turns an authored link into the URL the iframe should load.
 *
 * Youtube watch and youtu.be forms normalize to the embed form. A URL that is
 * already an embed (youtube with live's ?controls=0 params, a hubspot form
 * frame) passes through verbatim. Anything else returns null and the link
 * renders as a link, so an author's stray URL never becomes a frame.
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
  if (host === 'youtu.be') return `https://www.youtube.com/embed${url.pathname}`;
  if (host.endsWith('youtube.com')) {
    if (url.pathname.startsWith('/embed/')) return href;
    const id = url.searchParams.get('v');
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host.endsWith('hsforms.net')) return href;
  return null;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const link = block.querySelector('a');
  const src = link ? toEmbedUrl(link.href) : null;
  if (!src) return;

  const title = link.textContent.trim() || 'Embedded content';
  block.textContent = '';
  const frame = document.createElement('div');
  frame.className = 'embed-frame';
  block.append(frame);

  // The iframe loads only when the block scrolls near the viewport, so a video
  // below the fold costs nothing at LCP.
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = title;
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'encrypted-media; picture-in-picture');
    frame.append(iframe);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
