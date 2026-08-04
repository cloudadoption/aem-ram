import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

// Live's authors set a box inline, per page, and the transform collapses those onto three
// variants under ram2's decision 0024. 150 of the 1,860 generated documents carry a
// `<div class="callout ...">` and this repo had no callout block at all, so the boxed copy on
// those pages renders as plain paragraphs.
//
// The values come from live's own page-level <style>, recorded in ram2 at f722e1b:
//   .ram-info-box     1px #e0c8c8 over a #fdf5f5 tint          -> outline
//   .ram-block        6px #B02736 bar down the reading edge    -> fill
//   .ram-tips-wrapper 2px #9A1C3E over #f9f9f9                 -> accent
//   .ram-row          6px #9A1C3E bar                          -> fill
const css = readFileSync(new URL('../blocks/callout/callout.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../blocks/callout/callout.js', import.meta.url), 'utf8');

describe('callout', () => {
  // A box that arrives with no variant, or with one we have not mapped, renders as the base
  // rather than unstyled.
  it('gives the base the padding and radius, so an unmapped box still draws', () => {
    assert.match(css, /^\.callout\s*\{/m);
    assert.match(css, /padding:\s*20px/);
    assert.match(css, /border-radius:\s*12px/);
  });

  // Live renders box copy at the size of the prose around it, 16px on 22.4px, measured on
  // .ram-advice-block and .ram-unified-box. --body-font-size-s is 14px and would shrink text
  // inside our box where live's does not shrink.
  it('reads the prose font size, not the small one', () => {
    assert.match(css, /font-size:\s*var\(--body-font-size-m\)/);
    assert.doesNotMatch(css, /font-size:\s*var\(--body-font-size-s\)/);
  });

  it('borders the accent variant in the one red any box border uses', () => {
    assert.match(css, /\.callout\.accent\s*\{[^}]*#9a1c3e/i);
  });

  // The bar is on the reading edge, and ar-sa is one of the ten locales, so this has to be the
  // logical property. border-left puts the bar on the wrong side of every Arabic page.
  it('draws the fill bar with a logical property, so it flips under rtl', () => {
    assert.match(css, /\.callout\.fill\s*\{[^}]*border-inline-start:\s*6px solid/i);
    assert.doesNotMatch(css, /\.callout\.fill\s*\{[^}]*border-left:/i);
  });

  it('outlines the outline variant with a hairline border', () => {
    assert.match(css, /\.callout\.outline\s*\{[^}]*border:\s*1px solid/i);
  });

  // aem.js loadBlock imports {block}.js unconditionally and console.errors when the import
  // fails. The callout is styled entirely in CSS, so this module exists only to be importable.
  it('exports a decorate function, so loadBlock has something to import', () => {
    assert.match(js, /export default function decorate/);
  });
});
