/*
 * The callout is styled entirely in CSS. This module exists because loadBlock imports
 * {block}.js unconditionally and console.errors when the import fails, and a callout is on
 * 150 of the generated documents.
 */
// eslint-disable-next-line no-unused-vars
export default function decorate(block) {}
