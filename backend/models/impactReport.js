const {createGraphDBModel, Types, DeleteType} = require("graphdb-utils");
const {GDBDateTimeIntervalModel} = require("./time");

const GDBImpactReportModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'},
  comment: {type: String, internalKey: 'cids:hasComment'},
  forStakeholderOutcome: {type: () => require('./stakeholderOutcome').GDBStakeholderOutcomeModel, internalKey: 'cids:forOutcome'},
  forOrganization: {type: () => require('./organization').GDBOrganizationModel, internalKey: 'cids:forOrganization'},
  impactScale: {type: () => require('./howMuchImpact').GDBImpactScaleModel, internalKey: 'cids:hasImpactScale'},
  impactDepth: {type: () => require('./howMuchImpact').GDBImpactDepthModel, internalKey: 'cids:hasImpactDepth'},
  impactDuration: {type: () => require('./howMuchImpact').GDBImpactDurationModel, internalKey: 'cids:hasImpactDuration'},
  hasTime: {type: GDBDateTimeIntervalModel, internalKey: 'time:hasTime', onDelete: DeleteType.CASCADE},
  reportedImpact: {type: String, internalKey: 'cids:hasReportedImpact'},
  expectation: {type: String, internalKey: 'cids:hasExpectation'},
  impactRisks: {type: [() => require('./impactRisk').GDBImpactRiskModel], internalKey: 'cids:hasImpactRisk'}
}, {
  rdfTypes: ['cids:ImpactReport'], name: 'impactReport'
});

module.exports = {
  GDBImpactReportModel
}