import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

import { imageRuns, wrapImageRuns } from '../scripts/image-rows.js';

// `i` is an image-only paragraph, `t` is anything else.
const isImageOnly = (item) => item === 'i';

describe('imageRuns', () => {
  it('finds a run of two', () => {
    assert.deepEqual(imageRuns(['t', 'i', 'i', 't'], isImageOnly), [[1, 2]]);
  });

  it('ignores a lone image, which is a picture in its own right', () => {
    assert.deepEqual(imageRuns(['t', 'i', 't', 'i'], isImageOnly), []);
  });

  it('finds two separate runs', () => {
    assert.deepEqual(imageRuns(['i', 'i', 't', 'i', 'i', 'i'], isImageOnly), [[0, 1], [3, 4, 5]]);
  });

  it('finds a run that ends the list', () => {
    assert.deepEqual(imageRuns(['t', 'i', 'i', 'i'], isImageOnly), [[1, 2, 3]]);
  });

  it('finds a run that starts the list', () => {
    assert.deepEqual(imageRuns(['i', 'i', 't'], isImageOnly), [[0, 1]]);
  });

  it('returns nothing for a list with no images', () => {
    assert.deepEqual(imageRuns(['t', 't'], isImageOnly), []);
  });

  it('returns nothing for an empty list', () => {
    assert.deepEqual(imageRuns([], isImageOnly), []);
  });

  it('treats the whole list as one run when every item is an image', () => {
    assert.deepEqual(imageRuns(['i', 'i', 'i'], isImageOnly), [[0, 1, 2]]);
  });
});

// A stub standing in for the pieces of the DOM the wrapper touches. Appending a
// node moves it, as the real DOM does: without that the paragraphs would sit in
// both the wrapper and the row and the tests would pass on a fiction.
const detach = (node) => {
  if (!node.parent) return;
  const at = node.parent.children.indexOf(node);
  if (at >= 0) node.parent.children.splice(at, 1);
};

const element = (tag) => {
  const node = {
    tag,
    children: [],
    className: '',
    parent: null,
    append(...kids) {
      kids.forEach((kid) => {
        detach(kid);
        node.children.push(kid);
        kid.parent = node;
      });
    },
    insertBefore(fresh, before) {
      detach(fresh);
      const at = node.children.indexOf(before);
      node.children.splice(at < 0 ? node.children.length : at, 0, fresh);
      fresh.parent = node;
    },
  };
  return node;
};

const wrapperWith = (kinds) => {
  const wrapper = element('div');
  kinds.forEach((kind) => {
    const child = element('p');
    child.kind = kind;
    wrapper.append(child);
  });
  return wrapper;
};

const documentStub = { createElement: (tag) => element(tag) };

describe('wrapImageRuns', () => {
  const imageKind = (node) => node.kind === 'i';

  it('wraps a run in one container', () => {
    const wrapper = wrapperWith(['t', 'i', 'i', 't']);
    wrapImageRuns(wrapper, documentStub, imageKind);
    assert.equal(wrapper.children.length, 3);
    assert.match(wrapper.children[1].className, /\bimage-row\b/);
    assert.equal(wrapper.children[1].children.length, 2);
  });

  it('keeps the container where the run was', () => {
    const wrapper = wrapperWith(['t', 'i', 'i', 't']);
    wrapImageRuns(wrapper, documentStub, imageKind);
    assert.equal(wrapper.children[0].kind, 't');
    assert.equal(wrapper.children[2].kind, 't');
  });

  it('leaves a lone image where it is', () => {
    const wrapper = wrapperWith(['t', 'i', 't']);
    wrapImageRuns(wrapper, documentStub, imageKind);
    assert.equal(wrapper.children.length, 3);
    assert.equal(wrapper.children[1].kind, 'i');
  });

  it('wraps two runs separately', () => {
    const wrapper = wrapperWith(['i', 'i', 't', 'i', 'i']);
    wrapImageRuns(wrapper, documentStub, imageKind);
    const rows = wrapper.children.filter((c) => /\bimage-row\b/.test(c.className));
    assert.equal(rows.length, 2);
  });

  it('records how many are in the row, so CSS can lay a pair out differently', () => {
    const wrapper = wrapperWith(['i', 'i', 'i']);
    wrapImageRuns(wrapper, documentStub, imageKind);
    assert.equal(wrapper.children[0].className, 'image-row image-row-3');
  });

  it('does nothing to a wrapper with no run', () => {
    const wrapper = wrapperWith(['t', 't']);
    wrapImageRuns(wrapper, documentStub, imageKind);
    assert.deepEqual(wrapper.children.map((c) => c.kind), ['t', 't']);
  });
});

// The row upscaled a small image to the column width. `.image-row img { width: 100% }` put the
// App Store badge on /en-gb/ at 397x132 where it declares 120x40, and live draws exactly
// 120x40. It did the same to the four images beside it: 316x424 became 397x533, 100x100
// became 397x397, 286x54 became 397x75. The section ran 1,052px for two lines of copy and
// five badges.
//
// The grid column and `main img { max-width: 100% }` already cap a large image, which is
// what the row was built for: four images on /en-gb/how-it-works rendered 1240x738 each
// against live's 394px. `width: 100%` added nothing there and upscaled everything smaller
// than a column.
//
// Roughly 7 per cent of the estate carries a run like this, so it is not one page.
describe('an image in a row is not upscaled', () => {
  const css = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8');
  const rule = () => {
    const m = /\.image-row img\s*\{[^}]*\}/.exec(css);
    assert.ok(m, 'no .image-row img rule');
    return m[0];
  };

  // `[^-]width`, not `width`: `max-width: 100%` holds the substring `width: 100%`, and a
  // plain test on it failed against the rule that fixes this.
  it('does not force the image to the column width', () => {
    assert.doesNotMatch(rule(), /[^-]width:\s*100%/);
  });

  it('still caps a large image, which is what the row is for', () => {
    assert.match(rule(), /max-width:\s*100%/);
  });

  it('keeps the aspect ratio', () => {
    assert.match(rule(), /height:\s*auto/);
  });
});
