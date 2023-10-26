const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBMeasureModel} = require("./measure");
const {GDBIndicatorModel} = require("./indicator");
const {GDBDateTimeIntervalModel} = require("./time");
const {GDBCounterfactualModel} = require("./counterfactual");

const GDBHowMuchImpactModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
  counterfactual: {type: GDBCounterfactualModel, internalKey: 'cids:hasCounterfactual'}
}, {
  rdfTypes: ['owl:NamedIndividual', 'cids:HowMuchImpact'], name: 'howMuchImpact'
});

const GDBImpactScaleModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
  counterfactual: {type: GDBCounterfactualModel, internalKey: 'cids:hasCounterfactual'}
}, {
  rdfTypes: ['cids:HowMuchImpact', 'cids:ImpactScale'], name: 'impactScale'
});

const GDBImpactDepthModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
  counterfactual: {type: GDBCounterfactualModel, internalKey: 'cids:hasCounterfactual'}
}, {
  rdfTypes: ['cids:HowMuchImpact', 'cids:ImpactDepth'], name: 'impactDepth'
});

const GDBImpactDurationModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
  hasTime: {type: GDBDateTimeIntervalModel, internalKey: 'cids:hasTime'},
  counterfactual: {type: GDBCounterfactualModel, internalKey: 'cids:hasCounterfactual'}
}, {
  rdfTypes: ['cids:HowMuchImpact', 'cids:ImpactDuration'], name: 'impactDuration'
});


module.exports = {
  GDBHowMuchImpactModel, GDBImpactScaleModel, GDBImpactDepthModel, GDBImpactDurationModel
}