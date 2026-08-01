/**
 * Demo: a document search, long enough to need scrolling.
 */

import {showSelection} from '../log.js';

const DOCUMENTS = [
    {title: 'Incident postmortem: checkout outage', author: 'Daniel Boateng', when: 'Jul 28'},
    {title: 'Q3 roadmap', author: 'Fatima Al-Rashid', when: 'Jul 24'},
    {title: 'API rate limiting RFC', author: 'Ben Sørensen', when: 'Jul 22'},
    {title: 'Onboarding funnel analysis', author: 'Yuki Tanaka', when: 'Jul 19'},
    {title: 'Design system component audit', author: 'Astrid Lindqvist', when: 'Jul 18'},
    {title: 'Support escalation playbook', author: 'Elena Vasquez', when: 'Jul 15'},
    {title: 'Vendor security review: Stripe', author: 'Nadia Haddad', when: 'Jul 12'},
    {title: 'Pricing experiment results', author: 'Fatima Al-Rashid', when: 'Jul 11'},
    {title: 'Database sharding proposal', author: 'Tomás Ferreira', when: 'Jul 9'},
    {title: 'Hiring plan: Platform team', author: 'Amara Okafor', when: 'Jul 8'},
    {title: 'Mobile release checklist', author: 'Kofi Mensah', when: 'Jul 5'},
    {title: 'Customer interview notes: Acme', author: 'Lucia Moretti', when: 'Jul 3'},
    {title: 'Accessibility audit findings', author: 'Priya Raghunathan', when: 'Jul 1'},
    {title: 'Cost optimization: compute spend', author: 'Ingrid Halvorsen', when: 'Jun 27'},
    {title: 'Search ranking model v2', author: 'Wei Chen', when: 'Jun 25'},
    {title: 'Style guide: error messages', author: 'Sophie Marchand', when: 'Jun 21'},
    {title: 'Load testing results', author: 'Rajesh Kumar', when: 'Jun 18'},
    {title: 'Partner integration spec', author: 'Omar Nasser', when: 'Jun 14'},
    {title: 'Brand refresh proposal', author: 'Astrid Lindqvist', when: 'Jun 10'},
    {title: 'On-call rotation policy', author: 'Daniel Boateng', when: 'Jun 6'},
    {title: 'Churn analysis: enterprise tier', author: 'Yuki Tanaka', when: 'Jun 2'},
    {title: 'Frontend performance budget', author: 'Chris Lindgren', when: 'May 30'},
    {title: 'Data retention policy', author: 'Nadia Haddad', when: 'May 27'},
    {title: 'Sales enablement deck', author: 'Marcus Webb', when: 'May 23'},
    {title: 'Interview rubric: engineering', author: 'Hannah Whitfield', when: 'May 20'},
];

export default {
    breadcrumbText: 'Documents',
    text: 'Documents',
    description: 'Search docs and notes',
    trackChildrenAs: 'documents',
    trackerId: 'documents',
    searchDelay: 0,

    searchCallback(searchText, resultHandler) {
        const results = DOCUMENTS
            .filter((doc) => resultHandler.filters.isMatch(
                searchText,
                `${doc.title} ${doc.author}`
            ))
            .map((doc) => ({
                text: doc.title,
                description: `${doc.author} · ${doc.when}`,
                trackerId: doc.title,
            }));

        resultHandler.setResults(results);
    },

    selectCallback(selected) {
        showSelection(`Opened document: ${selected.selectedValue.text}`);
    },
};
