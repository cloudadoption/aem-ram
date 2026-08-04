import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync(new URL('../blocks/table/table.css', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
const declared = css.replace(/\/\*[\s\S]*?\*\//g, '');

// Live's own rule, verbatim from /o/ram-airways-theme/2025/css/styles.css:
//
//   .table-responsive table th,.table-responsive table td{padding:.5rem .75rem;text-align:center;
//     vertical-align:middle;height:3.5rem}
//   table th:first-child,.table td:first-child{padding-left:15px}
//   .table-responsive table th:first-child,...td:first-child{text-align:start}
//   .table-responsive.scroll-table table th:first-child,...{position:sticky;
//     inset-inline-start:0;z-index:1}
//   .table-responsive{...border-radius:.5rem}
//
// A table block is on 538 pages. Ported from da-ram #55 and #56.
describe('a table cell', () => {
  const cell = /\.table th,\s*\.table td \{[^}]*\}/.exec(declared);

  // height on a cell is a minimum row height, and live counts its padding inside it: live is
  // border-box throughout and this repo is content-box, so 3.5rem plus 8px twice plus the rules
  // drew a 73px header row against live's 56.
  it('takes live\'s minimum row height, counted the way live counts it', () => {
    assert.ok(cell, 'expected a shared th and td rule');
    assert.match(cell[0], /box-sizing:\s*border-box/);
    assert.match(cell[0], /height:\s*3\.5rem/);
  });

  it('centres and middles the cell, as live\'s own rule does', () => {
    assert.match(cell[0], /text-align:\s*center/);
    assert.match(cell[0], /vertical-align:\s*middle/);
  });

  // Clay's row rule is #dee2e6 on both block edges, much lighter than the body colour.
  it('rules both block edges, not the bottom alone', () => {
    assert.match(cell[0], /border-block:\s*1px solid #dee2e6/);
  });

  // Live pins the first column so it stays while the rest scrolls, which is what an opaque cell
  // background is for, and it starts that column's text where the others are centred.
  it('pins the first column and starts its text', () => {
    const first = /\.table th:first-child,\s*\.table td:first-child \{[^}]*\}/.exec(declared);
    assert.ok(first, 'expected a first-child rule');
    assert.match(first[0], /position:\s*sticky/);
    assert.match(first[0], /inset-inline-start:\s*0/);
    assert.match(first[0], /padding-inline-start:\s*15px/);
    assert.match(first[0], /text-align:\s*start/);
  });

  it('gives the body cell an opaque ground, so the pinned column hides what scrolls under it', () => {
    const body = /\.table tbody td \{[^}]*\}/.exec(declared);
    assert.ok(body, 'expected a tbody td rule');
    assert.match(body[0], /background-color:\s*var\(--ram-background-default-color\)/);
    assert.match(body[0], /color:\s*var\(--ram-neutral-900-color\)/);
  });

  it('declares the neutral token the body cell reads', () => {
    assert.match(styles, /--ram-neutral-900-color:\s*#333231/);
  });

  it('rounds the scroll box, as live\'s .table-responsive does', () => {
    assert.match(declared, /^\.table \{[^}]*border-radius:\s*8px/m);
  });

  it('takes the top rule off the head, which live draws without one', () => {
    assert.match(declared, /\.table thead th \{[^}]*border-block-start-width:\s*0/);
  });
});

// The transform wraps a cell's text in a paragraph and its bullets in a list, and live mostly does
// not, so the global paragraph and list rules landed inside a cell live draws at its own type.
// Over eight table pages in four markets, six have no paragraph in a cell at all and the two that
// do draw it at 16px/25.6px/400.
//
// The margins are live's spacing inside a cell, read on /en-gb/airport-transit: a paragraph 15px
// below, a list item 8px below, a list 10px above and nothing below. Ours drew 4px, 0 and 0, and
// the transit rows came out 174 153 153 177 177 against live's 230 205 205 231 231.
describe('what sits inside a table cell', () => {
  it('lets the cell own the type of its paragraph and its list item', () => {
    const p = /\.table th p,\s*\.table td p \{[^}]*\}/.exec(declared);
    assert.ok(p, 'expected a rule for a paragraph in a cell');
    assert.match(p[0], /line-height:\s*inherit/);
    assert.match(p[0], /font-weight:\s*inherit/);
    assert.match(p[0], /margin-block-end:\s*15px/);
  });

  it('spaces a list item at live\'s 8px and a list at 10px above', () => {
    assert.match(declared, /\.table th li,\s*\.table td li \{[^}]*margin-block-end:\s*8px/);
    assert.match(declared, /\.table td ul,\s*\.table td ol \{[^}]*margin-block:\s*10px 0/);
  });

  // A cell whose only child is a paragraph is live's bare-text cell, which holds no paragraph and
  // so no margin. 16 of the 17 cells on /en-gb/checked-baggage are that, where our rows read
  // 70 93 93 against live's 66 89 89 on the 4px the global paragraph rule adds.
  it('takes the margin off a cell that is nothing but one paragraph', () => {
    assert.match(declared, /p:only-child \{[^}]*margin-block-end:\s*0/);
  });
});
