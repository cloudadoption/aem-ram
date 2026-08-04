import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { markLegalRow } from '../blocks/footer/footer-legal.js';

// Live closes its footer with a centred row of legal links and a copyright line.
// This footer had neither until the row was authored into the ten footer documents.
// Live's own rules, read off /o/ram-airways-theme/2025/css/styles.css on 2026-08-04:
//   .footer__webmap li{border-inline-end:1px solid var(--ram-text-inverse-color);
//                      padding-inline-end:.5rem}
//   .footer__webmap li:last-child{border-inline-end:none}
//   .f-body-m{font-size:.875rem;line-height:1.25rem}   .f-fw-l{font-weight:300}
// So the divider is a border rather than a pipe character, and it is logical, which
// is what flips it for ar-sa. Measured in a browser on live: links 14px weight 300,
// copyright 12px weight 300, both white on #1a1717.
//
// The row is marked from its © rather than by position. A :last-child selector on
// the section would be true only because the tool appends this row last.

const el = (tag, text = '', children = []) => {
  const node = {
    tagName: tag,
    textContent: text || children.map((c) => c.textContent).join(' '),
    children,
    classes: new Set(),
  };
  node.classList = { add: (c) => node.classes.add(c), contains: (c) => node.classes.has(c) };
  children.forEach((c) => { c.parentElement = node; });
  return node;
};

describe('markLegalRow', () => {
  it('marks the section holding the copyright', () => {
    const copy = el('P', '© 2026 Royal Air Maroc. Tous les droits réservés');
    const section = el('DIV', '', [el('P', 'Site map'), copy]);
    const root = el('DIV', '', [el('DIV', '', [el('H2', 'About us')]), section]);
    assert.equal(markLegalRow(root), 1);
    assert.ok(section.classes.has('footer-legal'));
  });

  it('marks the copyright paragraph itself, so it can be smaller than the links', () => {
    const copy = el('P', '© 2026 Royal Air Maroc. Tous les droits réservés');
    const root = el('DIV', '', [el('DIV', '', [el('P', 'Site map'), copy])]);
    markLegalRow(root);
    assert.ok(copy.classes.has('footer-legal-copy'));
  });

  it('finds it however deep the wrappers go', () => {
    const copy = el('P', '© 2026 Royal Air Maroc');
    const section = el('DIV', '', [copy]);
    const root = el('DIV', '', [el('DIV', '', [el('DIV', '', [section])])]);
    assert.equal(markLegalRow(root), 1);
    assert.ok(section.classes.has('footer-legal'));
  });

  it('marks nothing when there is no copyright', () => {
    const root = el('DIV', '', [el('DIV', '', [el('H2', 'About us'), el('P', 'no notice here')])]);
    assert.equal(markLegalRow(root), 0);
  });

  // The name alone appears in 72 other footer links, so the year is part of the test.
  it('needs a year, not just the airline name', () => {
    const root = el('DIV', '', [el('DIV', '', [el('P', 'Royal Air Maroc Cargo')])]);
    assert.equal(markLegalRow(root), 0);
  });

  it('marks a section once even when called twice', () => {
    const copy = el('P', '© 2026 Royal Air Maroc');
    const section = el('DIV', '', [copy]);
    const root = el('DIV', '', [section]);
    markLegalRow(root);
    assert.equal(markLegalRow(root), 0);
  });

  it('survives an empty root', () => {
    assert.equal(markLegalRow(null), 0);
    assert.equal(markLegalRow(el('DIV')), 0);
  });
});

const css = readFileSync(new URL('../blocks/footer/footer.css', import.meta.url), 'utf8');

describe('the legal row styling', () => {
  it('sets live\'s 14px on the links', () => {
    assert.match(css, /\.footer-legal[\s\S]{0,400}font-size:\s*14px/);
  });

  // The first version of this rule was `.footer-legal-copy`, (0,2,1) against the row's
  // (0,2,2), so the copyright rendered at 14px while this assertion passed. A text match
  // cannot see a cascade, so the selector has to out-specify the row on its own terms.
  it('sets live\'s 12px on the copyright, from a selector that outranks the row', () => {
    assert.match(css, /p\.footer-legal-copy\s*\{[\s\S]*?font-size:\s*12px/);
  });

  it('divides the links with a logical border, which flips for Arabic', () => {
    assert.match(css, /border-inline-end:\s*1px solid/);
    assert.doesNotMatch(css, /\.footer-legal[^{]*\{[^}]*border-right:/);
  });

  it('drops the divider after the last link', () => {
    assert.match(css, /a:last-child\s*\{[\s\S]*?border-inline-end:\s*(none|0)/);
  });

  it('centres the row, as live does with flex-jc-c', () => {
    assert.match(css, /\.footer-legal[\s\S]{0,300}justify-content:\s*center/);
  });
});

// Live's footer band is `padding-block: 1.5rem` with no breakpoint, and a browser read agrees at
// both 800 and 1440: 24px top and 24px bottom on `.footer`. Ours was the boilerplate's 40px top,
// which is a default rather than a measured value.
//
// The horizontal inset is left alone. Live's `.footer` has none, and its content inset comes from
// inner containers that differ per row: at 800 "About us" sits at left 20 and "Payment Methods" at
// 40, so there is no single live number to copy and our 24 sits inside that range.
describe('the footer band padding', () => {
  const inner = /footer \.footer > div \{[\s\S]*?\}/.exec(css);

  it('takes live\'s measured 24px at the top, not the boilerplate\'s 40px', () => {
    assert.ok(inner, 'the footer inner rule exists');
    assert.doesNotMatch(inner[0], /padding:\s*40px/);
    assert.match(inner[0], /padding-block:\s*24px/);
  });

  // Live has no horizontal footer breakpoint: 0 of 121 min-width values in the 2025 sheet touch
  // `.footer` padding, and the only footer query is `.footer__container{max-width:1240px}` at 1280.
  it('drops the 900 step, which live has no counterpart for', () => {
    assert.doesNotMatch(css, /@media \(width >= 900px\)/);
  });
});
