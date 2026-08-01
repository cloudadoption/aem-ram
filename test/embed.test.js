import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toEmbedUrl } from '../blocks/embed/embed.js';

describe('toEmbedUrl', () => {
  it('normalizes a youtube watch link to the embed form', () => {
    assert.equal(
      toEmbedUrl('https://www.youtube.com/watch?v=sk8V_7Xj-Us'),
      'https://www.youtube.com/embed/sk8V_7Xj-Us',
    );
  });

  it('normalizes a youtu.be short link', () => {
    assert.equal(
      toEmbedUrl('https://youtu.be/xdmEyf4XKSE'),
      'https://www.youtube.com/embed/xdmEyf4XKSE',
    );
  });

  // Live serves embed URLs with ?controls=0; the migration carries them verbatim
  // and the params must survive.
  it('keeps an already-embed youtube url unchanged, params included', () => {
    assert.equal(
      toEmbedUrl('https://www.youtube.com/embed/sk8V_7Xj-Us?controls=0'),
      'https://www.youtube.com/embed/sk8V_7Xj-Us?controls=0',
    );
  });

  it('keeps a hubspot form frame url unchanged', () => {
    const src = 'https://js-eu1.hsforms.net/forms/embed/frame.html?portalId=139488216';
    assert.equal(toEmbedUrl(src), src);
  });

  it('returns null for any other url, so the link renders as a link', () => {
    assert.equal(toEmbedUrl('https://example.com/page'), null);
    assert.equal(toEmbedUrl('not a url'), null);
  });

  // The host check is anchored at a dot: a registered domain merely ending in
  // the allowed suffix must not be framed.
  it('rejects lookalike hosts that end in an allowed suffix', () => {
    assert.equal(toEmbedUrl('https://evilyoutube.com/watch?v=abc'), null);
    assert.equal(toEmbedUrl('https://evilyoutube.com/embed/abc'), null);
    assert.equal(toEmbedUrl('https://evilhsforms.net/forms/embed/frame.html'), null);
  });
});
