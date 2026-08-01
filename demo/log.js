/**
 * Small helper so the demo can show what was selected without a console.
 */

/**
 * Display the most recent selection on the page.
 *
 * @param {string} message - Text describing the selection.
 */
export const showSelection = (message) => {
    const output = document.querySelector('#demo-output');

    if (!output) {
        return;
    }

    output.hidden = false;
    output.textContent = message;
};
