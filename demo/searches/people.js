/**
 * Demo: an asynchronous people search.
 *
 * Results arrive on a timer to stand in for a network request, which also
 * exercises the loading pane and the stale-result guard.
 */

import {showSelection} from '../log.js';

const PEOPLE = [
    {name: 'Amara Okafor', role: 'Engineering Manager', team: 'Platform'},
    {name: 'Ben Sørensen', role: 'Staff Engineer', team: 'Platform'},
    {name: 'Priya Raghunathan', role: 'Product Designer', team: 'Design'},
    {name: 'Marcus Webb', role: 'Account Executive', team: 'Sales'},
    {name: 'Yuki Tanaka', role: 'Data Analyst', team: 'Analytics'},
    {name: 'Elena Vasquez', role: 'Head of Support', team: 'Support'},
    {name: 'Tomás Ferreira', role: 'Backend Engineer', team: 'Platform'},
    {name: 'Nadia Haddad', role: 'Security Engineer', team: 'Infrastructure'},
    {name: 'Chris Lindgren', role: 'Frontend Engineer', team: 'Web'},
    {name: 'Fatima Al-Rashid', role: 'Product Manager', team: 'Growth'},
    {name: 'Daniel Boateng', role: 'Site Reliability Engineer', team: 'Infrastructure'},
    {name: 'Sophie Marchand', role: 'Technical Writer', team: 'Docs'},
    {name: 'Rajesh Kumar', role: 'QA Engineer', team: 'Web'},
    {name: 'Hannah Whitfield', role: 'Recruiter', team: 'People Ops'},
    {name: 'Omar Nasser', role: 'Solutions Architect', team: 'Sales'},
    {name: 'Ingrid Halvorsen', role: 'Finance Lead', team: 'Operations'},
    {name: 'Wei Chen', role: 'Machine Learning Engineer', team: 'Analytics'},
    {name: 'Lucia Moretti', role: 'Customer Success Manager', team: 'Support'},
    {name: 'Kofi Mensah', role: 'Mobile Engineer', team: 'Web'},
    {name: 'Astrid Lindqvist', role: 'Design Systems Lead', team: 'Design'},
];

export default {
    breadcrumbText: 'People',
    text: 'People',
    description: 'Search your teammates',
    trackChildrenAs: 'people',
    trackerId: 'people',
    searchDelay: 120,

    searchCallback(searchText, resultHandler) {
        const timeout = setTimeout(() => {
            const results = PEOPLE
                .filter((person) => resultHandler.filters.isMatch(
                    searchText,
                    `${person.name} ${person.role} ${person.team}`
                ))
                .map((person) => ({
                    text: person.name,
                    description: person.role,
                    trackerId: person.name,
                }));

            resultHandler.setResults(results);
        }, 180);

        // Returning an abort function lets the switcher cancel this search
        // when the query changes before it resolves.
        return () => clearTimeout(timeout);
    },

    selectCallback(selected) {
        showSelection(`Opened profile: ${selected.selectedValue.text}`);
    },
};
