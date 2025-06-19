define('filters', [], () => {
    return {
        areWordsFound(needle, haystack) {
            const pieces = needle.match(/\b\w+\b/g);
            
            for (let i = 0; i < pieces.length; i++) {
                if (haystack.indexOf(pieces[i]) == -1) {
                    return false;
                }
            }

            return true;
        },

        isMatch(needle, haystack) {
            if (haystack.indexOf(needle) != -1) {
                return true;
            } else if (this.areWordsFound(needle, haystack)) {
                return true;
            }

            return false;
        },
    };
});
