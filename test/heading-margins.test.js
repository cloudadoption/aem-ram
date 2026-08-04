import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');

// Live declares its headings flat, verbatim from /o/ram-airways-theme/2025/css/styles.css:
//
//   body h1,body h2,body h3,body h4,body h5,body h6{margin:0;padding:0}
//
// and its authors add the gap under one back where they want it, `.small-heading{margin-block-end:
// .5rem}`. Across five 2025-theme pages and 39 headings ram2 measured 0 above every one.
//
// This declared `margin-top: 0.8em`, computing to 32px at a 40px heading, 25.6 at 32, 22.4 at 28,
// 19.2 at 24 and 16 at 20. It also collapses out of a section that has no padding of its own, which
// is why the space above the first section measured 50 where live has 24.
//
// The 20px below stays, and that is a decision-0024 choice rather than a match: live's air under a
// prose heading comes from a `<br>` and from portlet wrappers carrying 20px, neither of which the
// transform keeps, and live's own prose blocks read 0/0, 0/4 and 0/20 with no value dominating.
describe('the heading margins', () => {
  const declared = styles.replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = /\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 \{[\s\S]*?\n\}/.exec(declared);

  it('declares the shared heading rule', () => {
    assert.ok(rule, 'expected one rule covering h1 through h6');
  });

  it('leaves no space above a heading, as live declares', () => {
    assert.doesNotMatch(rule[0], /margin-top:/);
    assert.doesNotMatch(rule[0], /0\.8em/);
  });

  it('keeps the 20px under one, which is the authored tail and not live\'s declaration', () => {
    assert.match(rule[0], /margin:\s*0 0 20px/);
  });
});
