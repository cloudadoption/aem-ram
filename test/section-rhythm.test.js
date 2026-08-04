import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');

// Live's section boundaries add nothing of their own: the space between two sections is the
// content region's own `.f-pt-24` and `.f-pb-24`, so 24px. Ours read a flat 40 at every boundary
// and 0 above the first block, which made the estate looser than live and started it too high.
// Ported from da-ram #64, which measured gaps of 24 to 26 and 24 above the first section against
// live's.
describe('the section rhythm', () => {
  it('opens the page with main\'s own 24, where live has 24 above the first section', () => {
    const main = /^main\s*\{[^}]*\}/m.exec(styles);
    assert.ok(main, 'styles.css declares a main rule');
    assert.match(main[0], /padding-block:\s*24px/);
  });

  it('spaces a boundary at live\'s 24, not the boilerplate 40', () => {
    const section = /^main > \.section\s*\{[^}]*\}/m.exec(styles);
    assert.ok(section, 'styles.css declares a main > .section rule');
    assert.match(section[0], /margin:\s*24px 0/);
    assert.doesNotMatch(section[0], /margin:\s*40px 0/);
  });

  // The top is main's padding, so the first section's own margin has to come off or it adds to it.
  it('takes the first section\'s top margin off', () => {
    assert.match(styles, /^main > \.section:first-of-type\s*\{[^}]*margin-top:\s*0/m);
  });

  // KNOWN AND NOT MATCHED: under the last section a reader sees, this reads 48 against live's 24.
  // Every page carries a trailing section with no height, the one the metadata block leaves
  // behind, so :last-child matches that empty one and the last visible section keeps its 24 on
  // top of main's 24 of padding. Zeroing the bottom margin on all of them moves the problem,
  // because the empty section still contributes its own top margin.
  it('takes the last section\'s bottom margin off, which the empty one still defeats', () => {
    assert.match(styles, /^main > \.section:last-child\s*\{[^}]*margin-block-end:\s*0/m);
  });
});
