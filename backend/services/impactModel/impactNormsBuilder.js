const {GDBOutcomeModel} = require("../../models/outcome");
const {Transaction} = require("graphdb-utils");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {baseLevelConfig} = require("../fileUploading/configs");
const {assignValue, assignValues} = require("../helpers");
const {Server400Error} = require("../../utils");
const {GDBIndicatorModel} = require("../../models/indicator");

async function impactNormsBuilder(environment, object, organization, error, {impactNormsDict, objectDict}, {
  addMessage,
  addTrace,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form) {

  let uri = object? object['@id'] : undefined;
  let ret;
  const mainModel = GDBOutcomeModel;
  const mainObject = environment === 'fileUploading' ? impactNormsDict[uri] : mainModel({
  }, {uri: form.uri});

  if (environment !== 'fileUploading') {
    await Transaction.beginTransaction();
    await mainObject.save();
    uri = mainObject._uri;
  }

  if (environment !== 'fileUploading') {
    organization = await GDBOrganizationModel.findOne({_uri: form.organization});
    // impactNorms = await GDBImpactNormsModel.findOne({organization: form.organization}) || GDBImpactNormsModel({organization: form.organization})
  }
  mainObject.organization = organization._uri;
  if (!organization.impactModels)
    organization.impactModels = []
  organization.impactModels = [...organization.impactModels, uri]


  if (environment === 'interface') {
    await organization.save();
  }

  const config = baseLevelConfig['impactNorms'];
  let hasError = false;
  if (mainObject) {

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'description', 'cids:hasDescription', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'dateCreated', 'schema:dateCreated', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'stakeholders', 'cids:hasStakeholder', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'outcomes', 'cids:hasOutcome', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'stakeholderOutcomes', 'cids:hasStakeholderOutcome', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'indicators', 'cids:hasIndicator', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'impactReports', 'cids:hasImpactReport', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'indicatorReports', 'cids:hasIndicatorReport', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    if (environment === 'interface') {
      await mainObject.save();
      await Transaction.commit();
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

module.exports = {impactNormsBuilder};