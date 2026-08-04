import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
const declared = styles.replace(/\/\*[\s\S]*?\*\//g, '');

// The browser's own rule for `b` and `strong` is `font-weight: bolder`, which is relative: from a 300
// body it computes to 400, one step up rather than bold. Live declares it flat, `body strong
// {font-weight:700}` in the 2025 theme, so its bold is 300 to 700 where ours was 300 to 400.
//
// This is on every page with emphasis, and a58718e took the estate to 4,423 bold and italic runs, so
// nothing about it is local. Ported from da-ram #58.
describe('bold text', () => {
  it('is 700, as live declares, not the browser\'s relative bolder', () => {
    const rule = /^b,\nstrong \{[^}]*\}/m.exec(declared);
    assert.ok(rule, 'expected a shared b and strong rule');
    assert.match(rule[0], /font-weight:\s*700/);
    assert.doesNotMatch(rule[0], /bolder/);
  });

  // The body is 300, which is what makes the browser default land on 400 rather than 700.
  it('sits against a 300 body, which is why the default was wrong', () => {
    assert.match(declared, /font-weight:\s*300/);
  });
});
