import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
const declared = styles.replace(/\/\*[\s\S]*?\*\//g, '');

// #11 shipped the section rhythm with this end measured and not matched: 48px under the last ink
// against live's 24, read at 1440 on /en-gb/checked-baggage, /en-gb/carry-on-baggage and
// /en-gb/airport-transit. The pipeline leaves a trailing section with no children, which is what
// the metadata block was in, and /en-gb/checked-baggage carries one against four real sections.
describe('the page end', () => {
  // :empty is defeated by a whitespace text node, which the pipeline leaves. A display: none box
  // contributes no margin at all, where a zeroed margin still leaves its own to collapse.
  it('takes the trailing childless section out of flow', () => {
    assert.match(declared, /main > \.section:not\(:has\(> \*\)\)\s*\{[^}]*display:\s*none/);
  });

  // The gap is on the top alone, so the bottom end is main's padding and nothing else. This needs
  // no sibling selector, which matters: `:has(+ .section:not(:has(> *)))` reads correctly and is
  // INVALID, because :has() cannot be nested inside :has(). The browser drops the rule whole while
  // a test that matches the stylesheet text still passes.
  it('gives the gap to the top of a section, so no bottom margin adds to main\'s padding', () => {
    const rule = /^main > \.section\s*\{[^}]*\}/m.exec(declared);
    assert.ok(rule, 'expected the section rule');
    assert.match(rule[0], /margin:\s*24px 0 0/);
  });

  it('does not try to reach the last section with a nested :has', () => {
    assert.doesNotMatch(declared, /:has\([^)]*:has\(/);
  });
});
