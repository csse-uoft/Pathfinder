const {fullLevelConfig} = require("../fileUploading/configs");
const {Server400Error} = require("../../utils");
const {GDBCodeModel} = require("../../models/code");
const {GDBMeasureModel} = require("../../models/measure");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;
const {getObjectValue} = require("../../helpers");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {assignValue, assignValues} = require("../helpers");
const {GDBOrganizationModel} = require("../../models/organization");

async function impactNormsBuilder(environment, object, organization, error, {impactNormsDict}, {
  addMessage,
  addTrace,
  transSave,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form) {
  let uri = object ? object['@id'] : undefined;
  const mainModel = GDBImpactNormsModel
  const mainObject = environment === 'fileUploading' ? impactNormsDict[uri] : mainModel({}, {uri: form.uri});

  if (environment !== 'fileUploading') {
    await mainObject.save();
    uri = mainObject._uri;
  }


  const config = fullLevelConfig['impactNorms'];
  let hasError = false;
  let ret;
  if (mainObject) {

    if (organization || form.organization) {
      mainObject.organization = organization?._uri || form.organization;

      organization = environment === 'fileUploading'? organization : await GDBOrganizationModel.findOne({_uri: form.organization});
      if (!organization)
        throw new Server400Error('For ImpactNorms, Organization is Mandatory');
      if (!organization.impactModels)
        organization.impactModels = [];
      organization.impactModels = [...organization.impactModels, uri]
      await organization.save();
    }
    if (!mainObject.organization && config["cids:forOrganization"]) {
      if (config["cids:forOrganization"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('For ImpactNorms, Organization is Mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'organization'))
          },
          config["cids:forOrganization"]
        );
    }

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'description', 'cids:hasDescription', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'dateCreated', 'schema:dateCreated', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'indicators', 'cids:hasIndicator', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'outcomes', 'cids:hasOutcome', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'impactReports', 'cids:hasImpactReport', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'indicatorReports', 'cids:hasIndicatorReport', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'stakeholderOutcomes', 'cids:hasStakeholderOutcome', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'stakeholders', 'cids:hasStakeholders', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    if (environment === 'interface') {
      await mainObject.save();
      return true;
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