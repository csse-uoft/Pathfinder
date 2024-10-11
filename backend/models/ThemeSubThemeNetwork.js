const {createGraphDBModel} = require("graphdb-utils");
const {GDBOrganizationModel} = require("./organization");
const {GDBHasSubThemePropertyModel} = require("./hasSubThemeProperty");

const GDBThemeSubThemeNetworkModel = createGraphDBModel({
  dateCreated: {type: Date, internalKey: 'schema:dateCreated'},
  name: {type: String, internalKey: ':hasName'},
  description: {type: String, internalKey: ':hasDescription'},
  themeEdges: {type: [GDBHasSubThemePropertyModel], internalKey: ':hasEdge'},
  forOrganization: {type: GDBOrganizationModel, internalKey: 'cids:forOrganization'}
}, {
  rdfTypes: [':themeSubThemeNetwork'], name: 'themeSubThemeNetwork'
});

module.exports = {
  GDBThemeSubThemeNetworkModel
}