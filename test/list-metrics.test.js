import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
const declared = styles.replace(/\/\*[\s\S]*?\*\//g, '');

// Live's prose list, verbatim from /o/ram-airways-theme/2025/css/styles.css:
//
//   *{margin:0;padding:0}
//   body ul,body ol{list-style:none;margin-inline-start:0;margin-block-end:0;margin:0}
//   .seat-content ul{margin-block-end:.5rem;list-style:disc;margin-inline-start:2rem}
//   .seat-content ul li{font-weight:300;font-size:1rem;line-height:140%}
//
// The reboot takes the marker off a bare list and `.seat-content ul` puts a disc back at a 2rem
// indent. That wrapper holds live's prose on 1,381 of 1,889 captured pages and 5,296 of 7,079 prose
// `ul` elements sit inside it, so the disc at 32px is the majority case. Ported from da-ram #68
// and #69.
describe('a prose list', () => {
  const rule = /^ul,\nol \{[^}]*\}/m.exec(declared);

  // A MARGIN with the padding at zero, which is what live declares: the disc is drawn outside the
  // list box rather than in a padding gutter. 20px of padding put the text 12px short of live's.
  it('indents by margin at live\'s 32px, with no padding gutter', () => {
    assert.ok(rule, 'expected a ul and ol rule');
    assert.match(rule[0], /margin-inline-start:\s*32px/);
    assert.match(rule[0], /padding-inline-start:\s*0/);
    assert.doesNotMatch(rule[0], /padding-inline-start:\s*20px/);
  });

  it('closes with live\'s 8px rather than the paragraph\'s 4', () => {
    assert.match(rule[0], /margin-block-end:\s*8px/);
  });
});

// Live's item spacing, read inside `.journal-content-article` at 1440 on six en-GB pages of the
// 2025 theme:
// 8px on 9 prose lists, 5px on 4, and 0 on the 6 single-item lists standing in for the cells of
// reduced-mobility's div-built table. Ours was 0, so a live list of seven items ran 56px shorter.
//
// The theme declares no item margin and `*{margin:0}` enforces it, so the 8 is a per-page inline
// style and decision 0024 carries the commonest.
describe('a list item', () => {
  it('takes live\'s 8px below it', () => {
    assert.match(declared, /^main li \{[^}]*margin-block-end:\s*8px/m);
  });

  // Scoped to main, which leaves the header and footer navigation alone: both are outside main in
  // Edge Delivery, and their lists are menus rather than prose.
  it('is scoped to main, so the nav lists are untouched', () => {
    assert.doesNotMatch(declared, /^li \{[^}]*margin-block-end/m);
  });

  // A cards block's li is a card, not prose, and it carries the grid's own 24px gap.
  it('leaves a card alone, since a card is not a list item of prose', () => {
    assert.match(declared, /^main \.cards li \{[^}]*margin-block-end:\s*0/m);
  });
});
