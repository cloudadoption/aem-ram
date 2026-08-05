import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const cards = readFileSync(new URL('../blocks/cards/cards.css', import.meta.url), 'utf8');
// Assertions about what the file declares must not read its comments.
const declarations = cards.replace(/\/\*[\s\S]*?\*\//g, '');

// Measured on live at 375, 768, 992, 1200, 1280, 1360 and 1440 on
// /en-gb/preparing-your-trip, and confirmed at 1440 on checked-baggage in three
// languages and information/check-in-conditions: one column below 992, two from
// 992 and three from 1280. The 1280 is the same breakpoint the content column
// caps at. The boilerplate laid the cards out with auto-fill, which gives four.
describe('the cards grid', () => {
  const list = /\.cards > ul \{[\s\S]*?\n\}/.exec(declarations)[0];

  it('is one column below the first breakpoint', () => {
    assert.match(list, /grid-template-columns:\s*1fr;/);
  });

  it('goes to two columns at 992px', () => {
    const wide = /@media \(width >= 992px\) \{[\s\S]*?\n\s*\}\n\}/.exec(declarations);
    assert.ok(wide, 'expected a 992px block');
    assert.match(wide[0], /grid-template-columns:\s*repeat\(2, 1fr\)/);
  });

  it('goes to three columns at 1280px, where the content column also caps', () => {
    const wider = /@media \(width >= 1280px\) \{[\s\S]*?\n\s*\}\n\}/.exec(declarations);
    assert.ok(wider, 'expected a 1280px block');
    assert.match(wider[0], /grid-template-columns:\s*repeat\(3, 1fr\)/);
  });

  it('never lays the cards out by auto-fill, which gives four at 1240px', () => {
    assert.doesNotMatch(declarations, /auto-fill/);
  });

  // Live cards read `border: 0px none` on checked-baggage in three languages and
  // on preparing-your-trip. The boilerplate drew a 1px #dadada box.
  it('draws no border on a card', () => {
    const item = /\.cards > ul > li \{[\s\S]*?\n\}/.exec(declarations)[0];
    assert.doesNotMatch(item, /border:\s*1px/);
  });
});

// Live's link-card image is 200px tall at 768, 992, 1200 and 1440 alike, whatever
// the card width, and 157px in a 248px card at 375, which is the same proportion our
// wider mobile card reaches at 200px. The boilerplate forced 4/3, which at a
// 397px card is 298px tall and made the card 676px against live's 456px.
//
// THE SCOPE NARROWED on 2026-08-04: this was measured on the link-card and applied to
// every photo card, and link-card__image is the only class on live carrying object-fit
// cover. The band distorted 1,037 of the 1,253 images in the bucket. The transform marks
// the link-card block `cover`, so these assertions moved onto that rule and
// test/card-image-ratio.test.js covers the rest keeping their own ratio.
describe('the card image', () => {
  const rule = /\.cards\.cover > ul > li\.cards-card-photo img \{[\s\S]*?\n\}/.exec(declarations)[0];

  it('is the measured 200px tall', () => {
    assert.match(rule, /height:\s*200px/);
  });

  it('does not force an aspect ratio, which fought the height', () => {
    assert.doesNotMatch(rule, /aspect-ratio/);
  });

  it('still covers its box', () => {
    assert.match(rule, /object-fit:\s*cover/);
  });
});

// The icon class lands when the image loads, which is after the first paint.
// Sizing the card from it moved the layout under the reader: 0.1432 of a 0.1591
// CLS on checked-baggage, against 0.0088 on a page with no cards. object-fit is
// a paint property, so switching it moves nothing.
describe('the icon card is the default, so nothing moves for it', () => {
  const base = /\.cards > ul > li img \{[\s\S]*?\n\}/.exec(declarations)[0];

  it('lets an icon keep its own size with no class at all', () => {
    assert.match(base, /height:\s*auto/);
    assert.match(base, /max-width:\s*100%/);
    assert.doesNotMatch(base, /[^-]width:\s*100%/);
  });

  it('has no icon class left to add', () => {
    assert.doesNotMatch(declarations, /cards-card-icon/);
  });
});

// A cards block with one card took one column of the three and left 843px of the row
// empty. Live shows the same content as a full-width row, the photo on one side and the
// copy on the other: measured at 1440 on live's /en-gb/royal-air-maroc-lounges, four such
// rows, the photo 505px at x=610 and the copy from x=84.
//
// It is the dominant shape rather than an edge case. Of the 210 cards blocks in the 86
// documents rolled on 2026-08-05, 152 hold a single card.
describe('a cards block with one card', () => {
  it('gives it the whole row instead of one column', () => {
    assert.match(declarations, /:has\(>\s*li:only-child\)/);
  });

  it('lays the image and the copy side by side, which is what live does', () => {
    const at = declarations.indexOf(':has(> li:only-child)');
    assert.notEqual(at, -1);
    assert.match(declarations.slice(at, at + 400), /grid-template-columns:\s*(repeat\(2, 1fr\)|1fr 1fr)/);
  });

  // Below the 992 step live stacks, and a phone has no room for two columns either.
  it('holds the side-by-side layout behind the 992 step', () => {
    const at = declarations.indexOf(':has(> li:only-child)');
    const before = declarations.slice(0, at);
    assert.match(before.slice(-200), /@media \(width >= 992px\)/);
  });
});

// Live keeps a single ICON card narrow. On /en-gb/family-program its 101px icon sits centred on
// top of a 397px card at x=522, the middle of three tracks, where the photo card on
// royal-air-maroc-lounges is the full 1232. The full-row rule went to both: 45 of the 63
// single-card blocks whose served image width could be read hold an icon and 18 hold a photo, so
// it was firing on more icon cards than photo cards, laying a 101px icon in a 608px column.
describe('a single card is a full row only when it holds a photo', () => {
  it('gives the row to a photo card', () => {
    assert.match(
      declarations,
      /ul:has\(> li:only-child\.cards-card-photo\)[^{]*\{[^}]*grid-template-columns:\s*1fr/,
    );
  });

  // 32 single-card blocks carry no image cell, and live's page for one of them,
  // /en-gb/loft-lounge-fast-track, has a 608px photo beside 608px of copy that the transform
  // dropped. With nothing to sit beside, neither shape is live's: the copy is a third of the row on
  // the base grid and all of it on a full row, against live's half. The base grid is the closer of
  // the two and the state before the row rule, so a card with no photo class keeps it.
  //
  // `:has()` CANNOT NEST, so `:has(> li:only-child:not(:has(> .cards-card-image)))` throws a
  // SyntaxError, and an invalid selector in a list drops the whole rule. Chrome kept the three
  // columns and said nothing; stylelint passed it.
  it('never writes a :has() inside a :has(), which drops the rule it is in', () => {
    const nested = [];
    for (let i = declarations.indexOf(':has('); i > -1; i = declarations.indexOf(':has(', i + 1)) {
      let depth = 0;
      for (let j = i + 4; j < declarations.length; j += 1) {
        const c = declarations[j];
        if (c === '(') depth += 1;
        if (c === ')') { depth -= 1; if (depth === 0) break; }
        if (depth > 0 && declarations.startsWith(':has(', j)) {
          nested.push(declarations.slice(i, j + 40));
          break;
        }
      }
    }
    assert.deepEqual(nested, []);
  });

  it('lays out two columns on the photo card alone', () => {
    assert.match(
      declarations,
      /ul:has\(> li:only-child\) > li\.cards-card-photo \{[^}]*grid-template-columns:\s*repeat\(2, 1fr\)/,
    );
  });

  it('leaves the two columns off an unqualified single card', () => {
    assert.doesNotMatch(declarations, /ul:has\(> li:only-child\) > li \{/);
  });

  // The card's 16px inset comes off because in the row it is a column gutter rather than the card's
  // only inset. A card that stays narrow keeps it, or its copy starts at x=100 where the three-card
  // block below it on /en-gb/family-program starts at x=116.
  it('takes the card inset off the row alone', () => {
    assert.match(
      declarations,
      /ul:has\(> li:only-child\) > li\.cards-card-photo \.cards-card-body \{[^}]*margin:\s*0/,
    );
  });
});

// The copy cells cannot share a grid cell and `grid-row: 1 / -1` on the photo resolves against the
// explicit grid, so it spans one row and changes nothing. The block puts one box around them.
describe('the copy box beside the photo', () => {
  const block = /@media \(width >= 992px\) \{[\s\S]*?\n\}\n/g;
  const step = () => [...declarations.matchAll(block)]
    .map((m) => m[0])
    .find((b) => b.includes('li.cards-card-photo'));

  it('stacks the cells in one column', () => {
    const rule = /\.cards-card-copy \{[^}]*\}/.exec(step());
    assert.ok(rule, 'no rule for the copy box');
    assert.match(rule[0], /flex-direction:\s*column/);
  });

  it('takes the 24px live leaves between a heading and its copy', () => {
    assert.match(/\.cards-card-copy \{[^}]*\}/.exec(step())[0], /gap:\s*24px/);
  });

  // Below 992 the card stacks and the box is a plain div, so mobile keeps the spacing it has.
  it('is styled only at the width where the row exists', () => {
    const outside = declarations.replace(block, '');
    assert.doesNotMatch(outside, /cards-card-copy/);
  });
});
