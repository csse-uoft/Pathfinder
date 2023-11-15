const {baseLevelConfig, fullLevelConfig} = require("../fileUploading/configs");
const {GDBImpactScaleModel, GDBImpactDepthModel, GDBImpactDurationModel} = require("../../models/howMuchImpact");
const {assignValue, getObjectValue, assignValues, getFullObjectURI, assignTimeInterval} = require("../helpers");
const {GDBMeasureModel} = require("../../models/measure");
const {Server400Error} = require("../../utils");
const {GDBDateTimeIntervalModel, GDBInstant} = require("../../models/time");
const {Transaction} = require("graphdb-utils");
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
                                         }, form) {

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
  mainObject.subType = subType

  if (environment === 'interface') {
    await mainObject.save();
    uri = mainObject._uri;
  }
  const config = fullLevelConfig[subType];

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

    let measureURI = getValue(object, mainModel, 'value');
    let measureObject = getObjectValue(object, mainModel, 'value');

    let value;
    if (measureObject)
      value = getValue(measureObject, GDBMeasureModel, 'numericalValue');

    if (!measureURI && !value && config['iso21972:value'] && !form.value) {
      if (config['iso21972:value'].rejectFile) {
        if (environment === 'interface') {
          throw new Server400Error(`${subType} Iso21972 Value is Mandatory`);
        } else if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'value'))
          },
          config['iso21972:value']
        );
    } else if (measureURI || value || form?.value) {
      mainObject.value = measureURI ||
        GDBMeasureModel({
            numericalValue: value
          },
          {uri: measureObject['@id']});
    }
    if (!ignore && !hasError && environment === 'fileUploading') {
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }

    if (environment === 'interface') {
      await mainObject.save();
      await Transaction.commit();
      return true
    }

  }
  return error;

}

module.exports = {howMuchImpactBuilder}