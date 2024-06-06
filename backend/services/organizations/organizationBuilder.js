const configs = require("../fileUploading/configs");
const {GDBOrganizationModel} = require("../../models/organization");
const {assignValue, assignValues} = require("../helpers");

const {getPrefixedURI} = require('graphdb-utils').SPARQL;

async function organizationBuilder(environment, object, error, {organizationDict, objectDict}, {
  addMessage,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form, configLevel) {
  let uri = object ? object['@id'] : undefined;
  let ret;
  const mainModel = GDBOrganizationModel;
  const mainObject = environment === 'fileUploading' ? organizationDict[uri] : form.uri ? (await mainModel.findOne({_uri: form.uri}) || mainModel({}, {uri: form.uri})) : mainModel({});

  if (environment === 'interface') {
    await mainObject.save();
    uri = mainObject._uri;
  }

  const config = configs[configLevel]['organization'];
  let hasError = false;
  if (mainObject) {


    ret = assignValue(environment, config, object, mainModel, mainObject, 'legalStatus', 'tove_org:hasLegalStatus', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'comment', 'rdfs:comment', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'legalName', 'tove_org:hasLegalName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'hasIndicators', 'cids:hasIndicator', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'hasOutcomes', 'cids:hasOutcome', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'characteristics', 'cids:hasCharacteristic', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    if (environment === 'interface') {
      await mainObject.save();
      return true;
    }
    if (hasError) {
    } else if (environment === 'fileUploading') {
      // addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }

  } else {

  }
  return error;

}

module.exports = {organizationBuilder};