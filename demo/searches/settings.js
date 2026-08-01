/**
 * Demo: a settings search, nesting the accent-color picker one level deeper.
 * Exercises a three-level breadcrumb trail.
 */

import {showSelection} from '../log.js';
import accentColor from './colors.js';

const SETTINGS = [
    {name: 'Profile', description: 'Name, avatar, and contact details'},
    {name: 'Notifications', description: 'Email and in-app alerts'},
    {name: 'Two-factor authentication', description: 'Security'},
    {name: 'API keys', description: 'Developer access tokens'},
    {name: 'Billing and invoices', description: 'Plan, usage, and receipts'},
    {name: 'Team members', description: 'Invite and manage access'},
    {name: 'Integrations', description: 'Slack, GitHub, Linear, and more'},
    {name: 'Data export', description: 'Download your workspace data'},
];

export default {
    breadcrumbText: 'Settings',
    text: 'Settings',
    description: 'Workspace preferences',
    trackChildrenAs: 'settings',
    trackerId: 'settings',
    searchDelay: 0,

    searchCallback(searchText, resultHandler) {
        const results = SETTINGS
            .filter((setting) => resultHandler.filters.isMatch(
                searchText,
                `${setting.name} ${setting.description}`
            ))
            .map((setting) => ({
                text: setting.name,
                description: setting.description,
                trackerId: setting.name,
            }));

        // A nested search inside a nested search.
        if (resultHandler.filters.isMatch(searchText, 'accent color theme')) {
            results.push(accentColor);
        }

        resultHandler.setResults(results);
    },

    selectCallback(selected) {
        showSelection(`Opened setting: ${selected.selectedValue.text}`);
    },
};
