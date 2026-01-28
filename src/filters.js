/**
 * Filters Module
 * Provides search matching logic for substring and multi-word filtering.
 */
define('filters', [], () => {
    return {
        areWordsFound(needle, haystack) {
            const pieces = needle.match(/\b\w+\b/g);
            
            for (let i = 0; i < pieces.length; i++) {
                if (!haystack.includes(pieces[i])) {
                    return false;
                }
            }

            return true;
        },

        isMatch(needle, haystack) {
            if (haystack.includes(needle)) {
                return true;
            } else if (this.areWordsFound(needle, haystack)) {
                return true;
            }

            return false;
        },
    };
});
