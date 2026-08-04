import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
const declared = styles.replace(/\/\*[\s\S]*?\*\//g, '');

// #11 shipped the section rhythm with this end measured and not matched: 48px under the last ink
// against live's 24, read at 1440 on /en-gb/checked-baggage, /en-gb/carry-on-baggage and
// /en-gb/airport-transit. The pipeline leaves a trailing section with no children, which is what the
// metadata block was in, so :last-child matched that empty one and the last section a reader sees kept
// its own 24 on top of main's 24 of padding.
//
// Ported from da-ram. Out of flow rather than zeroed: a display: none box contributes no margin at
// all, where a zeroed bottom margin still leaves its own top margin to collapse.
describe('the page end', () => {
  // :empty is defeated by a whitespace text node, which the pipeline leaves.
  it('takes the trailing childless section out of flow rather than zeroing it', () => {
    assert.match(declared, /main > \.section:not\(:has\(> \*\)\)\s*\{[^}]*display:\s*none/);
  });

  // With the empty one out of flow the last section a reader sees is no longer :last-child, so the
  // one before an empty section is what loses its bottom margin.
  it('takes the bottom margin off the section before an empty one', () => {
    assert.match(
      declared,
      /main > \.section:has\(\+ \.section:not\(:has\(> \*\)\)\)\s*\{[^}]*margin-block-end:\s*0/,
    );
  });

  // Kept for a page the pipeline leaves no trailing section on, where the last visible section is
  // :last-child and would otherwise add its 24 to main's padding.
  it('still takes it off a genuine last child', () => {
    assert.match(declared, /main > \.section:last-child\s*\{[^}]*margin-block-end:\s*0/);
  });
});
