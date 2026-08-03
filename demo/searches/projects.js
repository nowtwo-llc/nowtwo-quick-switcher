/**
 * Demo: a project search with status badges rendered as html descriptions,
 * and trackerStaticSort pinning active work above archived work.
 */

import { showSelection } from '../log.js';

const PROJECTS = [
    { name: 'Billing migration', status: 'active', updated: '2h ago' },
    { name: 'Q3 growth experiments', status: 'active', updated: '5h ago' },
    { name: 'Mobile onboarding revamp', status: 'active', updated: 'yesterday' },
    { name: 'Design system 2.0', status: 'active', updated: '2 days ago' },
    { name: 'SOC 2 evidence collection', status: 'active', updated: '3 days ago' },
    { name: 'Search relevance tuning', status: 'active', updated: '4 days ago' },
    { name: 'Customer health scoring', status: 'paused', updated: '2 weeks ago' },
    { name: 'Legacy API deprecation', status: 'paused', updated: '3 weeks ago' },
    { name: 'Webhooks v1', status: 'archived', updated: '4 months ago' },
    { name: 'Marketing site redesign', status: 'archived', updated: '7 months ago' }
];

/** Active work should outrank paused, which should outrank archived. */
const STATUS_ORDER = { active: 0, paused: 1, archived: 2 };

const STATUS_COLOR = { active: '#1a7f4b', paused: '#a06a00', archived: '#6b7280' };

export default {
    breadcrumbText: 'Projects',
    text: 'Projects',
    description: 'Jump to a project',
    trackChildrenAs: 'projects',
    trackerId: 'projects',
    searchDelay: 0,

    searchCallback(searchText, resultHandler) {
        const results = PROJECTS.filter((project) =>
            resultHandler.filters.isMatch(searchText, `${project.name} ${project.status}`)
        ).map((project) => ({
            text: project.name,
            trackerId: project.name,
            trackerStaticSort: STATUS_ORDER[project.status],
            description: {
                html: `<span class="demo-badge" style="color: ${
                    STATUS_COLOR[project.status]
                }">${project.status}</span> · ${project.updated}`
            }
        }));

        resultHandler.setResults(results);
    },

    selectCallback(selected) {
        showSelection(`Opened project: ${selected.selectedValue.text}`);
    }
};
