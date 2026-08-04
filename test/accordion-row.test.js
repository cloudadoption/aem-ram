import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync(new URL('../blocks/accordion/accordion.css', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
const declared = css.replace(/\/\*[\s\S]*?\*\//g, '');

// Live's own rules, verbatim from /o/ram-airways-theme/2025/css/styles.css:
//
//   .accordion__item{border-block-end:.0625rem solid var(--ram-neutral-200-color)}
//   .accordion__button{padding-block:.75rem}
//   .accordion__title{margin-inline-start:.25rem;color:var(--ram-text-dark-color)}
//   .accordion__chevron{margin-inline-end:.25rem;color:var(--ram-text-dark-color)}
//   .accordion__button.active .accordion__chevron{transform:rotate(180deg)}
//
// Ported from da-ram #57, keeping our own class names: accordion.js writes .accordion-item and
// .accordion-item-label, where their block styles bare `details` and `summary`.
describe('an accordion row', () => {
  const item = /\.accordion \.accordion-item \{[^}]*\}/.exec(declared);
  const label = /\.accordion \.accordion-item-label \{[^}]*\}/.exec(declared);

  // Ours copied the table block's #dee2e6. Live's accordion uses its own neutral token,
  // #ebeae8.
  it('rules the row in live\'s neutral token, not the table\'s grey', () => {
    assert.ok(item, 'expected an accordion-item rule');
    assert.match(item[0], /border-block-end:\s*1px solid var\(--ram-neutral-200-color\)/);
    assert.doesNotMatch(item[0], /#dee2e6/);
    assert.match(styles, /--ram-neutral-200-color:\s*#ebeae8/);
  });

  // Live's question is dark and at body weight: the theme sets its colour to
  // --ram-text-dark-color at 16px on 22.4px and weight 400. Ours drew it in the brand red at 600.
  it('draws the question dark at body weight, as live declares', () => {
    assert.ok(label, 'expected an accordion-item-label rule');
    assert.match(label[0], /color:\s*var\(--ram-text-dark-color\)/);
    assert.match(label[0], /font-weight:\s*400/);
    assert.doesNotMatch(label[0], /--ram-brand-primary-color/);
  });

  // 12px is live's .75rem. Ours drew 16, which with the leading below made a 50px row against
  // live's 46.
  it('pads the row at live\'s 12px and starts the text 4px in', () => {
    assert.match(label[0], /padding-block:\s*12px/);
    assert.match(label[0], /padding-inline-start:\s*4px/);
  });

  it('takes live\'s leading rather than the page\'s', () => {
    assert.match(label[0], /line-height:\s*1\.4/);
  });

  // The pipeline wraps the question in a paragraph, and live's is an h3.accordion__title with no
  // margin, so the global 4px paragraph margin added to the row. Live's component overrides the
  // heading ramp too, which is why the size is inherited rather than left to the child: a question
  // arriving as a heading would otherwise draw at the heading size.
  it('gives whatever sits in the label no margin and the row\'s own type', () => {
    const child = /\.accordion \.accordion-item-label > \* \{[^}]*\}/.exec(declared);
    assert.ok(child, 'expected a rule for the label\'s child');
    assert.match(child[0], /margin-block:\s*0/);
    assert.match(child[0], /font-size:\s*inherit/);
    assert.match(child[0], /font-weight:\s*inherit/);
  });
});

// Live's marker is i.accordion__chevron.ram-icon-chevron-down, a 20x20 box at 20px in
// --ram-text-dark-color with margin-inline-end 4px, turned 180deg while it is open. The glyph
// is in the client's ram-icons font, which this repo does not load, so it is drawn. Ours drew a `+`
// turning 45deg, which is the boilerplate's shape and not live's.
describe('the accordion marker', () => {
  it('is a drawn chevron rather than a plus', () => {
    const after = /\.accordion \.accordion-item-label::after \{[^}]*\}/.exec(declared);
    assert.ok(after, 'expected a marker rule');
    assert.match(after[0], /border-inline-end:\s*2px solid var\(--ram-text-dark-color\)/);
    assert.match(after[0], /border-block-end:\s*2px solid var\(--ram-text-dark-color\)/);
    assert.match(after[0], /transform:\s*rotate\(45deg\)/);
    assert.doesNotMatch(after[0], /content:\s*'\+'/);
  });

  // Closed points down, open points up, which is live's 180deg turn expressed from a 45deg base.
  it('turns over when the panel opens', () => {
    const open = /\.accordion-item\[open\] \.accordion-item-label::after \{[^}]*/;
    assert.match(declared, new RegExp(`${open.source}transform:\\s*rotate\\(225deg\\)`));
  });

  // The DA canvas strips an empty span on save, so an authored icon would not survive an edit.
  it('is drawn and never authored', () => {
    assert.match(declared, /::after \{[^}]*content:\s*''/);
  });
});
