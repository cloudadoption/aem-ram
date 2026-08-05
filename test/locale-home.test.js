import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

import { localeHome } from '../scripts/locale.js';

// 404.html ships a static "Go home" pointing at `/`, and this site does not serve a root: `/` and
// `/index` both answer 404 on production, checked 2026-08-05, because the boilerplate demo index
// stays unpublished. So the one button a lost visitor is offered led to a second 404. The local dev
// server hides it by serving the demo index, which is why a localhost pass never caught it.
describe('localeHome', () => {
  it('takes the locale from the requested path', () => {
    assert.equal(localeHome('/fr-fr/definitely-not-a-page'), '/fr-fr/');
    assert.equal(localeHome('/ar-sa/information/gone'), '/ar-sa/');
  });

  it('falls back to en-gb where the path names no locale', () => {
    assert.equal(localeHome('/nonsense'), '/en-gb/');
    assert.equal(localeHome('/'), '/en-gb/');
  });

  it('never answers the bare root, which this site does not serve', () => {
    ['/', '', '/en/loyalty', '/fr-fr/gone', '/zz-zz/gone'].forEach((p) => {
      assert.notEqual(localeHome(p), '/');
      assert.match(localeHome(p), /^\/[a-z]{2}-[a-z]{2}\/$/);
    });
  });
});

describe('the 404 page offers a home that exists', () => {
  const html = readFileSync(new URL('../404.html', import.meta.url), 'utf8');

  it('does not hard-code the unserved root as the home link', () => {
    assert.ok(!html.includes('href="/" class="button'), '404.html still points Go home at the root');
  });

  it('retargets the home link from the requested path', () => {
    assert.match(html, /localeHome\(/, '404.html should ask localeHome where home is');
  });
});
