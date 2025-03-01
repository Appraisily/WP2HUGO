/**
 * Converts a string to a URL-friendly slug
 * @param {string} string - The string to convert to a slug
 * @returns {string} - The slugified string
 */
function slugify(string) {
  return string
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/&/g, '-and-')     // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')   // Remove all non-word characters
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

module.exports = slugify; 