import { embedTitle, toEmbedUrl } from '../../scripts/embed-url.js';

// Re-exported so the block stays the one place a caller has to know about.
export { toEmbedUrl };

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const link = block.querySelector('a');
  const src = link ? toEmbedUrl(link.href) : null;
  if (!src) return;

  const title = embedTitle(link.textContent);
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
