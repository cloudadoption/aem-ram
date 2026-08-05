/**
 * One map per locale, answering language and reading direction.
 *
 * Direction is stated rather than derived. Intl.Locale('ar-EN').textInfo.direction
 * returns rtl for a locale meant to read left to right, and textInfo is missing
 * in some browsers, so a lookup is the only reliable answer.
 */
export const LOCALES = {
  'ar-sa': { lang: 'ar', dir: 'rtl' },
  'de-de': { lang: 'de', dir: 'ltr' },
  'en-gb': { lang: 'en', dir: 'ltr' },
  'es-es': { lang: 'es', dir: 'ltr' },
  'fr-fr': { lang: 'fr', dir: 'ltr' },
  'it-it': { lang: 'it', dir: 'ltr' },
  'nl-nl': { lang: 'nl', dir: 'ltr' },
  'pt-pt': { lang: 'pt', dir: 'ltr' },
  'ru-ru': { lang: 'ru', dir: 'ltr' },
  'tr-tr': { lang: 'tr', dir: 'ltr' },
};

const FALLBACK = { lang: 'en', dir: 'ltr' };

const DIR_BY_LANG = Object.fromEntries(
  Object.values(LOCALES).map(({ lang, dir }) => [lang, dir]),
);

/**
 * Reads the locale off the first segment of a path.
 * @param {string} pathname a path such as /en-gb/about-us
 * @returns {{lang: string, dir: string}|null} the locale, or null if the path has none
 */
export function localeForPath(pathname) {
  const [prefix] = String(pathname || '').replace(/^\//, '').split('/');
  return LOCALES[prefix.toLowerCase()] || null;
}

/**
 * Sets language and direction on an element, usually the document root.
 *
 * The served markup wins on language, because html-lang page metadata reaches the
 * browser before any script runs. Direction has no metadata key, so it is set here
 * from whichever language the document ends up declaring.
 *
 * @param {Element} element the element to label
 * @param {string} pathname the path the page was requested at
 */
export function applyLocale(element, pathname) {
  const served = String(element.lang || '').trim();
  const locale = localeForPath(pathname) || FALLBACK;
  const lang = served || locale.lang;
  const base = lang.split('-')[0].toLowerCase();

  element.lang = lang;
  element.dir = DIR_BY_LANG[base] || FALLBACK.dir;
}

const DEFAULT_LOCALE = 'en-gb';

/**
 * The locale a path was requested under, or en-gb where it names none.
 * @param {string} pathname the path the page was requested at
 * @returns {string} a locale prefix such as fr-fr
 */
function localeOf(pathname) {
  const [prefix] = String(pathname || '').replace(/^\//, '').split('/');
  return LOCALES[prefix.toLowerCase()] ? prefix.toLowerCase() : DEFAULT_LOCALE;
}

/**
 * The path of a chrome fragment for the locale a page was requested at.
 *
 * A 404 response carries no page metadata, so header.js and footer.js have nothing to read and the
 * boilerplate falls back to a root /nav and /footer this site does not publish. The requested path
 * still names the locale, so it answers instead.
 *
 * @param {string} name the fragment, 'nav' or 'footer'
 * @param {string} pathname the path the page was requested at
 * @returns {string} the fragment path
 */
export function fragmentPath(name, pathname) {
  return `/${localeOf(pathname)}/${name}`;
}

/**
 * The home page of the locale a path was requested under.
 *
 * This site serves no root: `/` and `/index` both answer 404, the boilerplate demo index staying
 * unpublished. So 404.html's static "Go home" led a lost visitor to a second 404, and the local dev
 * server hides that by serving the demo index.
 *
 * @param {string} pathname the path the page was requested at
 * @returns {string} the locale home, such as /fr-fr/
 */
export function localeHome(pathname) {
  return `/${localeOf(pathname)}/`;
}
