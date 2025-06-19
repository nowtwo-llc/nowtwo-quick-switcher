# quick-switcher

Front-end web component for navigating and searching

## Development Environment

1. Ensure [Node.js](https://nodejs.org) is installed
2. Install quick-switcher dependencies

  ```bash
  npm i
  ```

## Todo

Document:

- [ ] Basic initialization
  - [ ] `searchCallback`
  - [ ] `selectCallback`
- [ ] Basic options
  - [ ] `hotKey`
  - [ ] `searchDelay`
- [ ] Subsearches
  - [ ] Defining items as subsearches
  - [ ] `selectChildSearchCallback`—performing an action when an item is selected that is a subsearch
- [ ] Tracker usage
  - [ ] What is the purpose of a tracker?
  - [ ] How is tracking enabled?
  - [ ] How can the tracker be overridden so that items can be pinned to the top/bottom of the list?
- [ ] Sorters?
  - These may go away, especially if the tracker is revamped to handle sorting automatically
- [ ] Filters?
  - Right now only one of these is really useable
