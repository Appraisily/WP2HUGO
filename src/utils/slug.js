/**
 * Creates a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} The slugified text
 */
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  createSlug
};