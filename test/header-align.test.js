import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync(new URL('../blocks/header/header.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const base = /\nheader nav \{[\s\S]*?\n\}/.exec(declarations);

// Live puts the logo on the content column's left edge. Measured in a browser on
// live's /en-gb/fiji-airways at 1440 on 2026-08-04: the logo, the breadcrumb, the
// page title and the first paragraph all start at 100, and live's .container is
// 1240 wide with max-width 1240px, which is this repo's --content-max-width.
//
// Ours started the logo at 120 and the content at 100, a 20px offset, because the
// nav carried its own geometry: max-width 1248px with a 24px inset below 900 and
// 1264px with a 32px inset above, against the section's 90%/1240px with a 13.5px
// inset. The offset is never zero above 375px. Read on the published
// /en-gb/american-airlines at 1440: nav content box left 120, h1 left 100.
describe('the header content box', () => {
  it('takes the section own width tokens rather than its own number', () => {
    assert.ok(base, 'header nav rule exists');
    assert.match(base[0], /width:\s*var\(--content-width\)/);
    assert.match(base[0], /max-width:\s*var\(--content-max-width\)/);
  });

  it('drops the literal widths that caused the offset', () => {
    assert.doesNotMatch(declarations, /max-width:\s*1248px/);
    assert.doesNotMatch(declarations, /max-width:\s*1264px/);
  });

  it('uses the section own 13.5px inset', () => {
    assert.match(base[0], /padding-inline:\s*13\.5px/);
  });

  it('pins the width and drops the inset at the section cap, as the section does', () => {
    const at = declarations.indexOf('@media (width >= 1280px)');
    assert.ok(at > -1, 'a 1280 query exists');
    const capped = declarations.slice(at, at + 280);
    assert.match(capped, /header nav/);
    assert.match(capped, /width:\s*var\(--content-max-width\)/);
    assert.match(capped, /padding-inline:\s*0/);
  });
});
