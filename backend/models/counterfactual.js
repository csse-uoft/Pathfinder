const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBMeasureModel} = require("./measure");
const {GDBDateTimeIntervalModel} = require("./time");

const GDBCounterfactualModel = createGraphDBModel({
  hasTime: {type: GDBDateTimeIntervalModel, internalKey: 'cids:hasTime'},
  description: {type: String, internalKey: 'cids:hasDescription'},
  iso72Value: {type: GDBMeasureModel, internalKey: 'iso21972:value'}
}, {
  rdfTypes: ['cids:Counterfactual'], name: 'counterfactual'
});

module.exports = {
  GDBCounterfactualModel
}