const {fullLevelConfig} = require("../fileUploading/configs");
const {GDBOrganizationModel, GDBStakeholderOrganizationModel} = require("../../models/organization");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {assignValue, assignValues, assignImpactNorms} = require("../helpers");
const {GraphDB} = require("graphdb-utils");

const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function stakeholderOrganizationBuilder(environment, object, organization, error, {stakeholderDict, objectDict, impactNormsDict}, {
  addMessage,
  addTrace,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form) {
  let uri = object? object['@id'] : undefined;
  let ret;
  const mainModel = GDBStakeholderOrganizationModel;
  let impactNorms;
  const mainObject = environment === 'fileUploading' ? stakeholderDict[uri] : mainModel({
  }, {uri: form.uri});

  if (environment === 'interface') {
    await mainObject.save();
    uri = mainObject._uri;
  }
  
  const previousOrganization = await GDBOrganizationModel.findOne({_uri: uri})


  if (environment === 'interface') {
    await organization.save();
  }

  const config = fullLevelConfig['stakeholder'];
  let hasError = false;
  if (mainObject) {

    ret = assignValues(environment, config, object, mainModel, mainObject, 'partOfs', 'oep:partOf', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    if (mainObject.partOfs && mainObject.partOfs.length) {
      for (let impactNormsUri of mainObject.partOfs) {
        if (!impactNormsDict[impactNormsUri]) {
          const impactNorms = await GDBImpactNormsModel.findOne({_uri: impactNormsUri});
          if (!impactNorms.stakeholders)
            impactNorms.stakeholders = []
          impactNorms.stakeholders = [...impactNorms.stakeholders, uri]
        }
        await impactNorms.save();
      }
    }


    ret = assignValue(environment, config, object, mainModel, mainObject, 'description', 'schema:description', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'catchmentArea', 'cids:hasCatchmentArea', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'genprops:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'characteristics', 'cids:hasCharacteristic', addMessage, form, uri, hasError, error, getListOfValue)
    hasError = ret.hasError;
    error = ret.error;
    
    mainObject.comment = previousOrganization.comment
    mainObject.hasUsers = previousOrganization.hasUsers
    mainObject.administrator = previousOrganization.administrator
    mainObject.reporters = previousOrganization.reporters
    mainObject.editors = previousOrganization.editors
    mainObject.researchers = previousOrganization.researchers
    mainObject.legalName = previousOrganization.legalName
    mainObject.hasIds = previousOrganization.hasIds
    mainObject.hasIndicators = previousOrganization.hasIndicators
    mainObject.hasOutcomes = previousOrganization.hasOutcomes
    mainObject.telephone = previousOrganization.telephone
    mainObject.contactName = previousOrganization.contactName
    mainObject.email = previousOrganization.email
    


    
    if (environment === 'interface') {
      await mainObject.save();
      return true
    }
    if (hasError) {
      // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
    } else if (environment === 'fileUploading') {
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }

  } else {
    // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
  }
  return error;

}

module.exports = {stakeholderOrganizationBuilder};