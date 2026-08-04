import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
const rule = (selector) => {
  const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{([^}]*)\\}`);
  const m = re.exec(styles);
  return m ? m[1] : null;
};

// A body link does not change on hover on live. Read from the client's own
// /o/ram-airways-theme/2025/css/styles.css on 2026-08-04:
//
//   body a:-webkit-any-link { cursor: pointer; text-decoration: none }
//   body a               { font-weight: 400; color: var(--ram-text-primary-color) }
//   body a:hover         { text-decoration: none; color: var(--ram-text-primary-color) }
//
// So the underline is off at rest AND on hover, and the hover colour is the rest
// colour. --ram-text-primary-color is #c20831.
//
// The boilerplate had it the other way round: no underline at rest, an underline
// added on hover, and the colour moving to #8d2b61. That is two visible changes
// live does not make, on every link in the estate. The same shape was already
// fixed for footer links in PR #19, which is where the pattern comes from.
describe('a body link on hover', () => {
  it('keeps the rest colour, which is the client link token', () => {
    assert.match(styles, /--link-hover-color:\s*var\(--ram-text-primary-color\)/);
  });

  it('does not take the dark brand token, which is the active state of a button', () => {
    assert.doesNotMatch(styles, /--link-hover-color:\s*var\(--ram-brand-primary-dark-color\)/);
  });

  it('gains no underline, because live removes it at rest and leaves it off', () => {
    const hover = rule('a:hover');
    assert.ok(hover, 'an a:hover rule exists');
    assert.doesNotMatch(hover, /text-decoration:\s*underline/);
  });

  it('still has no underline at rest', () => {
    assert.match(rule('a:any-link'), /text-decoration:\s*none/);
  });
});

// The primary button moves through THREE backgrounds and the middle one is not the
// dark variant. From the same stylesheet:
//
//   .ram-btn-f1,.ram-btn-f1-small
//     { background-color: var(--ram-brand-primary-color) }                  #c20831
//   .ram-btn-f1:hover,.ram-btn-f1:focus,.ram-btn-f1-small:hover,.ram-btn-f1-small:focus
//     { color: var(--ram-text-inverse-color); background: var(--ram-background-positive-color) }
//                                                                          #a22032
//   .ram-btn-f1:active,.ram-btn-f1.active,.ram-btn-f1-small:active,.ram-btn-f1-small.active
//     { background: var(--ram-brand-primary-dark-color) }                   #8d2b61
//
// The rest state already matched. The hover read #8d2b61, which is live's ACTIVE
// colour, so the button skipped its middle state and there was no active state at
// all.
describe('the accent button', () => {
  it('hovers to the client positive background, not the dark brand', () => {
    const hover = rule('button.button.accent:focus-visible');
    assert.ok(hover, 'an accent hover rule exists');
    assert.match(hover, /background-color:\s*var\(--ram-background-positive-color\)/);
    assert.doesNotMatch(hover, /background-color:\s*var\(--ram-brand-primary-dark-color\)/);
  });

  it('has an active state on the dark brand token', () => {
    assert.match(styles, /a\.button\.accent:active[\s\S]{0,120}?--ram-brand-primary-dark-color/);
  });
});
