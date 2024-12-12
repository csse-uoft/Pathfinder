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
    
    - `ReportGenerate/`: This folder includes various components dedicated to generating different types of reports and managing their related data.
      - `CharacteristicReports.js`: Component responsible for generating and displaying characteristic-based data.
      - `CodeReports.js`: Component for generating and displaying code-based data.
      - `GroupMembers.js`: Component for generating and displaying organization members in groups.
      - `ImpactReports.js`: Component for generating and showing impactReport-based data.
      - `IndicatorReports.js`: Component for generating and displaying indicator-based data.
      - `OutcomeReports.js`: Component for generating and displaying outcome-based data.
      - `ReportTypesPage.js`: Component serving as a page to list and select various report types.
      - `StakeholderOutcomeReports.js`: Component for generating and displaying stakeholderOutcome-based data.
      - `ThemeReport.js`: Component for generating and displaying theme-based data.
    
    - `characteristics/`: This folder organizes components related to displaying and managing characteristics data.
      - `AddEditCharacteristic.js`: A page component for creating and updating characteristic entries.
      - `Characteristic.js`: A component representing a single characteristic record or view.
      - `CharacteristicView.js`: A component displaying a detailed view of a characteristic.
      - `Characteristics.js`: A component listing and managing multiple characteristics.
    
    - `codes/`: This folder stores components for managing code entries.
      - `AddEditCode.js`: Component for adding or editing code entries.
      - `Code.js`: Component representing an individual code.
      - `CodeView.js`: Component displaying a detailed view of a particular code.
      - `Codes.js`: A component listing and managing multiple codes.
     
    - `dashboard/`: The dashboard folder includes components related to the dashboard page
      - `Dashboards.js`: The main component for rendering the dashboard page.
      - `NavButton.js`: A reusable button component for dashboard navigation. While primarily used in the dashboard, this component is designed for reuse across other navigation areas.
    - `impactRisk/`: The impactRisk folder contains components for managing and displaying impact risks
      - `AddEditImpactRisk.js`: A page component for adding or editing impact risks.
      - `ImpactRisks.js`:  A page component for listing impact risks.




