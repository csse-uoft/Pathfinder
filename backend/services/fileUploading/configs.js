const baseLevelConfig = {

  theme: {},
  outcome: {
    // 'cids:hasIndicator': {flag: true},
  },
  indicator: {
    'cids:forOutcome': {flag: true},
    'cids:hasName': {flag: true}
  },
  indicatorReport: {
    'cids:hasName': {flag: true},
    'cids:forIndicator': {ignoreInstance: true},
    'iso21972:value': {flag: true}
  },
  stakeholderOutcome: {},
  characteristic: {},
  impactScale:{},
  impactDepth: {},
  code: {}
};

const fullLevelConfig = {
  outcome: {
    // 'cids:hasIndicator': {flag: true},
    'oep:partOf': {ignoreInstance: true}
  },
  impactNorms: {},
  indicator: {
    'cids:forOutcome': {flag: true},
    'oep:partOf': {ignoreInstance: true}
  },
  stakeholderOutcome: {},
  characteristic: {},
  impactScale:{},
  impactDepth: {},
  code: {},
  theme: {},
  indicatorReport: {
    'cids:hasName': {flag: true},
    'cids:forIndicator': {ignoreInstance: true},
    'iso21972:value': {flag: true}
  },
  impactReport: {},
  counterfactual: {},
  impactRisk: {},
  evidenceRisk: {},
  externalRisk: {},
  stakeholderParticipationRisk: {},
  dropOffRisk: {},
  efficiencyRisk: {},
  executionRisk: {},
  alignmentRisk: {},
  enduranceRisk: {},
  unexpectedImpactRisk: {},
  impactDuration: {},
  dataset: {},
  stakeholder: {}
}

module.exports = {
  baseLevelConfig, fullLevelConfig
};