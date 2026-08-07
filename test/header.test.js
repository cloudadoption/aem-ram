import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import markNavGroups from '../blocks/header/nav-groups.js';

// A list item stands in for an li. `sub` is its nested list, if it has one.
const item = (sub = null) => {
  const classes = new Set();
  return {
    classList: { add: (c) => classes.add(c), contains: (c) => classes.has(c) },
    querySelector: (selector) => (selector === ':scope > ul' ? sub : null),
    children: sub ? [sub] : [],
    classes,
  };
};
const list = (items) => ({ children: items });

describe('markNavGroups', () => {
  // RAM's live nav is three levels: top item, group heading, link. 5 top items, 14
  // group headings, 80 leaf links. The boilerplate styles two, so the middle level
  // needs a hook the CSS can target.
  it('marks a second level item that holds its own list', () => {
    const leaf = item();
    const group = item(list([leaf]));
    const top = item(list([group]));
    markNavGroups(list([top]));
    assert.equal(group.classList.contains('nav-group'), true);
    assert.equal(leaf.classList.contains('nav-group'), false);
  });

  it('leaves a second level item with no list of its own alone', () => {
    const plain = item();
    const top = item(list([plain]));
    markNavGroups(list([top]));
    assert.equal(plain.classList.contains('nav-group'), false);
  });

  it('does not mark the top level, which already has nav-drop', () => {
    const group = item(list([item()]));
    const top = item(list([group]));
    markNavGroups(list([top]));
    assert.equal(top.classList.contains('nav-group'), false);
  });

  it('reports the deepest level it found, so a nav deeper than three is visible', () => {
    const shallow = list([item(list([item()]))]);
    assert.equal(markNavGroups(shallow), 2);
    const three = list([item(list([item(list([item()]))]))]);
    assert.equal(markNavGroups(three), 3);
  });

  it('handles a nav with no nesting at all', () => {
    assert.equal(markNavGroups(list([item(), item()])), 1);
  });

  it('handles an absent list', () => {
    assert.equal(markNavGroups(null), 0);
  });
});

// Live's header carries the brand mark, not the words. The migrated header
// showed the text "Royal Air Maroc". The SVG is 65x48 up to 700px wide and
// 108x80 from 768, measured at 375, 480, 576, 600, 700, 768, 992, 1200 and 1440.
// The mark is carried in the repo, not hot-linked: it needs no licence, where the fonts do. Ruled 2026-08-07,
// decision K. A background-image on the live origin makes the header's brand depend on royalairmaroc.com being up
// and on that theme path surviving, and it is 11.4 KB the CDN could serve from our own origin instead.
describe('the header brand mark', () => {
  const styles = readFileSync(new URL('../blocks/header/header.css', import.meta.url), 'utf8');
  const declarations = styles.replace(/\/\*[\s\S]*?\*\//g, '');
  const brand = /\.nav-brand a:any-link \{[\s\S]*?\n\}/.exec(declarations);

  it('shows the logo from our own origin', () => {
    assert.ok(brand, 'expected a rule for the brand link');
    assert.match(brand[0], /url\('\/icons\/logo-ram\.svg'\)/);
  });

  it('does not hot-link the brand mark from royalairmaroc.com', () => {
    assert.doesNotMatch(brand[0], /royalairmaroc\.com/);
  });

  it('carries the file it points at', () => {
    const svg = readFileSync(new URL('../icons/logo-ram.svg', import.meta.url), 'utf8');
    assert.match(svg, /^<svg[\s>]/, 'expected an SVG root element');
    // Live's own mark, so the brand red is the file's and not a value anyone here chose.
    assert.match(svg, /#C20831/i);
  });

  it('takes the measured 65x48 below the breakpoint', () => {
    assert.match(brand[0], /width:\s*65px/);
    assert.match(brand[0], /height:\s*48px/);
  });

  it('grows to the measured 108x80 at 768', () => {
    const blocks = declarations.match(/@media \(width >= 768px\) \{[\s\S]*?\n\s*\}\n\}/g) || [];
    const wide = blocks.find((b) => b.includes('.nav-brand'));
    assert.ok(wide, 'expected a 768px block for the brand');
    assert.match(wide, /width:\s*108px/);
    assert.match(wide, /height:\s*80px/);
  });

  it('keeps the words for a screen reader rather than dropping them', () => {
    assert.match(brand[0], /(text-indent|font-size:\s*0|overflow:\s*hidden)/);
  });
});
