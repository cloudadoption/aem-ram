import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync(new URL('../blocks/header/header.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../blocks/header/header.js', import.meta.url), 'utf8');

// Live swaps its burger for the full nav at 1280, pinned in a browser on live's
// /en-gb/fiji-airways on 2026-08-04: `.menu-nav__openButton` computes
// display:flex at 1279 with 0 top-level nav items visible, and display:none at
// 1280 with Book, Explore, Experience, Information and Safar Flyer shown. It is
// still a burger at 800, 980, 1000, 1030 and 1210.
//
// The boilerplate switched at 900, so between 900 and 1279 we showed the desktop
// nav where live shows a burger, 380px of viewport width where the header is a
// different component from live's. AGENTS.md names 600/900/1200 as the house
// breakpoints; this one is measured off the client instead, and live has no 900
// query at all: 0 of 121 min-width values in the 2025 sheet, 0 in main62.css and
// 1 of ~130 in ram-nr-2022.css, against 768, 992 and 1280.
//
// 1280 is also --content-cap-breakpoint, where the section pins its width, so the
// header and the content column now step together.
describe('the nav breakpoint', () => {
  it('switches to the desktop nav at live\'s 1280, not the boilerplate\'s 900', () => {
    assert.doesNotMatch(css, /@media \(width >= 900px\)/);
    assert.match(css, /@media \(width >= 1280px\)/);
  });

  it('gives the block JS the same width as the CSS', () => {
    assert.match(js, /min-width:\s*1280px/);
    assert.doesNotMatch(js, /min-width:\s*900px/);
  });

  it('keeps the three rules that were behind the 900 query', () => {
    const desktop = css.slice(css.indexOf('@media (width >= 1280px)'));
    assert.match(desktop, /header \.nav-wrapper/);
    assert.match(desktop, /header nav/);
  });

  // The band steps at 768, which live does too, and that is a different question
  // from where the nav swaps. Both were measured; only the nav one moved.
  it('leaves the 768 band step alone', () => {
    const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
    assert.match(styles, /@media \(width >= 768px\)/);
  });
});
