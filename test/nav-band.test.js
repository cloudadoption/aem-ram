import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
const declarations = styles.replace(/\/\*[\s\S]*?\*\//g, '');
const headerRule = /\nheader \{[\s\S]*?\n\}/.exec(declarations);

// Live's header band is 48px at 375 and 80px at 1440, and the step is at 768.
// Measured in a browser on live's /en-gb/checked-baggage on 2026-08-04: the
// .header element reads 48 tall with min-height 0 at 375, and 80 tall with
// min-height 80px at 1440. The client's own stylesheet gates both halves at 768,
// `.header__logo__img{height:5rem}` and `.header__container{max-height:fit-content}`.
//
// The boilerplate shipped a flat 64px, which is wrong at both widths AND
// contradicts this repo's own header.css: that already sizes the brand mark 65x48
// below 768 and 108x80 above, measured over nine viewports. So at 1440 the 80px
// brand hung 8px past the bottom of its own 64px band, read on the published
// estate.
describe('the header band height', () => {
  it('is live\'s measured 48px below the step', () => {
    assert.match(styles, /--nav-height:\s*48px/);
  });

  it('is not the boilerplate\'s flat 64px', () => {
    assert.doesNotMatch(styles, /--nav-height:\s*64px/);
  });

  it('steps to live\'s measured 80px at 768, where the brand mark also steps', () => {
    const blocks = declarations.match(/@media \(width >= 768px\) \{[\s\S]*?\n\}/g) || [];
    const band = blocks.find((b) => b.includes('--nav-height'));
    assert.ok(band, 'expected a 768px block setting --nav-height');
    assert.match(band, /--nav-height:\s*80px/);
  });
});

// Live's header stays on screen at every width. Measured on live at 375 and 1440:
// position is `sticky` at both, and the class that carries it, `header--sticky`, is
// already on the element at scrollY 0 rather than being added on first scroll.
//
// Ours read `static` at both widths. Below the step the boilerplate makes
// .nav-wrapper `fixed`, so the band happens to stay; from 768 up the wrapper is
// `relative` and the nav scrolls away entirely.
//
// The sticky element has to be `header` rather than the wrapper: a sticky box can
// only stick inside its containing block, and `header` is what carries the height
// reserving the band, so a sticky wrapper would stick within those 80px.
describe('the header on scroll', () => {
  it('sticks, so the nav does not scroll away above the step', () => {
    assert.ok(headerRule, 'expected a header rule');
    assert.match(headerRule[0], /position:\s*sticky/);
    assert.match(headerRule[0], /top:\s*0/);
  });

  // Live declares `.header{position:relative;z-index:3}` and its sticky variant
  // repeats the 3, so the band sits above the page and under a dialog.
  it('takes live\'s stacking order', () => {
    assert.match(headerRule[0], /z-index:\s*3/);
  });

  it('still reserves the band, so nothing slides under it', () => {
    assert.match(headerRule[0], /height:\s*var\(--nav-height\)/);
  });
});
