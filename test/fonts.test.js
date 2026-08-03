import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const fonts = readFileSync(new URL('../styles/fonts.css', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
const head = readFileSync(new URL('../head.html', import.meta.url), 'utf8');

const FONT_ORIGIN = 'https://www.royalairmaroc.com/o/ram-airways-theme/2025/assets/fonts';

// Ben's ruling: until the migration cuts over, the brand fonts are served from
// the current domain rather than copied here. Museo Sans and Museo are
// commercial exljbris typefaces, so hosting a copy needs a licence covering this
// host and that answer is not in yet.
//
// It works because royalairmaroc.com answers access-control-allow-origin: * on
// the font files, verified with and without an Origin header. Proven end to end
// on a migrated page: the face loads, document.fonts.check passes, and the
// rendered width of a paragraph moves from 706.47px to 672.14px.
describe('brand fonts', () => {
  it('loads every weight from the live origin', () => {
    ['100', '300', '500', '700'].forEach((weight) => {
      assert.match(fonts, new RegExp(`${FONT_ORIGIN}/museosans_${weight}-webfont\\.woff2`));
    });
  });

  it('names the family the live theme names, so the token is the client tone', () => {
    assert.match(fonts, /font-family: ram-primary-font/);
    assert.match(fonts, /font-family: ram-secondary-font/);
  });

  // The live theme sets no unicode-range on any face, so Museo Sans is offered
  // for every script and the browser falls back per glyph. A Latin-only range
  // would change which glyphs the brand font draws on the Arabic, Russian and
  // Turkish estates.
  it('sets no unicode-range, matching the live theme', () => {
    // The property, not the word: the file explains itself in a comment.
    assert.doesNotMatch(fonts, /^\s*unicode-range:/m);
  });

  it('keeps font-display swap on every face, as the live theme does', () => {
    const faces = fonts.match(/@font-face\s*\{[^}]*\}/g) || [];
    assert.ok(faces.length >= 8, `expected the four weights of two families, found ${faces.length}`);
    faces
      .filter((face) => !face.includes('src: local('))
      .forEach((face) => assert.match(face, /font-display:\s*swap/));
  });

  it('drops the roboto faces the boilerplate shipped', () => {
    assert.doesNotMatch(fonts, /roboto-(regular|bold|medium|condensed)/);
  });

  it('points the family tokens at the brand fonts', () => {
    assert.match(styles, /--body-font-family:\s*ram-primary-font/);
    assert.match(styles, /--heading-font-family:\s*ram-primary-font/);
  });

  // A third-party origin in the font path costs a DNS lookup and a TLS
  // handshake before the first glyph. A preconnect pays that down while the page
  // is still parsing.
  it('preconnects to the font origin', () => {
    assert.match(head, /rel="preconnect"[^>]*https:\/\/www\.royalairmaroc\.com/);
  });

  it('keeps a size-adjusted local fallback so the swap does not reflow', () => {
    assert.match(styles, /font-family: ram-primary-font-fallback/);
    assert.match(styles, /size-adjust:/);
  });
});

// 95.14% came from one paragraph and pointed the wrong way. Measured in Chrome against the loaded brand
// face on eight real paragraphs of /en-gb/how-it-works at their own computed size, the adjusted fallback
// rendered 6.75 per cent NARROWER than the brand font, mean ratio 0.9325. Sweeping the value in the
// browser: 95.14% gives 0.9325, 100% gives 0.9803, 102% gives 0.9999 and 103% overshoots to 1.0097.
// A narrower fallback fits more words per line, so text re-wraps when the brand face swaps in, which is
// the residual CLS on the two pages still short of 100.
describe('the size-adjusted fallback face', () => {
  const face = /@font-face \{[^}]*ram-primary-font-fallback[^}]*\}/.exec(styles)[0];

  it('matches the brand font width rather than undercutting it', () => {
    const adjust = Number(/size-adjust:\s*([\d.]+)%/.exec(face)[1]);
    assert.ok(adjust >= 101.5 && adjust <= 102.5, `expected about 102%, got ${adjust}%`);
  });

  it('still resolves to a local face, so the fallback costs no request', () => {
    assert.match(face, /src:\s*local\(/);
  });
});
