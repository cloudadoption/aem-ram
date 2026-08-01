import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildItems } from '../blocks/accordion/accordion.js';

// A row is a div of cell divs, first cell the question, the rest the answer. The
// cells come back as themselves so decorate can move their nodes, and a label
// stands in for a cell here, same as the table tests.
const rows = (grid) => grid.map((cells) => ({
  children: cells.map((label) => ({ label })),
}));
const labels = (cells) => cells.map((cell) => cell.label);

describe('buildItems', () => {
  it('pairs each row into a summary cell and its body cells', () => {
    const items = buildItems(rows([
      ['How do I report my baggage?', 'You must immediately report it.'],
      ['What is the fee?', 'It depends on the route.'],
    ]));
    assert.equal(items.length, 2);
    assert.equal(items[0].summary.label, 'How do I report my baggage?');
    assert.deepEqual(labels(items[0].body), ['You must immediately report it.']);
    assert.equal(items[1].summary.label, 'What is the fee?');
  });

  it('keeps extra cells in the body', () => {
    const items = buildItems(rows([['Question', 'Part one', 'Part two']]));
    assert.deepEqual(labels(items[0].body), ['Part one', 'Part two']);
  });

  // Authors may save a question before writing its answer; the row still renders.
  it('renders a summary-only row with an empty body', () => {
    const items = buildItems(rows([['Question']]));
    assert.equal(items[0].summary.label, 'Question');
    assert.deepEqual(items[0].body, []);
  });

  it('skips rows with no cells', () => {
    const items = buildItems(rows([[], ['Question', 'Answer']]));
    assert.equal(items.length, 1);
    assert.equal(items[0].summary.label, 'Question');
  });

  it('returns nothing for an empty block', () => {
    assert.deepEqual(buildItems([]), []);
  });
});
