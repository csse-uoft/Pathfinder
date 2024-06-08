const configs = require("../fileUploading/configs");
const {GDBImpactScaleModel, GDBImpactDepthModel, GDBImpactDurationModel} = require("../../models/howMuchImpact");
const {assignValue, assignValues, assignTimeInterval, assignMeasure} = require("../helpers");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function howMuchImpactBuilder(environment, subType, object, organization, error, {
  impactScaleDict,
  impactDepthDict,
  impactDurationDict,
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
  let ret;
  let ignore;
  const GDBDict = {impactScale: GDBImpactScaleModel, impactDepth: GDBImpactDepthModel, impactDuration: GDBImpactDurationModel}
  const mainModel = GDBDict[subType];
  const objectDicts = {
  impactScale: impactScaleDict, impactDepth: impactDepthDict, impactDuration: impactDurationDict
  }
  const mainObject = environment === 'fileUploading' ? objectDicts[subType][uri] : mainModel({}, {uri: form.uri});

  if (environment === 'interface') {
    await mainObject.save();
    uri = mainObject._uri;
  }
  const config = configs[configLevel][subType];

  if (mainObject) {

    ret = assignValue(environment, config, object, mainModel, mainObject, 'indicator', 'cids:forIndicator', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;


    ret = assignValues(environment, config, object, mainModel, mainObject, 'counterfactuals', 'cids:hasCounterfactual', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    if (subType === 'impactDuration') {
      // add hasTime
      ret = assignTimeInterval(environment, config, object, mainModel, mainObject, addMessage, form, uri, hasError, error)
      hasError = ret.hasError;
      error = ret.error;
    }

    ret = assignMeasure(environment, config, object, mainModel, mainObject, 'value', 'iso21972:value', addMessage, uri, hasError, error, form);
    hasError = ret.hasError;
    error = ret.error;

    // let measureURI = getValue(object, mainModel, 'value');
    // let measureObject = getObjectValue(object, mainModel, 'value');

    // let value;
    // if (measureObject)
    //   value = getValue(measureObject, GDBMeasureModel, 'numericalValue');
    //
    // if (!measureURI && !value && config['iso21972:value'] && !form.value) {
    //   if (config['iso21972:value'].rejectFile) {
    //     if (environment === 'interface') {
    //       throw new Server400Error(`${subType} Iso21972 Value is Mandatory`);
    //     } else if (environment === 'fileUploading') {
    //       error += 1;
    //       hasError = true;
    //     }
    //   }
    //   if (environment === 'fileUploading')
    //     addMessage(8, 'propertyMissing',
    //       {
    //         uri,
    //         type: getPrefixedURI(object['@type'][0]),
    //         property: getPrefixedURI(getFullPropertyURI(mainModel, 'value'))
    //       },
    //       config['iso21972:value']
    //     );
    // } else if (measureURI || value || form?.value) {
    //   mainObject.value = measureURI ||
    //     GDBMeasureModel({
    //         numericalValue: value
    //       },
    //       {uri: measureObject['@id']});
    // }

    if (environment === 'interface') {
      await mainObject.save();
      return true
    }

    if (!ignore && !hasError && environment === 'fileUploading') {
      // addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }


  }
  return error;

}

module.exports = {howMuchImpactBuilder}