import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const scripts = readFileSync(new URL('../scripts/scripts.js', import.meta.url), 'utf8');
const eager = /async function loadEager\(doc\) \{[\s\S]*?\n\}/.exec(scripts)[0];

// The body is hidden until `appear`. Revealing it before the first section has loaded shows that
// section undecorated, and the block then restructures the DOM under the reader. Measured with a
// PerformanceObserver on /en-gb/checked-baggage, whose cards sit in section 0 inside the first
// viewport: card heights went 68 to 131 and the block moved 59px, for CLS 0.218 and a Lighthouse
// mobile score of 89. Pages whose cards sit below the fold score 100 with the same blocks.
describe('the eager phase', () => {
  it('loads the first section before revealing the body', () => {
    const reveal = eager.indexOf("classList.add('appear')");
    const load = eager.indexOf('loadSection(');
    assert.ok(reveal > -1, 'expected the appear class to be added in loadEager');
    assert.ok(load > -1, 'expected the first section to be loaded in loadEager');
    assert.ok(load < reveal, 'the first section must load before the body is revealed');
  });

  it('still awaits that section rather than firing and forgetting', () => {
    assert.match(eager, /await loadSection\(/);
  });

  it('still waits for the first image, which is what holds LCP steady', () => {
    assert.match(eager, /loadSection\([^)]*waitForFirstImage/);
  });
});
