const {createGraphDBModel, Types} = require("graphdb-utils");

const GDBDataSetModel = createGraphDBModel({
  identifier: {type: String, internalKey: 'schema:identifier'},
  name: {type: String, internalKey: 'schema:name'},
  description: {type: String, internalKey: 'schema:description'},
  dateCreated: {type: Date, internalKey: 'schema:dateCreated'},
}, {
  rdfTypes: ['dcat:Dataset'], name: 'dataset'
});

module.exports = {
  GDBDataSetModel
}