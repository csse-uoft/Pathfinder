const {createGraphDBModel, Types, DeleteType} = require("graphdb-utils");
const {GDBIndicatorReportModel} = require("./indicatorReport");
const {GDBOutcomeModel} = require("./outcome");
const {GDBMeasureModel, GDBUnitOfMeasure} = require("./measure");

const GDBIndicatorModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'}, // todo: here is issue, on protege, it should be tov_org:hasName
  description: {type: String, internalKey: 'cids:hasDescription'},
  forOutcomes: {type: [GDBOutcomeModel], internalKey: 'cids:forOutcome'},
  indicatorReports: {type: [GDBIndicatorReportModel], internalKey: 'cids:hasIndicatorReport'},
  forOrganization: {type: () => require('./organization').GDBOrganizationModel, internalKey: 'cids:definedBy'},
  unitOfMeasure: {type: GDBUnitOfMeasure, internalKey: 'iso21972:unit_of_measure', onDelete: DeleteType.CASCADE},
  codes: {type: [() => require('./code').GDBCodeModel], internalKey: 'cids:hasCode'},
  baseline: {type: GDBMeasureModel, internalKey: 'cids:hasBaseline', onDelete: DeleteType.CASCADE},
  threshold: {type: GDBMeasureModel, internalKey: 'cids:hasThreshold', onDelete: DeleteType.CASCADE},
  hasAccesss: {type: [() => require("./organization").GDBOrganizationModel], internalKey: 'cids:hasAccess'},
  identifier: {type: String, internalKey: 'tove_org:hasIdentifier'},
  dateCreated: {type: Date, internalKey: 'schema:dateCreated'},
  datasets: {type: [() => require('./dataset').GDBDataSetModel], internalKey: 'dcat:dataset', onDelete: DeleteType.CASCADE},
  reportGenerator: {type: String, internalKey: ':reportGenerator'}
}, {
  rdfTypes: ['cids:Indicator'], name: 'indicator'
});

module.exports = {
  GDBIndicatorModel,
}