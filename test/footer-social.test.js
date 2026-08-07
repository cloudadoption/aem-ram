import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { markSocialRow } from '../blocks/footer/footer-social.js';

// Live closes its footer with "Follow us on" and five links to Facebook, X, Instagram,
// YouTube and Messenger. The row was authored into the ten footer documents as five
// TEXT links rather than live's icon font, which draws on private-use codepoints and
// leaves five empty boxes when it fails to load.
//
// UNSTYLED IT IS HARDER TO TAP THAN LIVE'S. Measured in a browser at 1440 on
// /en-gb/checked-baggage: live's five are 37x36 with 16px gaps, ours were 18px tall
// with 4px gaps and the X link 9px wide, so the row was a third target-size node on
// a page that had two. 24x24 is the minimum axe checks.
//
// The row is marked from its links rather than by position, the way markLegalRow uses
// the ©: a :last-child selector on the section would be true only because the tool
// appends this row last.

const el = (tag, text = '', children = [], href = '') => {
  const node = {
    tagName: tag,
    href,
    textContent: text || children.map((c) => c.textContent).join(' '),
    children,
    classes: new Set(),
  };
  node.classList = { add: (c) => node.classes.add(c), contains: (c) => node.classes.has(c) };
  node.querySelectorAll = (sel) => {
    const want = sel.toUpperCase();
    const out = [];
    const walk = (n) => (n.children || []).forEach((c) => {
      if (c.tagName === want) out.push(c);
      walk(c);
    });
    walk(node);
    return out;
  };
  children.forEach((c) => { c.parentElement = node; });
  return node;
};
const link = (href, text) => el('A', text, [], href);
const socialRow = () => el('P', '', [
  link('https://www.facebook.com/RoyalAirMaroc/', 'Facebook'),
  link('https://twitter.com/RAM_Maroc', 'X'),
  link('https://www.instagram.com/royalairmaroc/', 'Instagram'),
  link('https://www.youtube.com/channel/UCr9qgja2KRCJ2o1ofBa2irw', 'YouTube'),
  link('https://m.me/RoyalAirMaroc', 'Messenger'),
]);

describe('markSocialRow', () => {
  it('marks the paragraph holding the social links', () => {
    const row = socialRow();
    const root = el('DIV', '', [el('DIV', '', [el('H2', 'About us')]), el('DIV', '', [el('H2', 'Follow us on'), row])]);
    assert.equal(markSocialRow(root), 1);
    assert.ok(row.classes.has('footer-social'));
  });

  it('leaves the legal row alone', () => {
    const legal = el('P', '', [link('/en-gb/site-map', 'Site map'), link('/en-gb/general-terms-and-conditions', 'Terms')]);
    const root = el('DIV', '', [legal]);
    assert.equal(markSocialRow(root), 0);
    assert.ok(!legal.classes.has('footer-social'));
  });

  // One social link in a menu of ordinary links is a menu, not the row.
  it('needs more than one social link', () => {
    const one = el('P', '', [link('https://www.facebook.com/RoyalAirMaroc/', 'Facebook'), link('/en-gb/flights', 'Flights')]);
    assert.equal(markSocialRow(el('DIV', '', [one])), 0);
  });

  it('is idempotent, because the footer decorates once per page load', () => {
    const row = socialRow();
    const root = el('DIV', '', [row]);
    assert.equal(markSocialRow(root), 1);
    assert.equal(markSocialRow(root), 0);
  });

  it('does not throw on an empty root', () => {
    assert.equal(markSocialRow(null), 0);
    assert.equal(markSocialRow(el('DIV')), 0);
  });
});

// The CSS is what makes the row tappable, so the numbers are asserted here: without
// them the marker is a class nothing reads.
describe('the footer social row CSS', () => {
  const styles = readFileSync(new URL('../blocks/footer/footer.css', import.meta.url), 'utf8');
  const rule = /footer \.footer \.footer-social a:any-link \{[\s\S]*?\n\}/.exec(styles);

  it('gives each link a 24px minimum box', () => {
    assert.ok(rule, 'expected a rule for the social links');
    assert.match(rule[0], /min-height:\s*24px/);
    // The X link is 9px of text, so the box needs width from padding.
    assert.match(rule[0], /padding-inline:\s*8px/);
  });

  it('centres the label in that box rather than leaving it inline', () => {
    assert.match(rule[0], /display:\s*inline-flex/);
    assert.match(rule[0], /align-items:\s*center/);
  });
});
