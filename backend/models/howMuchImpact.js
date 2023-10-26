const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBMeasureModel} = require("./measure");
const {GDBIndicatorModel} = require("./indicator");
const {GDBDateTimeIntervalModel} = require("./time");

const GDBHowMuchImpactModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
}, {
  rdfTypes: ['owl:NamedIndividual', 'cids:HowMuchImpact'], name: 'howMuchImpact'
});

const GDBImpactScaleModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
}, {
  rdfTypes: ['cids:HowMuchImpact', 'cids:ImpactScale'], name: 'impactScale'
});

const GDBImpactDepthModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
}, {
  rdfTypes: ['cids:HowMuchImpact', 'cids:ImpactDepth'], name: 'impactDepth'
});

const GDBDurationModel = createGraphDBModel({
  indicator: {type: GDBIndicatorModel, internalKey: 'cids:forIndicator'},
  value: {type: GDBMeasureModel, internalKey: 'iso21972:value'},
  hasTime: {type: GDBDateTimeIntervalModel, internalKey: 'cids:hasTime'}
}, {
  rdfTypes: ['cids:HowMuchImpact', 'cids:ImpactDuration'], name: 'impactDepth'
});


module.exports = {
  GDBHowMuchImpactModel, GDBImpactScaleModel, GDBImpactDepthModel
}