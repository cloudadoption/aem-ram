import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { crumbLabels, breadcrumbHtml } from '../scripts/breadcrumb.js';

// Live shows a breadcrumb on 1,366 of 1,506 captures, 91 per cent, and its styling is the same on
// both themes apart from one size step. Measured in a browser on 2026-08-04, live's
// /en-gb/american-airlines (2022) against /en-gb/fiji-airways (2025):
//   link       14px / 16px, weight 400, rgb(89, 88, 85)
//   divider    a "|" span, weight 600, rgb(123, 122, 120)
//   last crumb weight 600, rgb(141, 43, 97), which is --ram-brand-primary-dark-color
// So the trail carries across the theme split where the band around it does not: live's band is
// 253px tall and transparent with a 50px uppercase Museo title on 2022, and 156px on #f7f7f7 with a
// 40px mixed-case title on 2025.
//
// THE CRUMBS CARRY NO LINKS. Live's own do, and all 45 distinct /en and /en-gb crumb targets answer
// 404 on live, following redirects, while two control URLs answer 200 through the same probe. That
// is PENDING DECISION 12: the labels ship, the hrefs wait.

describe('crumbLabels', () => {
  it('splits live\'s own separator', () => {
    assert.deepEqual(
      crumbLabels('Safar Flyer Loyalty | Earn and spend miles | Our Partners | AMERICAN AIRLINES'),
      ['Safar Flyer Loyalty', 'Earn and spend miles', 'Our Partners', 'AMERICAN AIRLINES'],
    );
  });

  it('trims each label', () => {
    assert.deepEqual(crumbLabels('  A  |B |  C  '), ['A', 'B', 'C']);
  });

  it('drops an empty segment rather than rendering a stray divider', () => {
    assert.deepEqual(crumbLabels('A || B |'), ['A', 'B']);
  });

  it('returns nothing for nothing', () => {
    assert.deepEqual(crumbLabels(''), []);
    assert.deepEqual(crumbLabels(undefined), []);
    assert.deepEqual(crumbLabels(null), []);
  });

  // A single crumb is the page itself, which says nothing a reader does not already know. Live never
  // renders a one-item trail: its shortest is three.
  it('drops a trail of one', () => {
    assert.deepEqual(crumbLabels('AMERICAN AIRLINES'), []);
  });
});

describe('breadcrumbHtml', () => {
  const LABELS = ['Safar Flyer Loyalty', 'Earn and spend miles', 'AMERICAN AIRLINES'];

  it('writes a labelled nav so a screen reader can skip it', () => {
    const html = breadcrumbHtml(LABELS);
    assert.match(html, /<nav[^>]*class="breadcrumb"/);
    assert.match(html, /aria-label="Breadcrumb"/);
  });

  it('writes one list item per label, in order', () => {
    const html = breadcrumbHtml(LABELS);
    const items = [...html.matchAll(/<li[^>]*>([^<]*)</g)].map((m) => m[1].trim());
    assert.deepEqual(items, LABELS);
  });

  it('marks the last crumb as the current page', () => {
    const html = breadcrumbHtml(LABELS);
    const last = html.slice(html.lastIndexOf('<li'));
    assert.match(last, /aria-current="page"/);
    assert.equal(html.match(/aria-current/g).length, 1);
  });

  it('carries no anchor, because live\'s crumb targets 404 on live', () => {
    assert.doesNotMatch(breadcrumbHtml(LABELS), /<a\b/);
  });

  it('escapes a label', () => {
    assert.match(breadcrumbHtml(['A & B', 'C <script>', 'D']), /A &amp; B/);
    assert.doesNotMatch(breadcrumbHtml(['A', '<script>x</script>', 'D']), /<script>/);
  });

  it('writes nothing at all for an empty trail', () => {
    assert.equal(breadcrumbHtml([]), '');
  });
});

const css = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');

describe('the breadcrumb styling', () => {
  it('takes live\'s measured link colour', () => {
    assert.match(css, /\.breadcrumb[\s\S]{0,400}#595855/i);
  });

  it('gives the current page live\'s weight and its own token colour', () => {
    const rule = css.slice(css.indexOf('.breadcrumb'));
    assert.match(rule, /aria-current[\s\S]{0,200}font-weight:\s*600/);
    assert.match(rule, /aria-current[\s\S]{0,200}--ram-brand-primary-dark-color/);
  });

  // Live writes the divider as an aria-hidden span; a generated ::after says the same thing to a
  // reader and keeps it out of the accessibility tree by construction.
  it('draws the divider between items and not after the last', () => {
    const rule = css.slice(css.indexOf('.breadcrumb'));
    assert.match(rule, /li:not\(:last-child\)::after/);
    assert.match(rule, /content:\s*"\s*\|\s*"/);
  });

  it('lays the trail out in a row with no bullets', () => {
    const rule = css.slice(css.indexOf('.breadcrumb'));
    assert.match(rule, /list-style:\s*none/);
    assert.match(rule, /display:\s*flex/);
  });
});
