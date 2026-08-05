import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
// Assertions about what the file declares must not read its comments.
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');

// A run of callout boxes stacked full width where live lays them across. On
// /en-gb/baggage-information ten of them each drew 1240x65 in their own row, against live's
// 353x92 three across.
//
// Live's grid is fluid rather than stepped, measured on live's own page at six widths:
//
//   width  per row  box
//     767      2    302
//     991      2    402
//     992      2    403
//    1024      2    417
//    1279      3    348
//    1440      3    353
//
// That is `repeat(auto-fill, minmax(~290px, 1fr))` with a 20px gap on live's ~1100px content
// column. Our column is 1240 at 1440, so 290 would fit four across where live fits three: 320
// is the value that gives three on 1240 and two on our 752 at width 800.
//
// 48 pages carry a run of two or more consecutive callouts: 28 with a run of 3, 10 with a run
// of 10, 9 with 4, 1 with 2.
describe('a run of callouts lays out across', () => {
  const rule = () => {
    const m = /main > \.section:has\(\.callout-wrapper \+ \.callout-wrapper\)\s*\{[^}]*\}/.exec(declarations);
    assert.ok(m, 'no rule for a section holding consecutive callouts');
    return m[0];
  };

  it('grids the section holding them', () => {
    assert.match(rule(), /display:\s*grid/);
  });

  it('fills the row with live\'s fluid track rather than a stepped column count', () => {
    assert.match(rule(), /repeat\(auto-fill,\s*minmax\(320px,\s*1fr\)\)/);
  });

  it('takes live\'s 20px gap', () => {
    assert.match(rule(), /gap:\s*20px/);
  });

  // The section is full-bleed and each wrapper carries the content column, so the
  // geometry has to move up to the grid, or a box stays 1240 wide and overflows
  // its 345px cell.
  it('takes the content column onto the grid and off the wrappers', () => {
    assert.match(rule(), /max-width:\s*var\(--content-max-width\)/);
    assert.match(declarations, /:has\(\.callout-wrapper \+ \.callout-wrapper\)\s*>\s*div\s*\{[^}]*width:\s*auto/);
  });

  // The heading above the run is in the same section and is not a callout, so it keeps the row.
  it('gives a non-callout child the whole row', () => {
    const full = /:has\(\.callout-wrapper \+ \.callout-wrapper\)\s*>\s*:not\(\.callout-wrapper\)[^{]*\{[^}]*\}/;
    assert.match(full.exec(declarations)[0], /grid-column:\s*1\s*\/\s*-1/);
  });

  // `.callout` carries `margin: 0 0 24px`, which would add to the grid gap.
  it('drops the box margin the gap replaces', () => {
    assert.match(declarations, /:has\(\.callout-wrapper \+ \.callout-wrapper\)[^{]*\.callout\s*\{[^}]*margin(?:-bottom)?:\s*0/);
  });

  it('leaves a lone callout alone, because one box is not a row', () => {
    assert.doesNotMatch(declarations, /main > \.section:has\(\.callout-wrapper\)\s*\{/);
  });
});
