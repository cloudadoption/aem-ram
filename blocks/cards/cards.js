import { createOptimizedPicture } from '../../scripts/aem.js';
import { markIconCards } from './card-icons.js';
import { groupCopy } from './card-copy.js';
import copyIntrinsicSize, { reserveIconBox } from './card-size.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    const built = picture.querySelector('img');
    copyIntrinsicSize(img, built);
    reserveIconBox(built);
    img.closest('picture').replaceWith(picture);
  });
  markIconCards(ul);
  groupCopy(ul);
  block.replaceChildren(ul);
}
