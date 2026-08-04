import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync(new URL('../blocks/cards/cards.css', import.meta.url), 'utf8');
const declared = css.replace(/\/\*[\s\S]*?\*\//g, '');

// Live sizes and colours a card title by what the card holds, and the two components that carry 14
// of the 22 templates with a titled card fall on opposite sides of the icon and photo split.
// small-card is 24px at weight 700 on all 8 of its templates. link-card is 16px at weight 400,
// stepping to 20px at 1280, on all 6 of its. Ported from da-ram #59 and #60.
//
// Without this the title takes the document type scale, so its size depends on the heading level
// the transform found on live: the icon card reads 24px by luck and the photo card 28px against
// live's 16. The colour went the same way: the title is an anchor, so it took --link-color and drew
// the brand red where live declares `.small-card__title{color:var(--ram-text-dark-color)}`.
describe('a card title', () => {
  it('reads 24px at 700 on the icon and photo cards, as live does', () => {
    const sel = '\\.cards > ul > li:is\\(\\.cards-card-icon, \\.cards-card-photo\\)';
    const rule = new RegExp(`${sel}\\s+:is\\(h1[^{]*\\{[^}]*\\}`).exec(declared);
    assert.ok(rule, 'expected a rule sizing the icon and photo card titles');
    assert.match(rule[0], /font-size:\s*var\(--heading-font-size-m\)/);
    assert.match(rule[0], /font-weight:\s*700/);
  });

  // The link-card is the exception, and an exact one, matching live at 900, 1100 and 1440 on
  // /en-gb/add-extra-luggage. The transform marks that block `cover`.
  it('keeps the link-card at 16px and 400, stepping to 20px at 1280', () => {
    assert.match(declared, /\.cards\.cover > ul > li :is\(h1[^{]*\{[^}]*--heading-font-size-xs/);
    assert.match(declared, /width >= 1280px[\s\S]*\.cards\.cover[^{]*\{[^}]*--heading-font-size-s/);
  });

  it('draws the title dark rather than in the link red, except on the link-card', () => {
    const dark = /\.cards:not\(\.cover\) > ul > li :is\(h1[^{]*\)\s*a\s*\{[^}]*/;
    assert.match(declared, new RegExp(`${dark.source}--ram-text-dark-color`));
  });

  // A card is padded and gapped rather than spaced by its heading's margin: the 20px every heading
  // carries escaped the card body and made the icon card 112px against live's 106.
  it('takes the heading margin off inside a card and lays the line out as a row', () => {
    const rule = /\.cards > ul > li :is\(h1, h2, h3, h4, h5, h6\)\s*\{[^}]*\}/.exec(declared);
    assert.ok(rule, 'expected a rule for a card heading');
    assert.match(rule[0], /margin:\s*0/);
    assert.match(rule[0], /display:\s*flex/);
    assert.match(rule[0], /gap:\s*8px/);
  });
});

// Live puts a chevron at the card's trailing edge on the title's line: i.small-card__arrow at 24px
// in the brand red, a 25x24 box 16px in, identical on /en-gb/checked-baggage,
// /en-gb/baggage-information and /en-gb/add-extra-luggage. 18 of 23 card titles read across eight
// en-GB pages carry one, and the 5 without are the cards with no image.
//
// The glyph is in the client's ram-icons font, which this repo does not load, so it is drawn.
describe('the card chevron', () => {
  it('draws it from two logical borders, so it mirrors under rtl', () => {
    const rule = /:is\(h1, h2, h3, h4, h5, h6\):has\(a\)::after\s*\{[^}]*\}/.exec(declared);
    assert.ok(rule, 'expected a drawn chevron on a linked card title');
    assert.match(rule[0], /border-block-start:\s*2px solid/);
    assert.match(rule[0], /border-inline-end:\s*2px solid/);
    assert.match(rule[0], /transform:\s*rotate\(45deg\)/);
  });

  // :has(a) is the guard: a chevron on a card that links nowhere tells the reader they can go
  // somewhere.
  it('puts it only on a card that links somewhere', () => {
    assert.match(declared, /:has\(a\)::after/);
  });

  // transform is physical, so the reading direction needs its own angle. The logical borders
  // already move, so a quarter turn anticlockwise brings the apex to the left. 135deg points it
  // right again.
  it('turns it the other way under rtl', () => {
    assert.match(declared, /\[dir="rtl"\][\s\S]*?::after\s*\{[^}]*transform:\s*rotate\(-45deg\)/);
  });
});
