import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');

// Live paints the page ground below the header #f7f7f7 and ours was white, with no section on the
// estate carrying a background at all. Live declares it as
// `body .bck-gray { background-color: var(--ram-background-alternative-color) }`, and that token is
// already #f7f7f7 here.
//
// The grey band is the constant across the 2025 theme, measured by ram2 on three pages that differ
// in what sits on top: /en-gb/checked-baggage puts article prose straight onto the grey with no card,
// /en-gb/preparing-your-trip puts it on a #f7f7f7 card inside a white container, and
// /en-gb/carry-on-baggage on a #f9f9f9 rounded box. The wrappers are per-page authored values; the
// band is on all three.
//
// It also makes the cards visible. A cards block draws white, and drew it on white, so the six small
// cards on /en-gb/checked-baggage read as no boxes at all.
describe('the page ground', () => {
  it('paints main with live\'s alternative background, not white', () => {
    assert.match(styles, /^main\s*\{[^}]*background-color:\s*var\(--ram-background-alternative-color\)/m);
  });

  it('keeps the token at the value live declares', () => {
    assert.match(styles, /--ram-background-alternative-color:\s*#f7f7f7/);
  });

  // Live's own body is white and only the inner band is grey, so painting body would put the grey
  // behind the header and the footer too.
  it('leaves body on the default background, as live\'s is', () => {
    const body = /^body\s*\{[^}]*\}/m.exec(styles);
    assert.ok(body, 'styles.css declares a body rule');
    assert.match(body[0], /background-color:\s*var\(--background-color\)/);
    assert.doesNotMatch(body[0], /--ram-background-alternative-color/);
  });
});
