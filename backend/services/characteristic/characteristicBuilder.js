const configs = require("../fileUploading/configs");
const {GDBCharacteristicModel} = require("../../models/characteristic");
const {assignValue, assignValues} = require("../helpers");
const {getPrefixedURI} = require('graphdb-utils').SPARQL;

async function characteristicBuilder(environment, object, error, {characteristicDict}, {
  addMessage,
  addTrace,
  getFullPropertyURI,
  getValue,
  getListOfValue
}, form, configLevel) {
  let uri = object ? object['@id'] : undefined;
  const mainModel = GDBCharacteristicModel;
  let ret;
  const mainObject = environment === 'fileUploading' ? characteristicDict[uri] : await mainModel.findOne({_uri: form.uri}) || mainModel({}, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await mainObject.save();
    uri = mainObject._uri;
  }


  const config = configs[configLevel]['characteristic'];
  let hasError = false;
  if (mainObject) {

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'codes', 'cids:hasCode', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'stakeholders', 'cids:forStakeholder', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'value', 'cids:hasValue', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

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

module.exports = {characteristicBuilder};