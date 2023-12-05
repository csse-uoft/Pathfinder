const {GDBCodeModel} = require("../models/code");
const {GDBOrganizationModel} = require("../models/organization");
const {GDBOutcomeModel} = require("../models/outcome");
const {GDBIndicatorModel} = require("../models/indicator");
const {GDBIndicatorReportModel} = require("../models/indicatorReport");
const {GDBStakeholderOutcomeModel} = require("../models/stakeholderOutcome");
const {GDBCharacteristicModel} = require("../models/characteristic");
const {GDBCounterfactualModel} = require("../models/counterfactual");
const {GDBDataSetModel} = require("../models/dataset");
const {GDBFeatureModel} = require("../models/feature");
const {GDBGroupModel} = require("../models/group");
const {GDBHowMuchImpactModel} = require("../models/howMuchImpact");

const name2Model = {
  Code: GDBCodeModel,
  Organization: GDBOrganizationModel,
  outcome: GDBOutcomeModel,
  indicator: GDBIndicatorModel,
  indicatorReport: GDBIndicatorReportModel,
  stakeholderOutcome: GDBStakeholderOutcomeModel,
  Characteristic: GDBCharacteristicModel,
  Counterfactual: GDBCounterfactualModel,
  Dataset: GDBDataSetModel,
  Feature: GDBFeatureModel,
  Group: GDBGroupModel,
  HowMuchImpact: GDBHowMuchImpactModel
}

module.exports = {name2Model}