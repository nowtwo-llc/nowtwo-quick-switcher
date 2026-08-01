/**
 * Storage
 *
 * A defensive wrapper around localStorage. Touching window.localStorage can
 * throw outright in sandboxed iframes and in some privacy modes, and stored
 * values can be corrupted by unrelated code, so every access is guarded and
 * failures degrade to an in-memory no-op rather than breaking the switcher.
 */

/**
 * Resolve localStorage if it is present and usable.
 *
 * @returns {Storage|null} The storage object, or null when unavailable.
 */
const getStorage = () => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }

        return window.localStorage;
    } catch {
        // Property access itself throws when storage is blocked by policy.
        return null;
    }
};

/**
 * Read and parse a JSON value from localStorage.
 *
 * @param {string} key - The storage key to read.
 * @returns {*} The parsed value, or null when missing or unreadable.
 */
export const readJson = (key) => {
    const storage = getStorage();

    if (!storage) {
        return null;
    }

    try {
        const raw = storage.getItem(key);

        if (!raw) {
            return null;
        }

        return JSON.parse(raw);
    } catch {
        // Corrupt or unparseable data should not permanently break the
        // switcher -- start fresh instead.
        return null;
    }
};

/**
 * Serialize and write a JSON value to localStorage.
 *
 * @param {string} key - The storage key to write.
 * @param {*} value - The value to serialize.
 * @returns {boolean} True when the write succeeded.
 */
export const writeJson = (key, value) => {
    const storage = getStorage();

    if (!storage) {
        return false;
    }

    try {
        storage.setItem(key, JSON.stringify(value));

        return true;
    } catch {
        // Quota exceeded, or storage disabled mid-session.
        return false;
    }
};
