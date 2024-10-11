const {GDBThemeModel} = require("../../models/theme");
const configs = require("../fileUploading/configs");
const {assignValue, assignValues} = require("../helpers");
const {GDBThemeSubThemeNetworkModel} = require("../../models/ThemeSubThemeNetwork");
const {GDBOrganizationModel} = require("../../models/organization");

async function themeNetworkBuilder(environment, object, organization, error, {
  indicatorDict,
  objectDict
}, {
                                     addMessage,
                                     addTrace,
                                     getFullPropertyURI,
                                     getValue,
                                     getListOfValue
                                   }, form, configLevel) {
  let uri = object ? object['@id'] : undefined;
  let hasError = false;
  const mainModel = GDBThemeSubThemeNetworkModel;
  let ret;
  const mainObject = environment === 'fileUploading' ? themeDict[uri] : (form?.uri ? (await mainModel.findOne({_uri: form.uri}) || mainModel({}, {uri: form.uri})) : mainModel({}));
  if (environment === 'interface') {
    await mainObject.save();
    uri = mainObject._uri;
  }
  const config = configs[configLevel]['themeNetwork'];

  if (mainObject) {
    if (environment === 'interface') {
      organization = await GDBOrganizationModel.findOne({_uri: form.organization});
      // impactNorms = await GDBImpactNormsModel.findOne({_uri: form.impactNorms, organization: organization._uri})
      // if (!impactNorms.indicators)
      //   impactNorms.indicators = [];
      // impactNorms.indicators = [...impactNorms.indicators, uri]
    }
    mainObject.forOrganization = organization._uri;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'description', 'cids:hasDescription', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'dateCreated', 'schema:dateCreated', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    if (mainObject.dateCreated) {
      mainObject.dateCreated = new Date(mainObject.dateCreated)
    }

    ret = assignValues(environment, config, object, mainModel, mainObject, 'themeEdges', 'cids:hasEdge', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;


    if (environment === 'interface') {
      await mainObject.save();
      return true;
    }


    if (!hasError) {
      // addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }
  }
  return error;

}

module.exports = {themeNetworkBuilder}
