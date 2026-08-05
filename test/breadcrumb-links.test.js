import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { crumbLabels, crumbPaths, breadcrumbHtml } from '../scripts/breadcrumb.js';

/*
 * The crumbs can carry links now. Decision 12 was ruled on 2026-08-05 and 327 rows went into the
 * redirects sheet, so live's crumb paths resolve: swept across the 1,418 pages with a trail, 3,519 of
 * 3,520 linkable slots answer.
 *
 * The paths arrive in a second metadata field, `breadcrumb-hrefs`, holding one slot per label in the same
 * order and separated the same way. A slot is empty where the crumb has no link: live leaves the LAST
 * crumb unlinked, because it is the page you are on, and one path in the estate answers nothing.
 */

describe('crumbPaths', () => {
  it('splits the same separator the labels use', () => {
    assert.deepEqual(crumbPaths('/en/loyalty | /en/miles | '), ['/en/loyalty', '/en/miles', '']);
  });

  // The slots have to line up with the labels, so an empty one is kept where crumbLabels drops it.
  it('keeps an empty slot', () => {
    assert.deepEqual(crumbPaths('/a |  | /c'), ['/a', '', '/c']);
  });

  it('reads nothing from nothing', () => {
    assert.deepEqual(crumbPaths(''), []);
    assert.deepEqual(crumbPaths(undefined), []);
  });

  // Only a path on this estate. An absolute URL in the field would take a reader off the site.
  it('drops anything that is not an absolute path', () => {
    assert.deepEqual(crumbPaths('https://evil.example/x | /ok | javascript:void(0)'), ['', '/ok', '']);
  });
});

describe('breadcrumbHtml with paths', () => {
  const labels = ['Safar Flyer Loyalty', 'Earn and spend miles', 'AMERICAN AIRLINES'];
  const paths = ['/en/loyalty', '/en/earn-and-spend-miles', ''];

  it('links a crumb that has a path', () => {
    const html = breadcrumbHtml(labels, paths);
    assert.match(html, /<li><a href="\/en\/loyalty">Safar Flyer Loyalty<\/a><\/li>/);
  });

  it('leaves the last crumb as text and keeps it marked as the current page', () => {
    const html = breadcrumbHtml(labels, paths);
    assert.match(html, /<li aria-current="page">AMERICAN AIRLINES<\/li>/);
    assert.doesNotMatch(html, /<a[^>]*>AMERICAN AIRLINES/);
  });

  it('never links the last crumb even when the field carries a path for it', () => {
    const html = breadcrumbHtml(labels, ['/a', '/b', '/c']);
    assert.doesNotMatch(html, /<a[^>]*>AMERICAN AIRLINES/);
  });

  it('renders a label as text where its slot is empty', () => {
    const html = breadcrumbHtml(labels, ['', '/en/x', '']);
    assert.match(html, /<li>Safar Flyer Loyalty<\/li>/);
  });

  it('renders labels only when no paths are given, which is what shipped before', () => {
    assert.equal(breadcrumbHtml(labels), breadcrumbHtml(labels, []));
    assert.doesNotMatch(breadcrumbHtml(labels), /<a /);
  });

  it('escapes a path the way it escapes a label', () => {
    const html = breadcrumbHtml(['A', 'B'], ['/a"onmouseover=x', '']);
    assert.doesNotMatch(html, /"onmouseover/);
  });

  it('ignores a paths list shorter than the labels', () => {
    const html = breadcrumbHtml(labels, ['/en/loyalty']);
    assert.match(html, /<a href="\/en\/loyalty">Safar Flyer Loyalty<\/a>/);
    assert.match(html, /<li>Earn and spend miles<\/li>/);
  });
});

// Live's link is the same colour as the trail's own text, rgb(89, 88, 85), so the anchor cannot take the
// site's link colour.
describe('breadcrumb link styling', () => {
  const css = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');

  it('gives the crumb anchor the trail colour rather than the site link colour', () => {
    assert.match(css, /\.breadcrumb a\s*\{[^}]*color:\s*inherit/);
  });
});
