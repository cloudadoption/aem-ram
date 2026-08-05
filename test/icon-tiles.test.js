import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isIconParagraph, iconTileSets } from '../scripts/icon-tiles.js';

/*
 * Live lays a run of benefits as a grid of `feature-icon-div` tiles, 397px wide and three across,
 * the icon centred on top and the copy under it. Measured at 1440 on
 * /de-de/vorteile-von-silver: icons at x250, x459 and x876 with their copy at x104, x522 and x939.
 *
 * We serve the same content as DEFAULT CONTENT: an icon alone in a full-width paragraph, then its
 * copy, repeating. One tile per 190px of 1240-wide page. That page runs 5,145px against live's
 * 3,882, and on the same page four of the benefits DID arrive as a cards block, so the component is
 * on the page in two shapes at once.
 *
 * The estate: 147 pages serve 483 such icons, and 93 of those pages also carry a cards block.
 * Worst families, by icon count: paiement-fractionne 90, attijariwafa-bank 30, bank-of-africa 30,
 * information/travel-with-animals 28, travel-insurance 24, long-haul-business 21.
 *
 * Our cards block at 1280 and above is 397px, three across, icon on top: live's own shape.
 */

const img = (width) => ({ tagName: 'IMG', getAttribute: (k) => (k === 'width' ? String(width) : null) });
const para = (kids = [], text = '') => ({
  tagName: 'P',
  children: kids,
  textContent: text,
  querySelector: (sel) => kids.find((k) => sel.split(',').some((s) => k.tagName === s.trim().toUpperCase())) ?? null,
  querySelectorAll: (sel) => kids.filter((k) => sel.split(',').some((s) => k.tagName === s.trim().toUpperCase())),
});
const iconP = (width = 105) => para([img(width)]);
const textP = (text = 'copy') => para([], text);
const heading = (level = 3, text = 'Benefits') => ({
  tagName: `H${level}`, children: [], textContent: text, querySelector: () => null, querySelectorAll: () => [],
});

describe('isIconParagraph', () => {
  it('accepts a paragraph holding one icon-sized image and no text', () => {
    assert.equal(isIconParagraph(iconP(105)), true);
  });

  it('accepts the 122px and 48px icons paiement-fractionne uses', () => {
    assert.equal(isIconParagraph(iconP(122)), true);
    assert.equal(isIconParagraph(iconP(48)), true);
  });

  // The 200px line is card-icons.js's, so an icon here is an icon there.
  it('refuses a photograph, which is a content image rather than a tile', () => {
    assert.equal(isIconParagraph(iconP(800)), false);
    assert.equal(isIconParagraph(iconP(201)), false);
  });

  it('refuses a paragraph that also carries text, because that is prose with an image in it', () => {
    assert.equal(isIconParagraph(para([img(105)], 'Silver bonus')), false);
  });

  it('refuses a paragraph with no image', () => {
    assert.equal(isIconParagraph(textP()), false);
  });

  it('refuses a paragraph holding two images, which is an image row', () => {
    assert.equal(isIconParagraph(para([img(105), img(105)])), false);
  });

  it('refuses an image whose width is not declared, since the size is what decides', () => {
    assert.equal(isIconParagraph(para([{ tagName: 'IMG', getAttribute: () => null }])), false);
  });

  it('refuses a heading', () => {
    assert.equal(isIconParagraph(heading()), false);
  });
});

describe('iconTileSets', () => {
  it('groups two icons and their copy into one set', () => {
    const kids = [iconP(), textP('a'), iconP(), textP('b')];
    assert.deepEqual(iconTileSets(kids), [[[0, 2], [2, 4]]]);
  });

  // /de-de/paiement-fractionne serves five in a row under one heading.
  it('groups five in a row', () => {
    const kids = [];
    for (let i = 0; i < 5; i += 1) kids.push(iconP(122), textP());
    assert.equal(iconTileSets(kids)[0].length, 5);
  });

  // On /de-de/vorteile-von-silver a tile is icon, title, copy.
  it('takes a tile of an icon and two text elements', () => {
    const kids = [
      iconP(), textP('Ruby-Status:'), textP('Ihr Safar Flyer Status'),
      iconP(), textP('Cash & Miles'), textP('Bezahlen Sie'),
    ];
    assert.deepEqual(iconTileSets(kids), [[[0, 3], [3, 6]]]);
  });

  // paiement-fractionne has two runs, one of 122px icons and one of 48px, split by a heading.
  it('starts a new set at a heading', () => {
    const kids = [
      iconP(), textP(), iconP(), textP(), heading(), iconP(), textP(), iconP(), textP(),
    ];
    assert.deepEqual(iconTileSets(kids), [[[0, 2], [2, 4]], [[5, 7], [7, 9]]]);
  });

  it('leaves a lone icon alone, because one tile is not a grid', () => {
    assert.deepEqual(iconTileSets([textP(), iconP(), textP(), heading()]), []);
  });

  it('leaves text before the first icon alone', () => {
    const kids = [heading(1), textP('intro'), iconP(), textP(), iconP(), textP()];
    assert.deepEqual(iconTileSets(kids), [[[2, 4], [4, 6]]]);
  });

  // An icon followed by a wall of prose is not a tile: the run would swallow the page.
  it('refuses a tile carrying more than three text elements', () => {
    const kids = [iconP(), textP(), textP(), textP(), textP(), iconP(), textP()];
    assert.deepEqual(iconTileSets(kids), []);
  });

  it('takes an icon with no copy at all, which is a logo strip', () => {
    assert.deepEqual(iconTileSets([iconP(), iconP(), iconP()]), [[[0, 1], [1, 2], [2, 3]]]);
  });

  it('finds nothing in a section with no icons', () => {
    assert.deepEqual(iconTileSets([heading(), textP(), textP()]), []);
  });

  it('finds nothing in an empty section', () => {
    assert.deepEqual(iconTileSets([]), []);
  });

  // A photo between two icon tiles ends the run rather than joining it.
  it('ends a run at a photograph paragraph', () => {
    const kids = [
      iconP(), textP(), iconP(), textP(), iconP(800), iconP(), textP(), iconP(), textP(),
    ];
    const sets = iconTileSets(kids);
    assert.deepEqual(sets[0], [[0, 2], [2, 4]]);
    assert.deepEqual(sets[1], [[5, 7], [7, 9]]);
  });
});
