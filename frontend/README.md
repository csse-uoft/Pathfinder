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
    
    - `characteristics/`: This folder organizes components related to displaying and managing characteristics.
      - `AddEditCharacteristic.js`: A page component for creating and updating one characteristic.
      - `Characteristic.js`: A component representing a single characteristic record or view.
      - `CharacteristicView.js`: A component displaying a detailed view of a characteristic.
      - `Characteristics.js`: A component listing and managing multiple characteristics.
    
    - `codes/`: This folder organizes components related to displaying and managing codes.
      - `AddEditCode.js`: Component for adding or editing one code.
      - `Code.js`: Component representing an individual code.
      - `CodeView.js`: Component displaying a detailed view of a particular code.
      - `Codes.js`: A component listing and managing multiple codes.
     
    - `counterfactual/`: This folder organizes components related to displaying and managing counterfactuals.
      - `AddEditCounterfactual.js`: Component for adding or editing one counterfactual.
      - `Counterfactuals.js`: Component for listing and managing counterfactuals.
        
    - `dashboard/`: The dashboard folder includes components related to the dashboard page
      - `Dashboards.js`: The main component for rendering the dashboard page.
      - `NavButton.js`: A reusable button component for dashboard navigation. While primarily used in the dashboard, this component is designed for reuse across other navigation areas.
        
    - `dataDashboard/`: Components for displaying and managing data dashboards.
      - `DataDashboard.js`: Main component of the data dashboard page, featuring various types of graphs to visually represent the data.
        
    - `dataExport/`: Components related to data exporting functionality.
      - `dataExport.js`: Main component or module handling data export operations.
        
    - `datasets/`: This folder organizes components related to displaying and managing datasets.
      - `AddEditDataset.js`: Component for adding or editing one dataset.
      - `Datasets.js`: Component for listing and managing datasets.
        
    - `forgotPassword/`: Components related to password recovery functionality.
      - `ForgotPassword.js`: Component handling the "Forgot Password" page and logic.
      - `ResetPassword.js`: Component that provides the "Reset Password" functionality.
    
    - `groups/`: Components to manage and display groups.
      - `AddEditGroup.js`: Component for adding or editing one group.
      - `Groups.js`: Component to list and manage groups.
    
    - `howMuchImpact/`: Components focused on managing the How Much Impact.
      - `AddEditHowMuchImpact.js`: Component for creating or updating one How Much Impact.
      - `HowMuchImpacts.js`: Component listing HowMuchImpact.
    
    - `impactModels/`: Components dealing with impact model data.
      - `AddEditImpactModel.js`: Component for adding or editing one Impact Model.
      - `impactModels.js`: Component listing and managing Impact Models associated with a specific organization.
      - `organization-impactModel.js`: This component allows users to view and select from a list of organizations. Upon choosing an organization, users can seamlessly navigate to impactModels.js to explore further details.
    
    - `impactReport/`: Components related to generating and displaying impact reports.
      - `AddEditImpactReport.js`: Component for creating or updating one impact report.
      - `ImpactReport.js`: Component for a single impact report.
      - `ImpactReportView.js`: Component providing a detailed view of an impact report.
      - `ImpactReports.js`: Component for listing and managing impact reports.
      - `Organization-impactReport.js`: Component for organization-specific impact report details.
        
    - `impactRisk/`: The impactRisk folder contains components for managing and displaying impact risks
      - `AddEditImpactRisk.js`: A page component for adding or editing one impact risk.
      - `ImpactRisks.js`:  A page component for listing impact risks.

    - `indicatorReport/`: Components for managing and displaying indicator reports.
      - `AddEditIndicatorReport.js`: Component for creating or editing an indicator report.
      - `IndicatorReport.js`: Component representing a single indicator report.
      - `IndicatorReportView.js`: Component providing a detailed view of an indicator report.
      - `IndicatorReports.js`: Component for listing and managing indicator reports.
    
    - `indicators/`: Components for handling indicators and their related data.
      - `AddEditIndicator.js`: Component for adding or editing an indicator.
      - `Indicator.js`: Component representing a single indicator.
      - `IndicatorView.js`: Component providing a detailed view of an indicator.
      - `Indicators.js`: Component listing and managing indicators.
    
    - `layouts/`: Layout components that define the overall UI structure.
      - `Footer.js`: Layout component for the page footer.
      - `TopNavbar.js`: Layout component for the top navigation bar.
    
    - `login/`: Components associated with the login and authentication process.
      - `DoubleAuth.js`: Manages two-factor authentication, requiring the user to correctly answer one of three security questions set by themselves.
      - `LoginPane.js`: Provides the login interface where users can input their email and password.
      - `SuperPasswordPage.js`: The initial page encountered by the user, serving as an additional authentication step. Users must correctly enter the super password to proceed to the login pane.
    
    - `nodeGraph/`: Components related to displaying data in a node graph.
      - `nodeGraph.js`: Component that handles node graph visualization and interactions.
    
    - `organizations/`: Components related to managing organizations.
      - `AddEditOrganization.js`: Component for adding or editing one organization.
      - `Organization.js`: Component representing a single organization’s data.
      - `OrganizationView.js`: Component providing a detailed view of an organization.
      - `Organizations.js`: Component listing and managing organizations.




