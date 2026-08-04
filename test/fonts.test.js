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

// 95.14% came from one paragraph and pointed the wrong way. Measured in Chrome against the
// loaded brand face on eight real paragraphs of /en-gb/how-it-works at their own computed
// size, the adjusted fallback rendered 6.75 per cent NARROWER than the brand font, mean ratio
// 0.9325. Sweeping the value in the browser: 95.14% gives 0.9325, 100% gives 0.9803, 102%
// gives 0.9999 and 103% overshoots to 1.0097. A narrower fallback fits more words per line, so
// text re-wraps when the brand face swaps in, which is the residual CLS on the two pages still
// short of 100.
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

// 47 generated documents carry an <em> or an <i>, 103 runs in all, spread evenly across the ten
// locales. Every one of our 11 @font-face blocks declares `font-style: normal`, so the browser
// synthesises an oblique by shearing the upright face.
//
// Live has real italics and only for the primary family: 6 italic faces in the 2025 sheet,
// 9 in main62.css, 8 in ram-nr-2022.css, all `font-family: ram-primary-font`.
// ram-secondary-font has none on either theme, so none is added here.
//
// The files load cross-origin the same way the upright faces already do. Probed 2026-08-04:
// all five answer 200 with `content-type: font/woff2` and `access-control-allow-origin: *`,
// 22,988 to 23,800 bytes each. No new licence answer beyond the one this file records.
describe('the italic faces', () => {
  const italics = fonts.match(/@font-face\s*\{[^}]*font-style:\s*italic[^}]*\}/g) || [];

  it('declares one per weight live has', () => {
    assert.equal(italics.length, 5);
  });

  it('covers live\'s weights 100, 300, 500, 700 and 900', () => {
    const weights = italics
      .map((f) => /font-weight:\s*(\d+)/.exec(f)?.[1] ?? '')
      .sort((a, b) => Number(a) - Number(b));
    assert.deepEqual(weights, ['100', '300', '500', '700', '900']);
  });

  it('puts them on the primary family, which is the only one live gives italics', () => {
    assert.ok(italics.every((f) => /font-family:\s*ram-primary-font/.test(f)));
    assert.doesNotMatch(fonts, /font-family:\s*ram-secondary-font;[\s\S]{0,80}font-style:\s*italic/);
  });

  it('loads them from live, like the upright faces', () => {
    assert.ok(italics.every((f) => /museosans_\d+_italic-webfont\.woff2/.test(f)));
    assert.ok(italics.every((f) => f.includes('royalairmaroc.com/o/ram-airways-theme/2025/assets/fonts/')));
  });

  it('swaps rather than blocking, like the upright faces', () => {
    assert.ok(italics.every((f) => /font-display:\s*swap/.test(f)));
  });

  it('leaves the upright faces alone', () => {
    assert.equal((fonts.match(/font-style:\s*normal/g) || []).length, 11);
  });
});

// The h1 asks for ram-secondary-font, which is Museo, and fell back to
// ram-primary-font-fallback, whose 102% size-adjust was swept against Museo SANS.
// Measured in a browser on a published page, that fallback against Museo:
//   Fiji Airways 0.959, the long American Airlines title 0.969,
//   Checked baggage 0.990, Conditions générales 0.963,
//   the Arabic checked-baggage title 0.970, Ödeme yöntemleri 0.947
// So the h1 drew 3 to 5 per cent narrow and widened when Museo arrived. On a title
// near a wrap boundary that flips a line and moves the page below it, and the h1 is
// above the fold on 965 documents. fonts.css is deferred below 900px, so the swap
// lands late on mobile, which is where it costs most.
//
// Swept the same way the 102% was: 105% gives a mean of 0.9947, 105.5% gives 0.9993,
// 106% overshoots to 1.0041.
//
// Cyrillic is excluded from the mean and reads 1.117 at 105.5%. Museo has no Cyrillic,
// so neither side draws it and the ratio compares two per-glyph fallbacks.
describe('the secondary fallback face', () => {
  const face = /@font-face\s*\{[^}]*ram-secondary-font-fallback[^}]*\}/.exec(fonts)
    || /@font-face\s*\{[^}]*ram-secondary-font-fallback[^}]*\}/.exec(styles);

  it('exists, rather than borrowing the one tuned for Museo Sans', () => {
    assert.ok(face, 'a ram-secondary-font-fallback face is declared');
  });

  it('carries the swept 105.5%', () => {
    assert.match(face[0], /size-adjust:\s*105\.5%/);
  });

  it('is a local face, so it costs no request', () => {
    assert.match(face[0], /src:\s*local\(/);
  });

  it('is what the secondary stack falls back to', () => {
    assert.match(styles, /--secondary-font-family:\s*ram-secondary-font,\s*ram-secondary-font-fallback/);
  });

  it('leaves the body and heading stacks on the 102% face', () => {
    assert.match(styles, /--body-font-family:\s*ram-primary-font,\s*ram-primary-font-fallback/);
    assert.match(styles, /--heading-font-family:\s*ram-primary-font,\s*ram-primary-font-fallback/);
    assert.match(styles, /font-family:\s*ram-primary-font-fallback;\s*size-adjust:\s*102%/);
  });
});
