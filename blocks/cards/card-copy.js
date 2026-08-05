/*
 * A single card lays out as a row, the photo on one side and the copy on the other, and every cell
 * had its own grid cell. 294 of the 491 single-card blocks carry three or four cells, so the third
 * wrapped into a second grid row and the copy landed under the photo: on
 * /en-gb/royal-air-maroc-lounges the heading sat beside the photo at y396 and its paragraph at y652
 * below it, where live stacks both beside the photo. One box around the copy cells makes the second
 * column a column. `grid-row: 1 / -1` on the photo does not, because it resolves against the
 * explicit grid, which is empty here.
 */

export const copyCells = (li) => [...li.children]
  .filter((cell) => cell.classList.contains('cards-card-body'));

export const groupCopy = (list) => {
  const cards = [...list.children];
  if (cards.length !== 1) return null;
  const cells = copyCells(cards[0]);
  if (cells.length < 2) return null;
  const box = cards[0].ownerDocument.createElement('div');
  box.className = 'cards-card-copy';
  cells[0].before(box);
  box.append(...cells);
  return box;
};
