/**
 * Demo: a search that always fails, to show the error pane.
 */

export default {
    breadcrumbText: 'Demo Error',
    text: 'Demo Error',
    trackerId: 'Demo Error',

    searchCallback(searchText, resultHandler) {
        resultHandler.setError();
    }
};
