import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync(new URL('../blocks/footer/footer.css', import.meta.url), 'utf8');

// Live lays its three footer menus in a ROW at desktop and stacks them below 992. Measured in a browser
// on live's /en-gb/fiji-airways on 2026-08-05, reading the `<ul>` that holds them:
//   at  991  flex-direction column, items 991px wide, y 1440 / 1494 / 1549
//   at  992  flex-direction row, gap 64px, items 95px wide, x 100 / 259 / 444, the ul 407x54
// 992 is live's own breakpoint, the same one its breadcrumb uses, and there is no 900 query in the 2025
// sheet. Live's items carry no border at either width: 0px at 991 and 0px at 1440.
//
// Ours stacked at every width, each heading 1240px wide with a 1px divider under it, so the footer ran
// 381px against live's 281px and looked like a mobile accordion on a desktop page.
//
// The open state is ours rather than live's. Live's headings are tab triggers whose href is a relative
// widget handle, `tabMenuFooter1`, and clicking one changed nothing measurable in the footer, so there is
// no live desktop behaviour to copy. An open group takes the full row instead, which keeps the other two
// where they were.
describe('the footer menu row', () => {
  const desktop = () => {
    const at = css.indexOf('@media (width >= 992px)');
    assert.notEqual(at, -1, 'no 992 query in footer.css');
    return css.slice(at);
  };

  it('switches at live\'s 992, and not at 900', () => {
    assert.match(css, /@media \(width >= 992px\)/);
    assert.doesNotMatch(css, /@media \(width >= 900px\)/);
  });

  it('lays the sections in a wrapping row with live\'s 64px gap', () => {
    const d = desktop();
    assert.match(d, /display:\s*flex/);
    assert.match(d, /flex-wrap:\s*wrap/);
    assert.match(d, /column-gap:\s*64px/);
  });

  it('keeps a section that is not a menu on its own line', () => {
    assert.match(desktop(), /:not\(:has\(\.footer-group-title\)\)/);
  });

  it('drops the divider live does not have at desktop', () => {
    assert.match(desktop(), /\.footer-group-title\s*\{[^}]*border-bottom:\s*0/);
  });

  // Below the query the accordion is unchanged, which is live's mobile shape.
  it('leaves the divider in place below 992', () => {
    const mobile = css.slice(0, css.indexOf('@media (width >= 992px)'));
    assert.match(mobile, /\.footer-group-title\s*\{[\s\S]*?border-bottom:\s*1px solid/);
  });

  it('gives an open group the full row', () => {
    assert.match(desktop(), /aria-expanded="true"/);
  });
});

// Live's footer headings are page headings in the markup and body copy on screen. `Payment Methods` is
// `<h2 class="f-body-m f-fw-n footer__link">` and computes 14px weight 400 on live; the three menu titles
// are `<h3 class="footer__menu__title f-body-l f-fw-n">` at 16px weight 400. Ours took the shared heading
// rule and drew `Payment Methods` at 32px weight 300, which was the largest text in the footer.
//
// The rule is on the footer rather than on that one heading: no heading in a footer is a page heading, and
// the payment strip's h2 carries no class to select.
describe('footer heading type', () => {
  it('sizes a footer heading at live\'s 14px, not the page heading scale', () => {
    assert.match(css, /footer[^{]*h2[^{]*\{[^}]*font-size:\s*14px/);
  });

  it('gives it live\'s weight 400', () => {
    const rule = /footer[^{]*h2[^{]*\{[^}]*\}/.exec(css)[0];
    assert.match(rule, /font-weight:\s*400/);
  });

  it('leaves the menu titles at 16px', () => {
    const title = /\.footer-group-title\s*\{[^}]*\}/.exec(css)[0];
    assert.match(title, /font-size:\s*var\(--body-font-size-m\)|font-size:\s*16px/);
  });
});
