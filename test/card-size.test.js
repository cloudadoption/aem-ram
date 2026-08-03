import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import copyIntrinsicSize, { reserveIconBox } from '../blocks/cards/card-size.js';

// The served markup carries the intrinsic size on every card image, e.g.
// width="60" height="80" on checked-baggage. cards.js replaces each picture with
// createOptimizedPicture, and aem.js builds that fallback img with loading, alt
// and src only, so the size is dropped and the card reflows once the image
// arrives. Measured with Lighthouse 12.8.2 on mobile: CLS 0.218 and a
// performance score of 89, where the go-live checklist wants 100. Every other
// metric on that page already scores 1.00.
const fakeImg = (attrs = {}) => ({
  attrs,
  getAttribute: (k) => (k in attrs ? attrs[k] : null),
  setAttribute: (k, v) => { attrs[k] = String(v); },
});

describe('copyIntrinsicSize', () => {
  it('carries width and height from the source image to the new one', () => {
    const to = fakeImg();
    copyIntrinsicSize(fakeImg({ width: '60', height: '80' }), to);
    assert.equal(to.attrs.width, '60');
    assert.equal(to.attrs.height, '80');
  });

  it('leaves the target alone when the source declares no size', () => {
    const to = fakeImg();
    copyIntrinsicSize(fakeImg(), to);
    assert.deepEqual(to.attrs, {});
  });

  it('carries neither when only one of the two is declared, since a lone width still reflows', () => {
    const to = fakeImg();
    copyIntrinsicSize(fakeImg({ width: '60' }), to);
    assert.deepEqual(to.attrs, {});
  });

  it('ignores a non-numeric size rather than writing it through', () => {
    const to = fakeImg();
    copyIntrinsicSize(fakeImg({ width: 'auto', height: '80' }), to);
    assert.deepEqual(to.attrs, {});
  });

  it('ignores a zero size, which reserves nothing', () => {
    const to = fakeImg();
    copyIntrinsicSize(fakeImg({ width: '0', height: '80' }), to);
    assert.deepEqual(to.attrs, {});
  });

  it('does not overwrite a size the new image already has', () => {
    const to = fakeImg({ width: '750', height: '500' });
    copyIntrinsicSize(fakeImg({ width: '60', height: '80' }), to);
    assert.equal(to.attrs.width, '750');
    assert.equal(to.attrs.height, '500');
  });

  it('survives a missing target without throwing', () => {
    assert.doesNotThrow(() => copyIntrinsicSize(fakeImg({ width: '60', height: '80' }), null));
    assert.doesNotThrow(() => copyIntrinsicSize(null, fakeImg()));
  });
});

// The declared attributes reserve nothing, because `main img { width: auto; height: auto }` makes both
// used values auto: the attributes give an aspect ratio and no definite size. Sampled every frame on
// /en-gb/checked-baggage, the card is 0px tall with the image box at 0 until the image loads at 203ms,
// then jumps to 156px. The final box is exactly the declared size, 60x80, 61x59 and 78x74, so writing
// those as an inline style reserves precisely what the image will occupy.
//
// Only for an icon. A photo card is styled `width: 100%; height: 200px; object-fit: cover`, so an inline
// pixel size would fight the CSS; that case reserves its band by being classed during decoration.
describe('reserveIconBox', () => {
  const fakeImg = (attrs = {}) => ({
    attrs,
    style: {},
    getAttribute: (k) => (k in attrs ? attrs[k] : null),
  });

  it('writes the declared size as an inline pixel size', () => {
    const img = fakeImg({ width: '61', height: '59' });
    reserveIconBox(img);
    assert.equal(img.style.width, '61px');
    assert.equal(img.style.height, '59px');
  });

  it('leaves an image with no declared size alone', () => {
    const img = fakeImg();
    reserveIconBox(img);
    assert.deepEqual(img.style, {});
  });

  it('leaves a photo alone, because its CSS box is not its declared box', () => {
    const img = fakeImg({ width: '395', height: '250' });
    reserveIconBox(img);
    assert.deepEqual(img.style, {});
  });

  it('leaves a non-numeric or zero size alone', () => {
    for (const attrs of [{ width: 'auto', height: '59' }, { width: '0', height: '59' }]) {
      const img = fakeImg(attrs);
      reserveIconBox(img);
      assert.deepEqual(img.style, {});
    }
  });

  it('survives a missing image', () => {
    assert.doesNotThrow(() => reserveIconBox(null));
  });
});
