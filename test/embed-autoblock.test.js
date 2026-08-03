import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { embedTitle, isBareEmbedLink } from '../scripts/embed-url.js';

// A paragraph stands in as an object with children and textContent, the same way the
// accordion and table tests stand in for cells.
const para = (links, text) => ({
  children: links.map((href) => ({ tagName: 'A', href, textContent: href })),
  textContent: text ?? links.join(' '),
});

describe('isBareEmbedLink', () => {
  // The shape the migration emits: live's embed URL alone in its own paragraph, linked to
  // itself. /en-gb/dreamafrica-meetmorocco and /en-gb/gateway-to-morocco both render the URL
  // as visible text today, which reads as text live does not have.
  it('accepts an embed url alone in its paragraph', () => {
    assert.equal(isBareEmbedLink(para(['https://www.youtube.com/embed/_KMGy0hvECQ?controls=0'])), true);
  });

  it('accepts a youtube watch link and a youtu.be link', () => {
    assert.equal(isBareEmbedLink(para(['https://www.youtube.com/watch?v=sk8V_7Xj-Us'])), true);
    assert.equal(isBareEmbedLink(para(['https://youtu.be/xdmEyf4XKSE'])), true);
  });

  it('refuses a link the embed block would not frame', () => {
    assert.equal(isBareEmbedLink(para(['https://www.royalairmaroc.com/en-gb/cash-miles'])), false);
    assert.equal(isBareEmbedLink(para(['https://vimeo.com/12345'])), false);
  });

  it('refuses a link that is part of a sentence', () => {
    const p = para(['https://youtu.be/xdmEyf4XKSE'], 'Watch the film https://youtu.be/xdmEyf4XKSE today');
    assert.equal(isBareEmbedLink(p), false);
  });

  it('refuses a paragraph holding more than the one link', () => {
    assert.equal(isBareEmbedLink(para([
      'https://youtu.be/xdmEyf4XKSE', 'https://youtu.be/sk8V_7Xj-Us',
    ])), false);
  });

  it('refuses a paragraph whose child is not a link', () => {
    assert.equal(isBareEmbedLink({ children: [{ tagName: 'STRONG', textContent: 'x' }], textContent: 'x' }), false);
  });

  it('refuses nothing at all', () => {
    assert.equal(isBareEmbedLink(null), false);
    assert.equal(isBareEmbedLink({ children: [], textContent: '' }), false);
  });
});

// The autoblock's own doing: the migrated documents link the URL to itself, so the block's
// `link.textContent` title made the iframe's accessible name a raw URL on every embed page.
describe('embedTitle', () => {
  it('ignores link text that is just the url', () => {
    assert.equal(
      embedTitle('https://www.youtube.com/embed/_KMGy0hvECQ?controls=0', 'https://www.youtube.com/embed/_KMGy0hvECQ?controls=0'),
      'Embedded content',
    );
  });

  it('ignores link text that is any url', () => {
    assert.equal(embedTitle('https://youtu.be/xdmEyf4XKSE', 'https://www.youtube.com/embed/xdmEyf4XKSE'), 'Embedded content');
  });

  it('keeps a real authored label', () => {
    assert.equal(embedTitle('Dream Africa, meet Morocco', 'https://www.youtube.com/embed/x'), 'Dream Africa, meet Morocco');
  });

  it('falls back when there is no label', () => {
    assert.equal(embedTitle('', 'https://www.youtube.com/embed/x'), 'Embedded content');
    assert.equal(embedTitle('   ', 'https://www.youtube.com/embed/x'), 'Embedded content');
  });
});
