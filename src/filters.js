/**
 * Filters
 *
 * Search matching logic for substring and multi-word filtering. Exposed to
 * consumers on the result handler as `resultHandler.filters`.
 */

/**
 * Coerce an arbitrary value into a lowercase string safe for matching.
 *
 * @param {*} value - The value to normalize.
 * @returns {string} A lowercase string, or '' for null/undefined.
 */
const normalize = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).toLowerCase();
};

/**
 * Word characters include unicode letters and numbers so that non-English
 * search terms tokenize the same way English ones do.
 */
const WORD_PATTERN = /[\p{L}\p{N}_]+/gu;

export const filters = {
    /**
     * Determine whether every word in the needle appears somewhere in the
     * haystack. Matching is case-insensitive.
     *
     * @param {string} needle - The search term.
     * @param {string} haystack - The text being searched.
     * @returns {boolean} True when every word in the needle is found.
     */
    areWordsFound(needle, haystack) {
        const words = normalize(needle).match(WORD_PATTERN);

        // A needle with no searchable words (empty, or pure punctuation) is
        // not treated as matching everything -- the substring check in
        // isMatch() already covers a literal match.
        if (!words) {
            return false;
        }

        const target = normalize(haystack);

        return words.every((word) => target.includes(word));
    },

    /**
     * Determine whether the needle matches the haystack, either as a direct
     * substring or by having all of its words present. Case-insensitive.
     *
     * @param {string} needle - The search term.
     * @param {string} haystack - The text being searched.
     * @returns {boolean} True when the needle matches.
     */
    isMatch(needle, haystack) {
        if (normalize(haystack).includes(normalize(needle))) {
            return true;
        }

        return this.areWordsFound(needle, haystack);
    }
};

export default filters;
