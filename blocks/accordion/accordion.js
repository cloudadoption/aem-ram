/**
 * Reads the authored rows into question/answer pairs.
 *
 * The first cell is the summary label, the remaining cells the body. 73 migrated
 * documents carry 805 collapsed items on live, and an author may save a question
 * before its answer, so a one-cell row keeps an empty body rather than dropping.
 *
 * @param {Element[]} rows the block's row elements, each holding cell elements
 * @returns {{summary: Element, body: Element[]}[]} the cell elements themselves
 */
export function buildItems(rows) {
  return [...rows]
    .map((row) => [...(row.children || [])])
    .filter((cells) => cells.length > 0)
    .map(([summary, ...body]) => ({ summary, body }));
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const items = buildItems([...block.children]);
  block.textContent = '';
  items.forEach(({ summary, body }) => {
    const details = document.createElement('details');
    details.className = 'accordion-item';
    const label = document.createElement('summary');
    label.className = 'accordion-item-label';
    label.append(...summary.childNodes);
    const panel = document.createElement('div');
    panel.className = 'accordion-item-body';
    body.forEach((cell) => panel.append(...cell.childNodes));
    // Closed by default, like live: the parity gate measures visible text, so
    // the collapse is load-bearing, not cosmetic.
    details.append(label, panel);
    block.append(details);
  });
}
