const {createGraphDBModel, Types, DeleteType} = require("graphdb-utils");
const {GDBUserAccountModel} = require("./userAccount");
const {GDBIndicatorModel} = require("./indicator");
const {GDBPhoneNumberModel} = require("./phoneNumber");

const GDBOrganizationIdModel = createGraphDBModel({
  hasIdentifier: {type: String, internalKey: 'tove_org:hasIdentifier'},
  issuedBy: {type: (() => GDBOrganizationModel), internalKey: 'tove_org:issuedBy'},
  dateCreated: {type: Date, internalKey: 'schema:dateCreated'}
}, {
  rdfTypes: ['tove_org:OrganizationID'], name: 'organizationId'
});

const GDBOrganizationModel = createGraphDBModel({
  legalStatus: {type: String, internalKey: 'tove_org:hasLegalStatus'},
  comment: {type: String, internalKey: 'rdfs:comment'},
  hasUsers: {type: [GDBUserAccountModel], internalKey: ':hasUser'},
  administrator: {type: GDBUserAccountModel, internalKey: ':hasAdministrator'},
  reporters: {type: [GDBUserAccountModel], internalKey: ':hasReporter'},
  editors: {type: [GDBUserAccountModel], internalKey: ':hasEditor'},
  researchers: {type: [GDBUserAccountModel], internalKey: ':hasResearcher'},
  legalName: {type: String, internalKey:'tove_org:hasLegalName'},
  hasIds: {type: [GDBOrganizationIdModel], internalKey: 'tove_org:hasID', onDelete: DeleteType.CASCADE},
  hasIndicators: {type: [GDBIndicatorModel], internalKey: 'cids:hasIndicator'},
  hasOutcomes: {type: [() => require("./outcome").GDBOutcomeModel], internalKey: 'cids:hasOutcome', onDelete: DeleteType.CASCADE},
  telephone: {type: GDBPhoneNumberModel, internalKey: 'ic:hasTelephone', onDelete: DeleteType.CASCADE},
  contactName: {type: String, internalKey: ':hasContactName'},
  email: {type: String, internalKey: ':hasEmail'},
  impactModels: {type: [() => require('./impactStuffs').GDBImpactModelModel], internalKey: 'cids:hasImpactModel'},
  characteristics: {type: [() => require("./characteristic").GDBCharacteristicModel], internalKey: 'cids:hasCharacteristic'}
}, {
  rdfTypes: ['cids:Organization'], name: 'organization'
});

const GDBStakeholderOrganizationModel = createGraphDBModel({
  // organization's properties
  comment: {type: String, internalKey: 'rdfs:comment'},
  hasUsers: {type: [GDBUserAccountModel], internalKey: ':hasUser'},
  administrator: {type: GDBUserAccountModel, internalKey: ':hasAdministrator'},
  reporters: {type: [GDBUserAccountModel], internalKey: ':hasReporter'},
  editors: {type: [GDBUserAccountModel], internalKey: ':hasEditor'},
  researchers: {type: [GDBUserAccountModel], internalKey: ':hasResearcher'},
  legalName:{type: String, internalKey:'tove_org:hasLegalName'},
  hasIds: {type: [GDBOrganizationIdModel], internalKey: 'tove_org:hasID', onDelete: DeleteType.CASCADE},
  hasIndicators: {type: [GDBIndicatorModel], internalKey: 'cids:hasIndicator'},
  hasOutcomes: {type: [require("./outcome").GDBOutcomeModel], internalKey: 'cids:hasOutcome', onDelete: DeleteType.CASCADE},
  telephone: {type: GDBPhoneNumberModel, internalKey: 'ic:hasTelephone', onDelete: DeleteType.CASCADE},
  contactName: {type: String, internalKey: ':hasContactName'},
  email: {type: String, internalKey: ':hasEmail'},
  impactModels: {type: [() => require('./impactStuffs').GDBImpactModelModel], internalKey: 'cids:hasImpactModel'},
  characteristics: {type: [() => require("./characteristic").GDBCharacteristicModel], internalKey: 'cids:hasCharacteristic'},

  // its own property
  description: {type: String, internalKey: 'schema:description'},
  partOfs: {type: [() => require('./impactStuffs').GDBImpactModelModel], internalKey: 'oep:partOf'},
  catchmentArea: {type: String, internalKey: 'cids:hasCatchmentArea'},
  name: {type: String, internalKey: 'cids:hasName'}
},{
  rdfTypes: ['cids:Organization', 'cids:Stakeholder'], name: 'stakeholderOrganization'
})

module.exports = {
  GDBOrganizationModel, GDBOrganizationIdModel, GDBStakeholderOrganizationModel
}