const {createGraphDBModel} = require("graphdb-utils");
const GDBStakeholderModel = createGraphDBModel({
  // its own property
  description: {type: String, internalKey: 'schema:description'},
  catchmentArea: {type: String, internalKey: 'cids:hasCatchmentArea'},
  name: {type: String, internalKey: 'genprops:hasName'},
  partOfs: {type: [() => require('./impactStuffs').GDBImpactModelModel], internalKey: 'oep:partOf'},
  characteristic: {type: [() => require("./characteristic").GDBCharacteristicModel], internalKey: 'cids:hasCharacteristic'}
},{
  rdfTypes: ['cids:Stakeholder'], name: 'stakeholder'
})

module.exports = {GDBStakeholderModel}