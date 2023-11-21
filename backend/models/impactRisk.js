const {createGraphDBModel} = require("graphdb-utils");


const GDBImpactRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk'], name: 'impactRisk'
})

const GDBEvidenceRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:EvidenceRisk'], name: 'evidenceRisk'
})

const GDBStakeholderParticipationRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:StakeholderParticipationRisk'], name: 'stakeholderParticipationRisk'
})

const GDBExternalRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:ExternalRisk'], name: 'externalRisk'
})

const GDBDropOffRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:DropOffRisk'], name: 'dropOffRisk'
})

const GDBEfficiencyRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:EfficiencyRisk'], name: 'efficiencyRisk'
})

const GDBExecutionRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:ExecutionRisk'], name: 'executionRisk'
})

const GDBAlignmentRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:AlignmentRisk'], name: 'alignmentRisk'
})

const GDBEnduranceRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:EnduranceRisk'], name: 'enduranceRisk'
})

const GDBUnexpectedImpactRiskModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:UnexpectedImpactRisk'], name: 'unexpectedImpactRisk'
})

module.exports = {
  GDBImpactRiskModel,
  GDBExternalRiskModel,
  GDBEvidenceRiskModel,
  GDBStakeholderParticipationRiskModel,
  GDBDropOffRiskModel,
  GDBEfficiencyRiskModel,
  GDBExecutionRiskModel,
  GDBAlignmentRiskModel,
  GDBEnduranceRiskModel,
  GDBUnexpectedImpactRiskModel
}