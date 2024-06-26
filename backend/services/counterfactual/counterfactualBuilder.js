const {fullLevelConfig} = require("../fileUploading/configs");
const {assignValue, assignValues, assignMeasure, assignTimeInterval} = require("../helpers");
const {GDBCounterfactualModel} = require("../../models/counterfactual");
const {getPrefixedURI} = require('graphdb-utils').SPARQL;
const configs = require("../fileUploading/configs");

async function counterfactualBuilder(environment, object, organization, error, {
  counterfactualDict,
  objectDict
}, {
                                  addMessage,
                                  addTrace,
                                  getFullPropertyURI,
                                  getValue,
                                  getListOfValue
                                }, form, configLevel) {
  let uri = object ? object['@id'] : undefined;
  const mainModel = GDBCounterfactualModel;
  let hasError = false;
  let ret;
  const mainObject = environment === 'fileUploading' ? counterfactualDict[uri] : await mainModel.findOne({_uri: uri})|| mainModel({}, {uri: form.uri});
  if (environment === 'interface') {
    await mainObject.save();
    uri = mainObject._uri;
  }

  const config = configs[configLevel]['counterfactual'];
  if (mainObject) {
    // addTrace(`    Loading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);


    ret = assignValue(environment, config, object, mainModel, mainObject, 'description', 'sch:description', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = await assignTimeInterval(environment, config, object, mainModel, mainObject, addMessage, form, uri, hasError, error)
    hasError = ret.hasError;
    error = ret.error;

    ret = await assignMeasure(environment, config, object, mainModel, mainObject, 'iso72Value', 'iso21972:value', addMessage, uri, hasError, error, form);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'locatedIns', 'iso21972:located_in', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;


    if (environment === 'interface') {
      await mainObject.save();
      return true
    }


    if (hasError) {
      // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
    } else if (environment === 'fileUploading'){
      // addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }
  } else {
    // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
  }
  return error;

}

module.exports = {counterfactualBuilder};