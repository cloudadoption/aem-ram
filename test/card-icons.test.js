import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ICON_MAX_WIDTH, declaredIsPhoto, isIconImage, isPhotoImage, markIconCards,
} from '../blocks/cards/card-icons.js';

// Live's card images come in two shapes. A photo fills the card and is 200px
// tall: 377x200 on preparing-your-trip. An icon sits at its natural size: 105 and
// 106px on how-it-works, and 27x36 on checked-baggage. The transform marks
// neither, so the block decides from the image's own size. Giving every card
// image `height: 200px` blew a 105x105 icon up to 397x200.
describe('isIconImage', () => {
  it('calls a 105px source an icon, which is what how-it-works carries', () => {
    assert.equal(isIconImage(105), true);
  });

  it('calls a 27px source an icon, which is what checked-baggage carries', () => {
    assert.equal(isIconImage(27), true);
  });

  it('calls a 1647px photograph a photograph', () => {
    assert.equal(isIconImage(1647), false);
  });

  it('takes the threshold as the boundary itself', () => {
    assert.equal(isIconImage(ICON_MAX_WIDTH), true);
    assert.equal(isIconImage(ICON_MAX_WIDTH + 1), false);
  });

  it('says no for an image that has not loaded, so nothing is marked on a guess', () => {
    assert.equal(isIconImage(0), false);
    assert.equal(isIconImage(undefined), false);
  });
});

const listItem = () => {
  const classes = new Set();
  return { classList: { add: (c) => classes.add(c), contains: (c) => classes.has(c) }, classes };
};

const image = (naturalWidth, complete = true) => {
  const li = listItem();
  const handlers = [];
  return {
    naturalWidth,
    complete,
    li,
    closest: (selector) => (selector === 'li' ? li : null),
    addEventListener: (name, fn) => handlers.push([name, fn]),
    fire: (name) => handlers.filter(([n]) => n === name).forEach(([, fn]) => fn()),
  };
};

const listOf = (images) => ({ querySelectorAll: () => images });

describe('markIconCards', () => {
  it('marks the card of a photograph', () => {
    const img = image(1647);
    markIconCards(listOf([img]));
    assert.ok(img.li.classList.contains('cards-card-photo'));
  });

  it('leaves the card of an icon unmarked, because that is the default', () => {
    const img = image(105);
    markIconCards(listOf([img]));
    assert.ok(!img.li.classList.contains('cards-card-photo'));
  });

  it('waits for an image that has not loaded yet', () => {
    const img = image(1647, false);
    markIconCards(listOf([img]));
    assert.ok(!img.li.classList.contains('cards-card-photo'));
    img.fire('load');
    assert.ok(img.li.classList.contains('cards-card-photo'));
  });

  it('marks each card independently', () => {
    const icon = image(106);
    const photo = image(1200);
    markIconCards(listOf([icon, photo]));
    assert.ok(!icon.li.classList.contains('cards-card-photo'));
    assert.ok(photo.li.classList.contains('cards-card-photo'));
  });

  it('is unbothered by an image outside a list item', () => {
    const img = image(1647);
    img.closest = () => null;
    assert.doesNotThrow(() => markIconCards(listOf([img])));
  });
});

// Reserving the photo's 200px band for every card left an icon floating in it:
// live's icon cards are compact, about 110px tall around a 27x36 image. The
// default is the icon now and the photo is what gets marked, which is both
// closer to live and a smaller shift: a photo goes 236px to 200px where an icon
// was going 200px to 105px.
describe('isPhotoImage', () => {
  it('calls a 1647px source a photograph', () => {
    assert.equal(isPhotoImage(1647), true);
  });

  it('leaves a 105px icon alone', () => {
    assert.equal(isPhotoImage(105), false);
  });

  it('takes the same boundary as the icon test, from the other side', () => {
    assert.equal(isPhotoImage(ICON_MAX_WIDTH), false);
    assert.equal(isPhotoImage(ICON_MAX_WIDTH + 1), true);
  });

  it('says no for an image that has not loaded', () => {
    assert.equal(isPhotoImage(0), false);
    assert.equal(isPhotoImage(undefined), false);
  });

  it('is the opposite of isIconImage for anything loaded', () => {
    [27, 105, 200, 201, 1647].forEach((w) => {
      assert.notEqual(isIconImage(w), isPhotoImage(w));
    });
  });
});

// The photo class was added on the image's load event, from naturalWidth, so the card's height
// changed from auto to 200px after first paint. That is the estate's only remaining layout shift:
// Lighthouse 12.8.2 mobile on /en-gb/checked-baggage reads CLS 0.218 and a score of 89, where the
// go-live checklist wants 100, and cls-culprits-insight points at
// li > div.cards-card-image > picture > img.
//
// The served markup already declares the size, and it separates the two shapes on the same 200px
// line: 60 to 78 wide on checked-baggage, 100 to 106 on how-it-works, against 260 and 395 on
// preparing-your-trip. So the card can be classed before the image loads and nothing moves.
describe('declaredIsPhoto', () => {
  const img = (attrs) => ({ getAttribute: (k) => (k in attrs ? attrs[k] : null) });

  it('calls a 395px declared width a photo, which preparing-your-trip carries', () => {
    assert.equal(declaredIsPhoto(img({ width: '395' })), true);
  });

  it('calls a 61px declared width an icon, which checked-baggage carries', () => {
    assert.equal(declaredIsPhoto(img({ width: '61' })), false);
  });

  it('calls a 106px declared width an icon, which how-it-works carries', () => {
    assert.equal(declaredIsPhoto(img({ width: '106' })), false);
  });

  it('draws the line in the same place as the natural-width test', () => {
    assert.equal(declaredIsPhoto(img({ width: String(ICON_MAX_WIDTH) })), false);
    assert.equal(declaredIsPhoto(img({ width: String(ICON_MAX_WIDTH + 1) })), true);
  });

  // Unknown, not "icon": an image with no declared size has to keep the load-event path or a photo
  // card would lose its band entirely.
  it('answers null when no width is declared', () => {
    assert.equal(declaredIsPhoto(img({})), null);
  });

  it('answers null for a width that is not a positive number', () => {
    assert.equal(declaredIsPhoto(img({ width: 'auto' })), null);
    assert.equal(declaredIsPhoto(img({ width: '0' })), null);
    assert.equal(declaredIsPhoto(img({ width: '-5' })), null);
  });

  it('answers null rather than throwing when there is no image', () => {
    assert.equal(declaredIsPhoto(null), null);
  });
});
