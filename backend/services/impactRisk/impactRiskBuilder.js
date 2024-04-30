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
    'impactRisk': impactRiskDict,
    'evidenceRisk': evidenceRiskDict,
    'externalRisk': externalRiskDict,
    'stakeholderParticipationRisk': stakeholderParticipationRiskDict,
    'dropOffRisk': dropOffRiskDict,
    'efficiencyRisk': efficiencyRiskDict,
    'executionRisk': executionRiskDict,
    'alignmentRisk': alignmentRiskDict,
    'enduranceRisk': enduranceRiskDict,
    'unexpectedImpactRisk': unexpectedImpactRiskDict
  }
  const GDBDict = {
    'impactRisk': GDBImpactRiskModel,
    'evidenceRisk': GDBEvidenceRiskModel,
    'externalRisk': GDBExternalRiskModel,
    'stakeholderParticipationRisk': GDBStakeholderParticipationRiskModel,
    'dropOffRisk': GDBDropOffRiskModel,
    'efficiencyRisk': GDBEfficiencyRiskModel,
    'executionRisk': GDBExecutionRiskModel,
    'alignmentRisk': GDBAlignmentRiskModel,
    'enduranceRisk': GDBEnduranceRiskModel,
    'unexpectedImpactRisk': GDBUnexpectedImpactRiskModel
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
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
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