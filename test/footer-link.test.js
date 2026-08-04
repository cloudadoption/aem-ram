import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync(new URL('../blocks/footer/footer.css', import.meta.url), 'utf8');
const declared = css.replace(/\/\*[\s\S]*?\*\//g, '');

// Live's footer rules, from /o/ram-airways-theme/2025/css/styles.css:
//
//   .footer__link:hover{color:var(--ram-text-primary-color);text-decoration:none}
//   .footer__list__item:hover says the same
//   h3.footer__menu__title is 16px on 22.4px, its .f-body-l declaring line-height 140%
//
// Ported from da-ram #62. Two of its four rules are left out because they match nothing here: our
// footer document carries no legal-notice paragraph and no row of three links under the columns, so
// the band and the bar-list rules would style nothing. That is a content gap in our own footer
// document rather than a stylesheet one, and it is recorded in PROGRESS.
describe('a footer link', () => {
  // Ours underlined and stayed white. Live colours it and takes the underline off.
  it('takes live\'s colour on hover and no underline', () => {
    const hover = /footer \.footer a:hover \{[^}]*\}/.exec(declared);
    assert.ok(hover, 'expected a footer link hover rule');
    assert.match(hover[0], /color:\s*var\(--ram-text-primary-color\)/);
    assert.match(hover[0], /text-decoration:\s*none/);
    assert.doesNotMatch(hover[0], /text-decoration:\s*underline/);
  });
});

describe('a footer column heading', () => {
  // Ours is an h2, so it took the 1.2 the shared heading rule in styles.css sets and read 19.2px
  // against live's 22.4.
  it('takes live\'s leading rather than the heading ramp\'s', () => {
    const title = /\.footer-group-title \{[^}]*\}/.exec(declared);
    assert.ok(title, 'expected a footer-group-title rule');
    assert.match(title[0], /line-height:\s*1\.4/);
  });
});
