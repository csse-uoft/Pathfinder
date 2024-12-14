const {baseLevelConfig, fullLevelConfig} = require("../fileUploading/configs");
const {assignValue, getObjectValue, assignValues, getFullObjectURI, assignTimeInterval} = require("../helpers");
const configs = require("../fileUploading/configs");
const {
  GDBImpactRiskModel,
  GDBEvidenceRiskModel,
  GDBExternalRiskModel,
  GDBStakeholderParticipationRiskModel,
  GDBDropOffRiskModel,
  GDBEfficiencyRiskModel,
  GDBExecutionRiskModel,
  GDBAlignmentRiskModel,
  GDBEnduranceRiskModel,
  GDBUnexpectedImpactRiskModel
} = require("../../models/impactRisk");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function impactRiskBuilder(environment, subType, object, organization, error, {
  impactRiskDict,
  evidenceRiskDict,
  externalRiskDict,
  stakeholderParticipationRiskDict,
  dropOffRiskDict,
  efficiencyRiskDict,
  executionRiskDict,
  alignmentRiskDict,
  enduranceRiskDict,
  unexpectedImpactRiskDict,
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
  const objectDicts = {
    'impact Risk': impactRiskDict,
    'evidence Risk': evidenceRiskDict,
    'external Risk': externalRiskDict,
    'stakeholder Participation Risk': stakeholderParticipationRiskDict,
    'drop Off Risk': dropOffRiskDict,
    'efficiency Risk': efficiencyRiskDict,
    'execution Risk': executionRiskDict,
    'alignment Risk': alignmentRiskDict,
    'endurance Risk': enduranceRiskDict,
    'unexpected Impact Risk': unexpectedImpactRiskDict
  }
  const GDBDict = {
    'impact Risk': GDBImpactRiskModel,
    'evidence Risk': GDBEvidenceRiskModel,
    'external Risk': GDBExternalRiskModel,
    'stakeholder Participation Risk': GDBStakeholderParticipationRiskModel,
    'drop Off Risk': GDBDropOffRiskModel,
    'efficiency Risk': GDBEfficiencyRiskModel,
    'execution Risk': GDBExecutionRiskModel,
    'alignment Risk': GDBAlignmentRiskModel,
    'endurance Risk': GDBEnduranceRiskModel,
    'unexpected Impact Risk': GDBUnexpectedImpactRiskModel
  };
  const mainModel = GDBDict[subType];
  const mainObject = environment === 'fileUploading' ? objectDicts[subType][uri] : await GDBDict[subType].findOne({_uri: form.uri}) || mainModel({}, {uri: form.uri});

  if (environment === 'interface') {
    await mainObject.save();
    uri = mainObject._uri;
  }
  const config = configs[configLevel][subType];

  if (mainObject) {

    ret = assignValue(environment, config, object, mainModel, mainObject, 'hasIdentifier', 'tove_org:hasIdentifier', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    if (!ignore && !hasError && environment === 'fileUploading') {
      // addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }

    if (environment === 'interface') {
      await mainObject.save();
      return true;
    }

  }
  return error;

}

module.exports = {impactRiskBuilder};