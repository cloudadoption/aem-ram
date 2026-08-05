import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { copyCells, groupCopy } from '../blocks/cards/card-copy.js';

/*
 * A single card lays out as a row, the photo on one side and the copy on the other, and the block
 * gave every cell its own grid cell. 294 of the 491 single-card blocks carry three or four cells
 * rather than two, so the third wrapped into a second grid row and the copy landed UNDER the photo
 * with 608px empty beside it. On /en-gb/royal-air-maroc-lounges the heading sat at y396 next to the
 * photo and its paragraph at y652 below it. Live stacks both beside the photo: photo y292-632,
 * heading y342-422, copy y446-558.
 *
 * The cells cannot share one grid cell, and `grid-row: 1 / -1` on the photo resolves against the
 * EXPLICIT grid, which is empty here, so it spans one row and changes nothing (measured). One box
 * around the copy cells makes the second column a column.
 *
 * The shapes, counted over the 1,740 generated documents: 203 blocks image + 2 copy cells, 175
 * image + 1, 78 image + 3, 19 two copy cells and no image, 13 three, 3 a single cell.
 */

const element = (tag, className = '') => {
  const self = {
    tagName: tag.toUpperCase(),
    className,
    children: [],
    parent: null,
    classList: {
      contains: (c) => String(self.className).split(/\s+/).includes(c),
      add: (c) => { self.className = `${self.className} ${c}`.trim(); },
    },
    // The DOM moves a node rather than copying it, so the double unlinks it from its old parent.
    append: (...kids) => {
      kids.forEach((kid) => {
        if (kid.parent) kid.parent.children.splice(kid.parent.children.indexOf(kid), 1);
        kid.parent = self;
        self.children.push(kid);
      });
    },
    before: (node) => {
      const { parent } = self;
      parent.children.splice(parent.children.indexOf(self), 0, node);
      node.parent = parent;
    },
    ownerDocument: { createElement: (t) => element(t) },
  };
  return self;
};

const cardWith = (...classes) => {
  const li = element('li');
  li.append(...classes.map((c) => element('div', c)));
  return li;
};

const listOf = (...cards) => {
  const ul = element('ul');
  ul.append(...cards);
  return ul;
};

const names = (el) => el.children.map((c) => c.className);

describe('copyCells', () => {
  it('finds the copy cells of a card and leaves the photo out', () => {
    const li = cardWith('cards-card-image', 'cards-card-body', 'cards-card-body');
    assert.deepEqual(copyCells(li).length, 2);
    assert.ok(copyCells(li).every((c) => c.classList.contains('cards-card-body')));
  });

  it('finds three, which 78 of the blocks carry', () => {
    const li = cardWith('cards-card-image', 'cards-card-body', 'cards-card-body', 'cards-card-body');
    assert.equal(copyCells(li).length, 3);
  });

  it('finds none in a card that is a photo alone', () => {
    assert.deepEqual(copyCells(cardWith('cards-card-image')), []);
  });
});

describe('groupCopy', () => {
  it('puts the copy cells of a single card in one box', () => {
    const li = cardWith('cards-card-image', 'cards-card-body', 'cards-card-body');
    groupCopy(listOf(li));
    assert.deepEqual(names(li), ['cards-card-image', 'cards-card-copy']);
    assert.deepEqual(names(li.children[1]), ['cards-card-body', 'cards-card-body']);
  });

  it('keeps the copy in its authored order, because the first cell is the title', () => {
    const li = cardWith('cards-card-image', 'cards-card-body', 'cards-card-body', 'cards-card-body');
    const [, first, second, third] = li.children;
    groupCopy(listOf(li));
    assert.deepEqual(li.children[1].children, [first, second, third]);
  });

  it('puts the box where the first copy cell was, so the photo keeps its side', () => {
    const li = cardWith('cards-card-body', 'cards-card-image', 'cards-card-body');
    groupCopy(listOf(li));
    assert.deepEqual(names(li), ['cards-card-copy', 'cards-card-image']);
  });

  it('leaves a card with one copy cell alone, since 175 blocks are already two cells', () => {
    const li = cardWith('cards-card-image', 'cards-card-body');
    groupCopy(listOf(li));
    assert.deepEqual(names(li), ['cards-card-image', 'cards-card-body']);
  });

  it('leaves a card with no copy alone', () => {
    const li = cardWith('cards-card-image');
    groupCopy(listOf(li));
    assert.deepEqual(names(li), ['cards-card-image']);
  });

  // A multi-card block is a grid of cards and each card is normal flow, so its cells already stack.
  it('leaves a block of three cards alone', () => {
    const cards = [
      cardWith('cards-card-image', 'cards-card-body', 'cards-card-body'),
      cardWith('cards-card-image', 'cards-card-body', 'cards-card-body'),
      cardWith('cards-card-image', 'cards-card-body', 'cards-card-body'),
    ];
    groupCopy(listOf(...cards));
    cards.forEach((li) => {
      assert.deepEqual(names(li), ['cards-card-image', 'cards-card-body', 'cards-card-body']);
    });
  });

  it('groups the copy of a card with no photo at all, which 32 blocks are', () => {
    const li = cardWith('cards-card-body', 'cards-card-body', 'cards-card-body');
    groupCopy(listOf(li));
    assert.deepEqual(names(li), ['cards-card-copy']);
    assert.equal(li.children[0].children.length, 3);
  });
});
