import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync(new URL('../blocks/cards/cards.css', import.meta.url), 'utf8');
const declared = css.replace(/\/\*[\s\S]*?\*\//g, '');

// Live crops one card image and no other. link-card__image is the only class on live carrying
// object-fit cover, and its box ratio departs from the image's own, 3.92 against a natural 1.99 at
// 900px wide. Every other card image keeps its ratio: /en-gb/experience/dining-on-board/business
// draws 400x250 at 377x235, /en-gb/cash-miles 703x469 at 377x251, /en-gb/our-fleet 267x75 at 267x75
// and /en-gb/oneworld/global-network scales 1822x293 down to 191x30.
//
// A 200px band for all of them distorted 1,037 of the 1,253 images in this bucket. Ported from
// da-ram, whose transform already marks the link-card block `cover`: over 1,066 blocks holding an
// image, 64 are all link-card, 1,002 have none, and none is mixed.
describe('a card photograph', () => {
  const plain = /\.cards > ul > li\.cards-card-photo img \{[^}]*\}/.exec(declared);
  const cover = /\.cards\.cover > ul > li\.cards-card-photo img \{[^}]*\}/.exec(declared);

  it('keeps its own ratio where live keeps it', () => {
    assert.ok(plain, 'expected a rule for a photo card image');
    assert.match(plain[0], /height:\s*auto/);
    assert.doesNotMatch(plain[0], /height:\s*200px/);
    assert.doesNotMatch(plain[0], /object-fit/);
  });

  // A definite width is what makes the declared width and height reserve the box. Our
  // `main img { width: auto }` leaves the used width indefinite, so the attributes give a ratio and
  // no size and the card is 0 tall until the image arrives. copyIntrinsicSize carries both
  // attributes onto the image createOptimizedPicture builds, so they are there to be used.
  it('takes a definite width, so the declared size reserves the box', () => {
    assert.match(plain[0], /width:\s*100%/);
  });

  it('crops the link-card at live\'s 200px, which is the one live crops', () => {
    assert.ok(cover, 'expected a rule for a cover photo card image');
    assert.match(cover[0], /height:\s*200px/);
    assert.match(cover[0], /object-fit:\s*cover/);
  });
});
