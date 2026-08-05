import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fragmentPath } from '../scripts/locale.js';

// A 404 response carries no page metadata, so header.js and footer.js read nothing and the
// boilerplate falls back to a root /nav and /footer this site does not publish: verified in a
// browser on 2026-08-05, both /nav.plain.html and /footer.plain.html answer 404 and the console
// says "failed to load module for header" and "for footer". The requested path still names the
// locale, so it answers the question the metadata cannot.
describe('fragmentPath', () => {
  it('takes the locale from the requested path', () => {
    assert.equal(fragmentPath('nav', '/fr-fr/definitely-not-a-page'), '/fr-fr/nav');
    assert.equal(fragmentPath('footer', '/ar-sa/definitely-not-a-page'), '/ar-sa/footer');
  });

  it('reaches the locale through a deep path', () => {
    assert.equal(fragmentPath('nav', '/de-de/information/fare-conditions/gone'), '/de-de/nav');
  });

  it('falls back to en-gb where the path names no locale', () => {
    assert.equal(fragmentPath('nav', '/nonsense'), '/en-gb/nav');
    assert.equal(fragmentPath('footer', '/'), '/en-gb/footer');
    assert.equal(fragmentPath('nav', ''), '/en-gb/nav');
  });

  it('does not treat an unknown prefix as a locale', () => {
    assert.equal(fragmentPath('nav', '/en/loyalty'), '/en-gb/nav');
    assert.equal(fragmentPath('nav', '/fr/bagages'), '/en-gb/nav');
  });

  it('matches a locale whatever its case', () => {
    assert.equal(fragmentPath('nav', '/FR-FR/gone'), '/fr-fr/nav');
  });

  it('names a fragment every locale publishes', () => {
    for (const locale of ['ar-sa', 'de-de', 'en-gb', 'es-es', 'fr-fr', 'it-it', 'nl-nl', 'pt-pt', 'ru-ru', 'tr-tr']) {
      assert.equal(fragmentPath('nav', `/${locale}/gone`), `/${locale}/nav`);
      assert.equal(fragmentPath('footer', `/${locale}/gone`), `/${locale}/footer`);
    }
  });
});
