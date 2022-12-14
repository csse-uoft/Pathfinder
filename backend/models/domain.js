const {createGraphDBModel, Types} = require("../utils/graphdb");

const GDBDomainModel = createGraphDBModel({
  name: {type: String, internalKey: 'tove_org:hasName'},
  description: {type: String, internalKey: 'cids:hasDescription'},
}, {
  rdfTypes: ['cids:Domain'], name: 'domain'
});

module.exports = {
  GDBDomainModel
}