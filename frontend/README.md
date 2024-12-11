# Common Approach Sandbox Frontend
---
## Table of Contents
- [Introduction](#introduction)
- [Installation](#installation)
- [Structure](#structure)
---
## Introduction
The frontend uses React.js as the framework and primarily leverages MaterialUI for its theming.

---
## Installation
### Install dependencies
```shell
npm install -g yarn
yarn install
```

#### Start Frontend
```shell
yarn start
```

#### Build Frontend
```shell
yarn build
```

#### Serve built frontend
```shell
npx serve -s ./build
```
---
## Structure
All files and folders use PascalCase for naming.
The code building pages and components needed to build pages are in folder src/components. Most of pages are folded by their catogaries. For example, Dashboards.js and the buttons on the dashboard NavButton.js are in the src/component/dashboard. Moreover, AddEditImpactRisk.js(addEditImpactRisk page) and ImpactRisks(List of Impact Risks page) are in src/components/impactRisk

- `src/`
  - `components/`: contains the core code for building pages and the reusable components needed for those pages. Most pages and their associated components are organized into subfolders by category for better modularity and maintainability.
    - `dashboard/`: The dashboard folder includes components related to the dashboard page
      - `Dashboards.js`: The main component for rendering the dashboard page.
      - `NavButton.js`: A reusable button component for dashboard navigation. While primarily used in the dashboard, this component is designed for reuse across other navigation areas.
    - `impactRisk/`: The impactRisk folder contains components for managing and displaying impact risks
      - `AddEditImpactRisk.js`: A page component for adding or editing impact risks.
      - `ImpactRisks.js`:  A page component for listing impact risks.




