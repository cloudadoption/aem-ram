import { getMetadata } from '../../scripts/aem.js';
import { fragmentPath } from '../../scripts/locale.js';
import { loadFragment } from '../fragment/fragment.js';
import { markFooterGroups } from './footer-groups.js';
import { markLegalRow } from './footer-legal.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta
    ? new URL(footerMeta, window.location).pathname
    : fragmentPath('footer', window.location.pathname);
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  markFooterGroups(footer);
  markLegalRow(footer);
  block.append(footer);
}
