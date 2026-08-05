import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

/*
 * 24 published pages emit a `tabs` block and this repo had no implementation, so /blocks/tabs/tabs.js and
 * /blocks/tabs/tabs.css both answered 404 on every one of those page loads and the five panels rendered
 * stacked and all visible. Read on /en-gb/general-terms-and-conditions: five rows, each with two children,
 * the first the tab label ("General terms and conditions", "Legal mentions", "Privacy policy", "Security",
 * "Cookies") and the second the panel body. general-terms-and-conditions in ten locales, our-network and the
 * miles calculator make up the 24.
 *
 * The block is adobe/aem-block-collection's, which expects exactly that structure: each row's first element
 * child is the label and the row becomes the panel. Same move as decision 5 made for the FAQ, reuse rather
 * than write.
 */

const src = readFileSync(new URL('../blocks/tabs/tabs.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../blocks/tabs/tabs.css', import.meta.url), 'utf8');

describe('the tabs block exists and keeps the collection contract', () => {
  it('builds a tablist with the tab role', () => {
    assert.match(src, /role',\s*'tablist'|role="tablist"/);
    assert.match(src, /tabs-list/);
  });

  it('makes each row a tabpanel and each label a button', () => {
    assert.match(src, /tabs-panel/);
    assert.match(src, /tabs-tab/);
    assert.match(src, /createElement\('button'\)/);
  });

  it('wires the ARIA relationship both ways', () => {
    assert.match(src, /aria-controls/);
    assert.match(src, /aria-labelledby/);
    assert.match(src, /aria-selected/);
    assert.match(src, /aria-hidden/);
  });

  it('shows the first panel and hides the rest', () => {
    // aria-hidden is set from the index, so panel 0 is false and the others true.
    assert.match(src, /setAttribute\('aria-hidden',\s*!!i\)/);
    assert.match(src, /setAttribute\('aria-selected',\s*!i\)/);
  });

  it('switches on click', () => {
    assert.match(src, /addEventListener\('click'/);
  });

  it('gives the panel a type=button so it does not submit a form', () => {
    assert.match(src, /setAttribute\('type',\s*'button'\)/);
  });

  it('styles the list and hides a hidden panel', () => {
    assert.match(css, /\.tabs\s+\.tabs-list/);
    assert.match(css, /aria-hidden/);
  });

  it('scopes every selector to the block', () => {
    const selectors = [...css.matchAll(/^\s*([^@\s][^{]*)\{/gm)].map((m) => m[1].trim());
    const unscoped = selectors.filter((s) => !/(^|\s|,)\.tabs\b/.test(s));
    assert.deepEqual(unscoped, [], `unscoped selectors: ${unscoped.join(' | ')}`);
  });
});
