const {createGraphDBModel, Types} = require("graphdb-utils");
const {GDBMeasureModel} = require("./measure");

const GDBFeatureModel = createGraphDBModel({
  name: {type: String, internalKey: 'cids:hasName'},
}, {
  rdfTypes: ['geo:Feature', 'iso21972:Feature'], name: 'code'
});

module.exports = {
  GDBFeatureModel
}