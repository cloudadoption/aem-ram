import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { footerGroups, markFooterGroups } from '../blocks/footer/footer-groups.js';

// Live's footer is 280px tall and shows 36 of its 114 links: the three link
// lists sit behind their headings and open on a click. The migrated footer
// showed all 71 of its links and ran to 1,513px, which is 1,233px added to
// every page in the estate.
const node = (tag, text = '') => ({ tagName: tag, textContent: text });

describe('footerGroups', () => {
  it('pairs a heading with the list under it', () => {
    const kids = [node('H2', 'About us'), node('UL'), node('H2', 'Help'), node('UL')];
    assert.deepEqual(footerGroups(kids), [[0, 1], [2, 3]]);
  });

  it('ignores a heading with no list under it', () => {
    const kids = [node('H2', 'About us'), node('P'), node('H2', 'Help'), node('UL')];
    assert.deepEqual(footerGroups(kids), [[2, 3]]);
  });

  it('ignores a list with no heading over it', () => {
    assert.deepEqual(footerGroups([node('UL'), node('H2', 'Help'), node('UL')]), [[1, 2]]);
  });

  it('takes a heading at any level', () => {
    assert.deepEqual(footerGroups([node('H3', 'Help'), node('UL')]), [[0, 1]]);
  });

  it('pairs an ordered list too', () => {
    assert.deepEqual(footerGroups([node('H2', 'Help'), node('OL')]), [[0, 1]]);
  });

  it('finds nothing in a footer with no lists', () => {
    assert.deepEqual(footerGroups([node('P'), node('P')]), []);
  });
});

const element = (tag, text = '') => {
  const classes = new Set();
  const attrs = {};
  const self = {
    tagName: tag,
    textContent: text,
    children: [],
    style: { display: '' },
    classList: { add: (c) => classes.add(c), contains: (c) => classes.has(c) },
    setAttribute: (k, v) => { attrs[k] = String(v); },
    getAttribute: (k) => attrs[k] ?? null,
    addEventListener: (name, fn) => { attrs[`on:${name}`] = fn; },
    fire: (name) => attrs[`on:${name}`] && attrs[`on:${name}`](),
    // The trigger is a button the block creates inside the heading, so the double has to be able to
    // make one and to hold it.
    replaceChildren: (...kids) => { self.children = kids; },
    querySelector: (sel) => self.children.find((c) => c.tagName === sel.toUpperCase()) ?? null,
    // The DOM upper-cases a created element's tagName, so the double does too.
    ownerDocument: { createElement: (t) => element(t.toUpperCase()) },
    attrs,
    classes,
  };
  return self;
};

describe('markFooterGroups', () => {
  const footerWith = (kids) => ({ children: kids });

  it('marks the heading and its list', () => {
    const h = element('H2', 'About us');
    const ul = element('UL');
    markFooterGroups(footerWith([h, ul]));
    assert.ok(h.classList.contains('footer-group-title'));
    assert.ok(ul.classList.contains('footer-group-list'));
  });

  it('closes the group, because live opens on a click', () => {
    const h = element('H2', 'About us');
    const ul = element('UL');
    markFooterGroups(footerWith([h, ul]));
    assert.equal(h.children[0].getAttribute('aria-expanded'), 'false');
  });

  it('opens on a click and closes again', () => {
    const h = element('H2', 'About us');
    const ul = element('UL');
    markFooterGroups(footerWith([h, ul]));
    const button = h.children[0];
    button.fire('click');
    assert.equal(button.getAttribute('aria-expanded'), 'true');
    button.fire('click');
    assert.equal(button.getAttribute('aria-expanded'), 'false');
  });

  it('returns how many groups it marked', () => {
    const kids = [element('H2', 'A'), element('UL'), element('H2', 'B'), element('UL')];
    assert.equal(markFooterGroups(footerWith(kids)), 2);
  });

  it('leaves a footer with no group alone', () => {
    const p = element('P', 'Copyright');
    assert.equal(markFooterGroups(footerWith([p])), 0);
    assert.ok(!p.classList.contains('footer-group-title'));
  });
});

// The footer block moves the fragment's section divs into a wrapper, so the
// headings sit one level below the element the block hands over. Marking only
// the wrapper's own children found nothing and the footer shipped expanded.
describe('markFooterGroups on the shape the block actually passes', () => {
  const withChildren = (tag, kids) => {
    const el = element(tag);
    el.children = kids;
    return el;
  };

  it('marks a group nested in a section div', () => {
    const h = element('H2', 'About us');
    const ul = element('UL');
    const section = withChildren('DIV', [h, ul]);
    const wrapper = withChildren('DIV', [section]);
    assert.equal(markFooterGroups(wrapper), 1);
    assert.ok(h.classList.contains('footer-group-title'));
  });

  it('marks groups across several sections', () => {
    const pairs = [['A', 'B'], ['C', 'D']].map(() => {
      const h = element('H2', 'x');
      return { h, section: withChildren('DIV', [h, element('UL')]) };
    });
    const wrapper = withChildren('DIV', pairs.map((p) => p.section));
    assert.equal(markFooterGroups(wrapper), 2);
  });

  it('still marks a group that is a direct child', () => {
    const h = element('H2', 'About us');
    const wrapper = withChildren('DIV', [h, element('UL')]);
    assert.equal(markFooterGroups(wrapper), 1);
  });

  // The real tree is footer > .footer.block > wrapper > .section >
  // .default-content-wrapper > h2, so a fixed depth is the wrong shape to code
  // against. Marking one level down still found nothing and it shipped expanded.
  it('marks a group three levels down, which is where the block puts it', () => {
    const h = element('H2', 'About us');
    const inner = withChildren('DIV', [h, element('UL')]);
    const section = withChildren('DIV', [inner]);
    const wrapper = withChildren('DIV', [section]);
    assert.equal(markFooterGroups(wrapper), 1);
    assert.ok(h.classList.contains('footer-group-title'));
  });

  it('does not mark the same heading twice when it nests', () => {
    const h = element('H2', 'About us');
    const section = withChildren('DIV', [h, element('UL')]);
    const wrapper = withChildren('DIV', [section]);
    markFooterGroups(wrapper);
    assert.equal(h.children[0].tagName, 'BUTTON');
    assert.equal(markFooterGroups(wrapper), 0);
  });
});

// The block's CSS arrives after the footer markup, so a group collapsed by a
// class alone paints open and then shuts: CLS went from 0 to 0.232 on mobile.
// Setting the display inline needs no stylesheet, so the first paint is already
// closed.
describe('the group is closed before anything is painted', () => {
  const withChildren = (tag, kids) => {
    const el = element(tag);
    el.children = kids;
    return el;
  };

  it('hides the list without waiting for a stylesheet', () => {
    const h = element('H2', 'About us');
    const ul = element('UL');
    markFooterGroups(withChildren('DIV', [h, ul]));
    assert.equal(ul.style.display, 'none');
  });

  it('hands the display back to the stylesheet when the group opens', () => {
    const h = element('H2', 'About us');
    const ul = element('UL');
    markFooterGroups(withChildren('DIV', [h, ul]));
    h.children[0].fire('click');
    assert.equal(ul.style.display, '');
  });

  it('hides it again on the second click', () => {
    const h = element('H2', 'About us');
    const ul = element('UL');
    markFooterGroups(withChildren('DIV', [h, ul]));
    h.fire('click');
    h.fire('click');
    assert.equal(ul.style.display, 'none');
  });
});

// The payment strip is a heading over a list of logos, the same shape as the three link menus, so
// the accordion collapsed it. Live shows the strip open and its logos are not links: 0 of the 25
// anchors in live's PaymentMethodsPortlet carry an href, the anchor holding only a `title`.
//
// So what the list contains decides. A menu of links collapses. A list with no link is content and
// stays open. A list that cannot be asked, which is each stub in the tests above, counts as a menu,
// so what worked before is untouched.
describe('footerGroups and a list with no links', () => {
  const listOf = (linkCount) => ({
    tagName: 'UL',
    textContent: '',
    querySelectorAll: () => Array.from({ length: linkCount }, () => ({})),
  });

  it('leaves a logo list open, because it holds no link', () => {
    assert.deepEqual(footerGroups([node('H2', 'Payment Methods'), listOf(0)]), []);
  });

  it('still collapses a link menu', () => {
    assert.deepEqual(footerGroups([node('H2', 'About us'), listOf(6)]), [[0, 1]]);
  });

  it('treats a list it cannot ask as a menu, so the three existing groups are untouched', () => {
    assert.deepEqual(footerGroups([node('H2', 'Help'), node('UL')]), [[0, 1]]);
  });

  it('keeps the link menu when a logo list sits beside it', () => {
    const kids = [node('H2', 'About us'), listOf(6), node('H2', 'Payment Methods'), listOf(0)];
    assert.deepEqual(footerGroups(kids), [[0, 1]]);
  });
});

// `role="button"` on the heading fails axe's `aria-allowed-role`, and Lighthouse reports it on
// every page
// in the estate: 3 items on /en-gb/fiji-airways, `h2#about-us`, `h2#destinations` and `h2#help`,
// holding
// accessibility to 96 on desktop. `aria-expanded` is not allowed on a heading either, so dropping
// the role
// alone would move the failure rather than fix it.
//
// The disclosure pattern is a real button inside the heading, which keeps the heading in the
// outline and
// gives the control its own semantics. Live's own markup does the same thing, `<h3>` inside `<a>`,
// with the
// heading and the trigger as separate elements.
describe('the group toggle is a button, not a heading pretending', () => {
  const footerWith = (kids) => ({ children: kids });

  it('puts a button inside the heading and leaves the heading a heading', () => {
    const h = element('H2', 'About us');
    markFooterGroups(footerWith([h, element('UL')]));
    assert.equal(h.getAttribute('role'), null, 'the heading still claims role=button');
    const button = h.children.find((c) => c.tagName === 'BUTTON');
    assert.ok(button, 'no button inside the heading');
  });

  it('moves the state and the tab stop onto the button', () => {
    const h = element('H2', 'About us');
    markFooterGroups(footerWith([h, element('UL')]));
    const button = h.children.find((c) => c.tagName === 'BUTTON');
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.equal(h.getAttribute('aria-expanded'), null);
    assert.equal(h.getAttribute('tabindex'), null, 'the heading is still a tab stop');
  });

  it('carries the heading text into the button', () => {
    const h = element('H2', 'About us');
    markFooterGroups(footerWith([h, element('UL')]));
    const button = h.children.find((c) => c.tagName === 'BUTTON');
    assert.equal(button.textContent, 'About us');
  });

  it('opens and closes from the button', () => {
    const h = element('H2', 'About us');
    const ul = element('UL');
    markFooterGroups(footerWith([h, ul]));
    const button = h.children.find((c) => c.tagName === 'BUTTON');
    button.fire('click');
    assert.equal(button.getAttribute('aria-expanded'), 'true');
    button.fire('click');
    assert.equal(button.getAttribute('aria-expanded'), 'false');
  });

  // A footer arriving without a document to create from must not throw and must not half-mark the
  // group.
  it('leaves the group alone when it cannot create a button', () => {
    const h = element('H2', 'About us');
    h.ownerDocument = null;
    assert.equal(markFooterGroups(footerWith([h, element('UL')])), 0);
  });
});
