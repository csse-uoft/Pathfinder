const {createGraphDBModel} = require("graphdb-utils");


const GDBImpactRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk'], name: 'impactRisk'
})

const GDBEvidenceRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:EvidenceRisk'], name: 'evidenceRisk'
})

const GDBStakeholderParticipationRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:StakeholderParticipationRisk'], name: 'stakeholderParticipationRisk'
})

const GDBExternalRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:ExternalRisk'], name: 'externalRisk'
})

const GDBDropOffRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:DropOffRisk'], name: 'dropOffRisk'
})

const GDBEfficiencyRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:EfficiencyRisk'], name: 'efficiencyRisk'
})

const GDBExecutionRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:ExecutionRisk'], name: 'executionRisk'
})

const GDBAlignmentRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:AlignmentRisk'], name: 'alignmentRisk'
})

const GDBEnduranceRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'cids:hasIdentifier'}
}, {
  rdfTypes: ['cids:ImpactRisk', 'cids:EnduranceRisk'], name: 'enduranceRisk'
})

const GDBUnexpectedImpactRiskModel = createGraphDBModel({
  identifier: {type: String, internalKey:'cids:hasIdentifier'}
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