const {getFullTypeURIList, getValue, getFullPropertyURI} = require("../helpers");
const {GDBOrganizationModel, GDBStakeholderOrganizationModel} = require("../../models/organization");
const {isValidURL} = require("../../helpers/validator");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBDateTimeIntervalModel, GDBInstant} = require("../../models/time");
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
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBImpactReportModel} = require("../../models/impactReport");
const {hasAccess} = require("../../helpers/hasAccess");
const {Transaction} = require("graphdb-utils");
const {Server400Error} = require("../../utils");
const {expand} = require("jsonld");
const {outcomeBuilder} = require("../outcomes/outcomeBuilder");
const {configLevel} = require("../../config");
const {GDBCounterfactualModel} = require("../../models/counterfactual");
const {counterfactualBuilder} = require("../counterfactual/counterfactualBuilder");
const {GDBDataSetModel} = require("../../models/dataset");
const {GDBThemeModel} = require("../../models/theme");
const {GDBCodeModel} = require("../../models/code");
const {GDBCharacteristicModel} = require("../../models/characteristic");
const {GDBStakeholderOutcomeModel} = require("../../models/stakeholderOutcome");
const {
  GDBImpactScaleModel,
  GDBImpactDepthModel,
  GDBImpactDurationModel,
  GDBHowMuchImpactModel
} = require("../../models/howMuchImpact");
const {GDBUnitOfMeasure, GDBMeasureModel} = require("../../models/measure");
const {organizationBuilder} = require("../organizations/organizationBuilder");
const {impactNormsBuilder} = require("../impactStuffs/impactNormsBuilder");
const {indicatorBuilder} = require("../indicators/indicatorBuilder");
const {indicatorReportBuilder} = require("../indicatorReport/indicatorReportBuilder");
const {themeBuilder} = require("../theme/themeBuilder");
const {impactRiskBuilder} = require("../impactRisk/impactRiskBuilder");
const {stakeholderOrganizationBuilder} = require("../stakeholder/stakeholderOrganizationBuilder");
const {datasetBuilder} = require("../dataset/datasetBuilder");
const {codeBuilder} = require("../code/codeBuilder");
const {characteristicBuilder} = require("../characteristic/characteristicBuilder");
const {stakeholderOutcomeBuilder} = require("../stakeholderOutcome/stakeholderOutcomeBuilder");
const {impactReportBuilder} = require("../impactReport/impactReportBuilder");
const {howMuchImpactBuilder} = require("../howMuchImpact/howMuchImpactBuilder");
const {GDBStakeholderModel} = require("../../models/stakeholder");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

// const fileUploadingMultiOrganizationHandler = async (req, res, next) => {
//   try {
//     if (await hasAccess(req, 'fileUploadingMultiOrganization')) {
//       await Transaction.beginTransaction();
//       return await fileUploadingMultiOrganization(req, res, next);
//     }
//     return res.status(400).json({message: 'Wrong Auth'});
//   } catch (e) {
//     if (Transaction.isActive())
//       await Transaction.rollback();
//     next(e);
//   }
// };

const fileUploadingMultiOrganization = async (req, res, next) => {

  let messageBuffer = {
    begin: [], end: [], noURI: []
  };
  let error = 0;

  function formatMessage() {
    let msg = '';
    messageBuffer.begin.map(sentence => {
      msg += sentence + '\n';
    });
    messageBuffer['noURI']?.map(sentence => {
      msg += sentence + '\n';
    });
    Object.keys(messageBuffer).map(uri => {
      if (uri !== 'begin' && uri !== 'end' && uri !== 'noURI') {
        messageBuffer[uri].map(sentence => {
          msg += sentence + '\n';
        });
      }
    });
    messageBuffer.end?.map(sentence => {
      msg += sentence + '\n';
    });
    return msg;
  }

  function addMessage(spaces, messageType,
                      {
                        uri,
                        fileName,
                        organizationUri,
                        type,
                        property,
                        hasName,
                        value,
                        referenceURI,
                        subjectURI,
                        error,
                        url,
                        impactNormsURI
                      }, {rejectFile, ignoreInstance, flag}) {
    let whiteSpaces = '';
    if (spaces)
      [...Array(spaces).keys()].map(() => {
        whiteSpaces += ' ';
      });
    if (uri && !messageBuffer[uri]) {
      messageBuffer[uri] = [];
    }
    let title;
    if (rejectFile) {
      title = 'Error';
    } else if (flag) {
      title = 'Warning';
    } else if (ignoreInstance) {
      title = 'Object Ignored';
    }


    switch (messageType) {
      case 'startToProcess':
        messageBuffer['begin'].push(whiteSpaces + `Loading file ${fileName}...`);
        break;
      case 'fileNotAList':
        messageBuffer['begin'].push(whiteSpaces + title);
        messageBuffer['begin'].push(whiteSpaces + 'The file should contain a list (start with [ and end with ] ) of json objects.');
        messageBuffer['begin'].push(whiteSpaces + 'Please consult the JSON-LD reference at: https://json-ld.org/');
        break;
      case 'fileEmpty':
        messageBuffer['begin'].push(whiteSpaces + title);
        messageBuffer['begin'].push(whiteSpaces + 'The file is empty');
        messageBuffer['begin'].push(whiteSpaces + 'There is nothing to upload');
        break;
      case 'addingToOrganization':
        messageBuffer['begin'].push(whiteSpaces + 'Adding objects to organization with URI: ' + organizationUri);
        messageBuffer['begin'].push(whiteSpaces + '');
        break;
      case 'emptyExpandedObjects':
        messageBuffer['begin'].push(whiteSpaces + title);
        messageBuffer['begin'].push(whiteSpaces + '    Please check that the file is a valid JSON-LD file and it conforms to context( for example, each object must have an @id and @type property. '
          + 'Some objects must have a @context');
        messageBuffer['begin'].push(whiteSpaces + '    Read more about JSON-LD  at: https://json-ld.org/');
        messageBuffer['begin'].push(whiteSpaces + '    Nothing was uploaded');
        break;
      case 'wrongOrganizationURI':
        messageBuffer['begin'].push(whiteSpaces + `${title}: Incorrect organization URI ${organizationUri}: No such Organization`);
        messageBuffer['begin'].push(whiteSpaces + '    The file failed to upload');
        break;
      case 'invalidURI':
        messageBuffer[uri].push(`\n`);
        messageBuffer[uri].push(whiteSpaces + `${title}: Invalid URI`);
        messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} has been used as an invalid URI`);
        if (ignoreInstance)
          messageBuffer[uri].push(whiteSpaces + '    The object is ignored');
        break;
      case 'duplicatedURIInFile':
        messageBuffer[uri].push(whiteSpaces + `${title}: Duplicated URI`);
        messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} has been used as an URI already in another object in this file`);
        if (ignoreInstance)
          messageBuffer[uri].push(whiteSpaces + '    The object is ignored');
        break;
      case 'NoSuchImpactNorms':
        messageBuffer[uri].push(whiteSpaces + `Error: No Such ImpactNorms`);
        messageBuffer[uri].push(whiteSpaces + `   In object with URI ${uri} of type ${type}, there is no such impactNorms ${impactNormsURI} under the organization`);

      case 'duplicatedURIInDataBase':
        messageBuffer[uri].push(whiteSpaces + `${title}: Duplicated URI`);
        messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} has been used as an URI already in another object in the sandbox`);
        if (ignoreInstance)
          messageBuffer[uri].push(whiteSpaces + '    The object is ignored');
        break;
      case 'readingMessage':
        messageBuffer[uri].push(whiteSpaces + `Reading object with URI ${uri} of type ${type}...`);
        break;
      case 'propertyMissing':
        messageBuffer[uri].push(whiteSpaces + `${title}: Mandatory property missing`);
        messageBuffer[uri].push(whiteSpaces + `    In object${hasName ? ' ' + hasName : ''} with URI ${uri} of type ${type} property ${property} is missing`);
        if (ignoreInstance)
          messageBuffer[uri].push(whiteSpaces + '    The object is ignored');
        break;
      case 'differentOrganization':
        messageBuffer['begin'].push(whiteSpaces + `${title}:`);
        messageBuffer['begin'].push(whiteSpaces + `    Organization in the file(URI: ${uri}) is different from the organization chosen in the interface(URI: ${organizationUri})`);
        break;
      case 'sameOrganization':
        messageBuffer['begin'].push(whiteSpaces + `${title}: organization object is ignored`);
        messageBuffer['begin'].push(whiteSpaces + `    Organization information can only be updated through the interface`);
        break;
      case 'unsupportedObject':
        messageBuffer['end'].push(whiteSpaces + `${title}!`);
        messageBuffer['end'].push(whiteSpaces + `    Object with URI ${uri} is being ignored: The object type is not supported`);
        break;
      case 'invalidValue':
        messageBuffer[uri].push(whiteSpaces + `${title}: Invalid URI`);
        messageBuffer[uri].push(whiteSpaces + `    In object with URI ${uri} of type ${type} attribute ${property}  contains invalid value(s): ${value}`);
        break;
      case 'badReference':
        messageBuffer[uri].push(whiteSpaces + `${title}: bad reference`);
        messageBuffer[uri].push(whiteSpaces + `    ${type} ${referenceURI} appears neither in the file nor in the sandbox`);
        break;
      case 'subjectDoesNotBelong':
        messageBuffer[uri].push(whiteSpaces + `${title}:`);
        messageBuffer[uri].push(whiteSpaces + `    ${type} ${subjectURI} does not belong to this organization`);
        break;
      case 'finishedReading':
        messageBuffer[uri].push(whiteSpaces + `Finished reading ${uri} of type ${type}...`);
        break;
      case 'insertData':
        messageBuffer['end'].push(whiteSpaces + 'Start to insert data...');
        break;
      case 'completedLoading':
        messageBuffer['end'].push(whiteSpaces + `Completed loading ${fileName}`);
        break;
      case 'errorCounting':
        messageBuffer['end'].push(whiteSpaces + `${error} error(s) found`);
        messageBuffer['end'].push(`File failed to upload`);
        break;
      case 'invalidURL':
        messageBuffer['begin'].push(whiteSpaces + `${title}: Invalid URL in context: ` + url);
        messageBuffer['end'].push(`File failed to upload`);
        break;
      case 'noURI':
        messageBuffer['noURI'].push(whiteSpaces + `${title}: No URI`);
        messageBuffer['noURI'].push(whiteSpaces + `    One object${type ? ` with type ${type}` : ''} has no URI`);
        if (ignoreInstance)
          messageBuffer['noURI'].push(whiteSpaces + '    The object is ignored');
        break;
    }
  }

  /**
   * return list of object URI
   * @param object
   * @param graphdbModel
   * @param property
   * @returns {*}
   */
  const getListOfValue = (object, graphdbModel, property) => {
    const ret = object[getFullURI(graphdbModel.schema[property].internalKey)].map(obj => {
      if (isValidURL(obj['@value'])) {
        return obj['@value'];
      } else {
        error += 1;
        addTrace('        Error: Invalid URI');
        addTrace(`            In object with URI ${object['@id']} of type ${getPrefixedURI(object['@type'][0])} attribute ${getPrefixedURI(getFullPropertyURI(graphdbModel, property))}  contains invalid value(s): ${obj['@value']}`);
        addMessage(8, 'invalidValue',
          {
            uri: object['@id'],
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(graphdbModel, property)),
            value: obj['@value']
          }, {});
      }

    });
    return ret.filter(uri => !!uri);
  };

  const organizationDict = {};
  const impactNormsDict = {};
  const outcomeDict = {};
  const themeDict = {};
  const codeDict = {};
  const stakeholderDict = {};
  const characteristicDict = {};
  const indicatorDict = {};
  const indicatorReportDict = {};
  const impactReportDict = {};
  const stakeholderOutcomeDict = {};
  const impactScaleDict = {};
  const impactDepthDict = {};
  const impactDurationDict = {};
  const counterfactualDict = {};
  const impactRiskDict = {};
  const evidenceRiskDict = {};
  const externalRiskDict = {};
  const stakeholderParticipationRiskDict = {};
  const dropOffRiskDict = {};
  const efficiencyRiskDict = {};
  const executionRiskDict = {};
  const alignmentRiskDict = {};
  const enduranceRiskDict = {};
  const unexpectedImpactRiskDict = {};
  const datasetDict = {};

  const dicts = {
    "organization": organizationDict,
    'impactNorms': impactNormsDict,
    'outcome': outcomeDict,
    'theme': themeDict,
    'code': codeDict,
    'characteristic': characteristicDict,
    'indicator': indicatorDict,
    'indicatorReport': indicatorReportDict,
    'impactReport': impactReportDict,
    'stakeholderOutcome': stakeholderOutcomeDict,
    'impactScale': impactScaleDict,
    'impactDepth': impactDepthDict,
    'impactDuration': impactDurationDict,
    'counterfactual': counterfactualDict,
    'impactRisk': impactRiskDict,
    'evidenceRisk': evidenceRiskDict,
    'externalRisk': externalRiskDict,
    'stakeholderParticipationRisk': stakeholderParticipationRiskDict,
    'dropOffRisk': dropOffRiskDict,
    'efficiencyRisk': efficiencyRiskDict,
    'executionRisk': executionRiskDict,
    'alignmentRisk': alignmentRiskDict,
    'enduranceRisk': enduranceRiskDict,
    'unexpectedImpactRisk': unexpectedImpactRiskDict,
    'stakeholder': stakeholderDict,
    'dataset': datasetDict,
  };
  const GDBModels = {
    'organization': GDBOrganizationModel,
    'impactReport': GDBImpactReportModel,
    'impactNorms': GDBImpactNormsModel,
    'outcome': GDBOutcomeModel,
    'theme': GDBThemeModel,
    'code': GDBCodeModel,
    'characteristic': GDBCharacteristicModel,
    'indicator': GDBIndicatorModel,
    'indicatorReport': GDBIndicatorReportModel,
    'stakeholderOutcome': GDBStakeholderOutcomeModel,
    'counterfactual': GDBCounterfactualModel,
    'impactRisk': GDBImpactRiskModel,
    'evidenceRisk': GDBEvidenceRiskModel,
    'externalRisk': GDBExternalRiskModel,
    'stakeholderParticipationRisk': GDBStakeholderParticipationRiskModel,
    'dropOffRisk': GDBDropOffRiskModel,
    'efficiencyRisk': GDBEfficiencyRiskModel,
    'executionRisk': GDBExecutionRiskModel,
    'alignmentRisk': GDBAlignmentRiskModel,
    'enduranceRisk': GDBEnduranceRiskModel,
    'unexpectedImpactRisk': GDBUnexpectedImpactRiskModel,
    'impactScale': GDBImpactScaleModel,
    'impactDepth': GDBImpactDepthModel,
    'impactDuration': GDBImpactDurationModel,
    'stakeholder': GDBStakeholderOrganizationModel,
    'dataset': GDBDataSetModel
  };

  try {
    const {objects, fileName} = req.body;
    const objectDict = {};
    addMessage(0, 'startToProcess', {fileName}, {});
    if (!Array.isArray(objects)) {
      // the object should be an array
      error += 1;
      addMessage(0, 'fileNotAList', {}, {});
      const msg = formatMessage();
      throw new Server400Error(msg);
    }

    if (!objects.length) {
      // the objects shouldn't be empty
      addMessage(0, 'fileEmpty', {});
      error += 1;
      const msg = formatMessage();
      throw new Server400Error(msg);
    }

    const expandedObjects = await expand(objects);

    if (!expandedObjects.length) {
      error += 1;
      addMessage(8, 'emptyExpandedObjects', {});
      const msg = formatMessage();
      throw new Server400Error(msg);
    }


    for (let object of expandedObjects) {
      const uri = object['@id'];
      if (!uri) {
        // in the case there is no URI, ignore the object
        addMessage(8, 'noURI',
          {type: object['@type'][0]}, {ignoreInstance: true});
        continue;
      } else if (!isValidURL(uri)) {
        // in the case the uri is not valid, reject the file
        addMessage(8, 'invalidURI', {uri, type: getPrefixedURI(object['@type'][0])}, {ignoreInstance: true});
        error += 1;
        continue;
      } else {
        // then the object is good to get into the dict
        objectDict[uri] = object;
        let hasError = false;
        if (object['@type'].includes(getFullTypeURIList(GDBOutcomeModel)[1])) {
          outcomeDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBOrganizationModel)[1])) {
          organizationDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderModel)[1])) {
          organizationDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBImpactRiskModel)[1])) {
          impactRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBEvidenceRiskModel)[1])) {
          evidenceRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBExternalRiskModel)[1])) {
          externalRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderParticipationRiskModel)[1])) {
          stakeholderParticipationRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBDropOffRiskModel)[1])) {
          dropOffRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBEfficiencyRiskModel)[1])) {
          efficiencyRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBExecutionRiskModel)[1])) {
          executionRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBAlignmentRiskModel)[1])) {
          alignmentRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBEnduranceRiskModel)[1])) {
          enduranceRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBUnexpectedImpactRiskModel)[1])) {
          unexpectedImpactRiskDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[2]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[1]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[0])) { // todo: may have to change the index
          impactNormsDict[uri] = {_uri: uri};
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorModel)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          indicatorDict[uri] = {_uri: uri};
        } else if (object['@type'].includes(getFullTypeURIList(GDBDataSetModel)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          datasetDict[uri] = {_uri: uri};
        } else if (object['@type'].includes(getFullTypeURIList(GDBCounterfactualModel)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          counterfactualDict[uri] = {_uri: uri};
        } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorReportModel)[1])) {
          addMessage(4, 'readingMessage',
            {uri, type: getPrefixedURI(object['@type'][0])}, {});
          indicatorReportDict[uri] = {_uri: uri};

        } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderOrganizationModel)[1])) {
          addMessage(4, 'readingMessage',
            {uri, type: getPrefixedURI(object['@type'][0])}, {});
          stakeholderDict[uri] = {_uri: uri};

        } else if (object['@type'].includes(getFullTypeURIList(GDBThemeModel)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          themeDict[uri] = {_uri: uri};
        } else if (object['@type'].includes(getFullTypeURIList(GDBCodeModel)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          codeDict[uri] = {_uri: uri};
        } else if (object['@type'].includes(getFullTypeURIList(GDBCharacteristicModel)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          characteristicDict[uri] = {_uri: uri};
        } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderOutcomeModel)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          stakeholderOutcomeDict[uri] = {_uri: uri};
        } else if (object['@type'].includes(getFullTypeURIList(GDBImpactReportModel)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          impactReportDict[uri] = await GDBImpactReportModel.findOne({_uri: uri}) || {_uri: uri};
        } else if (object['@type'].includes(getFullURI(GDBImpactScaleModel.schemaOptions.rdfTypes[2]))) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          impactScaleDict[uri] = {_uri: uri}; // todo: to be fixed, should be in separate dicts
        } else if (object['@type'].includes(getFullURI(GDBImpactDepthModel.schemaOptions.rdfTypes[2]))) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          impactDepthDict[uri] = {_uri: uri};
        } else if (object['@type'].includes(getFullURI(GDBImpactDurationModel.schemaOptions.rdfTypes[2]))) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          impactDurationDict[uri] = {_uri: uri};
        } else if (object['@type'].includes(getFullTypeURIList(GDBUnitOfMeasure)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])});
          if (!object[getFullPropertyURI(GDBUnitOfMeasure, 'label')]) {
            addMessage(8, 'propertyMissing',
              {
                uri,
                type: getPrefixedURI(object['@type'][0]),
                property: getPrefixedURI(getFullPropertyURI(GDBUnitOfMeasure, 'label'))
              });
            error += 1;
            hasError = true;
          }
          if (!hasError) {
            const unitOfMeasure = GDBUnitOfMeasure({
              label: getValue(object, GDBUnitOfMeasure, 'label')
            }, {uri: uri});
            await unitOfMeasure.save();
          }
        } else if (object['@type'].includes(getFullTypeURIList(GDBMeasureModel)[1])) {
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});

          if (!object[getFullPropertyURI(GDBMeasureModel, 'numericalValue')]) {
            addMessage(8, 'propertyMissing',
              {
                uri,
                type: getPrefixedURI(object['@type'][0]),
                property: getPrefixedURI(getFullPropertyURI(GDBMeasureModel, 'numericalValue'))
              }, {});
            error += 1;
            hasError = true;
          }
          if (!hasError) {
            const measure = GDBMeasureModel({
              numericalValue: getValue(object, GDBMeasureModel, 'numericalValue')
            }, {uri: uri});
            await measure.save();
          }

        } else if (object['@type'].includes(getFullTypeURIList(GDBDateTimeIntervalModel)[1])) {

          addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});

          if (!object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')]) {
            addTrace('        Error: Mandatory property missing');
            addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning'))} is missing`);
            addMessage(8, 'propertyMissing',
              {
                uri,
                type: getPrefixedURI(object['@type'][0]),
                property: getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning'))
              }, {});
            error += 1;
            hasError = true;
          }

          if (!object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')]) {
            addTrace('        Error: Mandatory property missing');
            addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd'))} is missing`);
            addMessage(8, 'propertyMissing',
              {
                uri,
                type: getPrefixedURI(object['@type'][0]),
                property: getPrefixedURI(getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd'))
              }, {});
            error += 1;
            hasError = true;
          }

          if (!hasError) {
            const dateTimeInterval = GDBDateTimeIntervalModel({
              hasBeginning: getValue(object, GDBDateTimeIntervalModel, 'hasBeginning') ||
                GDBInstant({
                  date: new Date(getValue(object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0],
                    GDBInstant, 'date')
                  )
                }),
              hasEnd: getValue(object, GDBDateTimeIntervalModel, 'hasEnd') ||
                GDBInstant({
                  date: new Date(getValue(object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0],
                    GDBInstant, 'date')
                  )
                })
            }, {uri: uri});
            await dateTimeInterval.save();
          }

        } else {
          addMessage(8, 'unsupportedObject', {uri}, {flag: true});
        }
      }
    }
    const organizedObjects = {unorganizedObjects: [...expandedObjects]};
    const object2Organization = {};


    /**
     * a recursive function continuously go through all unOrganized objects and organization them in the
     * list to indicates which organization they belong to
     * if there is a recursive call happens that nothing is organized, return done
     */
    const organizeObjects = (organizedObjects) => {
      const unOrganizedObjects = organizedObjects.unorganizedObjects;
      const unOrganizedNumber = unOrganizedObjects.length;

      const checkLinkingItemsOrganizations = (object, linking) => {
        const targetItemsOrganizations = object[getFullURI(linking)]?.map(indicator => object2Organization[indicator['@value']]);
        if (targetItemsOrganizations && targetItemsOrganizations.length > 0 && targetItemsOrganizations.every(element => element === targetItemsOrganizations[0])) {
          // see the organizations of all indicators this outcome links to, if they are all same, the outcome is belongs to that one
          return targetItemsOrganizations[0];
        } // if not true, the organization which the outcome belongs to is not decidable
      };
      let unOrganizedObjectsAfterRound = [];
      for (const object of unOrganizedObjects) {
        const uri = object['@id'];
        let targetOrganizationId = null;
        if (object['@type'].includes(getFullTypeURIList(GDBOrganizationModel)[1])) {
          targetOrganizationId = uri;
        } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderModel)[1])) {
          targetOrganizationId = uri;
        } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorReportModel)[1])) {
          targetOrganizationId = object[getFullURI('cids:forOrganization')]?.[0]['@value'];
        } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorModel)[1])) {
          targetOrganizationId = checkLinkingItemsOrganizations(object, 'cids:hasIndicatorReport');
        } else if (object['@type'].includes(getFullTypeURIList(GDBOutcomeModel)[1])) {
          targetOrganizationId = checkLinkingItemsOrganizations(object, 'cids:hasIndicator');
        } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderOutcomeModel)[1])) {
          targetOrganizationId = checkLinkingItemsOrganizations(object, 'cids:forOutcome');
        } else if (object['@type'].includes(getFullTypeURIList(GDBImpactReportModel)[1])) {
          targetOrganizationId = object[getFullURI('cids:forOrganization')]?.[0]['@value'];
        } else if (object['@type'].includes(getFullURI(GDBImpactScaleModel.schemaOptions.rdfTypes[2])) ||
          object['@type'].includes(getFullURI(GDBImpactDepthModel.schemaOptions.rdfTypes[2])) ||
          object['@type'].includes(getFullURI(GDBImpactDurationModel.schemaOptions.rdfTypes[2]))) {
          targetOrganizationId = checkLinkingItemsOrganizations(object, 'cids:forIndicator');
        }
        // todo: other type of objects in essential level
        if (targetOrganizationId) {
          // the object belongs to the organization targetOrganizationId
          if (!organizedObjects[targetOrganizationId]) {
            organizedObjects[targetOrganizationId] = [];
          }
          organizedObjects[targetOrganizationId] = [...organizedObjects[targetOrganizationId], object];
          object2Organization[uri] = targetOrganizationId;
        } else {
          // the object is not decidable on this round
          unOrganizedObjectsAfterRound = [...unOrganizedObjectsAfterRound, object];
        }
      }
      organizedObjects.unorganizedObjects = [...unOrganizedObjectsAfterRound];
      if (organizedObjects.unorganizedObjects.length === 0) { // if all things are organized
        return;
      }
      if (unOrganizedNumber === organizedObjects.unorganizedObjects.length) { // nothing has been organized in this round, means no further organization can be done
        return;
      } else {
        return organizeObjects(organizedObjects); // continuously do recursive call to organize objects
      }
    };

    organizeObjects(organizedObjects);
    const orphanObjects = organizedObjects.unorganizedObjects.filter(object => ['cids:Outcome', 'cids:Indicator', 'cids:IndicatorReport'].map(prefixedURI => getFullURI(prefixedURI)).includes(object['@type'][0]));
    if (orphanObjects.length > 0) {
      // if there is above types of items are unorganized, the file should be rejected
      console.log('issue');
      throw new Server400Error('there are items cannot be figured which organization it is belonged to');
      // todo: ask Daniela, what does she or Sharad want to see when there is object not belows to the organization
    }

    const loadDataOfAnOrganization = async (organizationData, organizationUri, error) => {
      // fetch all organizations belongs to the organization
      const organizationObjects = organizationData.filter(item => item['@type'][0] === getFullURI('cids:Organization') || item['@type'][0] === getFullURI('cids:Stakeholder'));
      let organization;
      if (!organizationObjects.length) {
        // if there is no such organization in the file, fetch the organization
        organization = await GDBOrganizationModel.findOne({_uri: organizationUri});
        if (organization) {
          organizationDict[organizationUri] = organization;
        } else {
          // in this case, the organization is neither in the file nor in the database
          throw new Server400Error(`Organization with URI ${organizationUri} is neither in the database nor in the file`)
        }

      } else {
        // otherwise, create an organization based on the data in the file
        error = await organizationBuilder('fileUploading', organizationObjects[0], error, {
            objectDict,
            organizationDict
          },
          {addMessage, getFullPropertyURI, getValue, getListOfValue}, null, configLevel);
        organization = organizationDict[organizationUri];
      }
      for (let object of organizationData) {
        if (object['@type'].includes(getFullTypeURIList(GDBOutcomeModel)[1])) {
          error = await outcomeBuilder('fileUploading', object, organization, error, {
            objectDict,
            outcomeDict,
            impactNormsDict
          }, {addMessage, getFullPropertyURI, getValue, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[2]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[1]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[0])) {
          error = await impactNormsBuilder('fileUploading', object, organization, error, {impactNormsDict}, {
            addMessage,
            getFullPropertyURI,
            getValue,
            getListOfValue
          }, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorModel)[1])) {
          error = await indicatorBuilder('fileUploading', object, organization, error, {
            indicatorDict,
            objectDict
          }, {
            addMessage,
            getFullPropertyURI,
            getValue,
            getListOfValue
          }, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorReportModel)[1])) {
          error = await indicatorReportBuilder('fileUploading', object, organization, error, {
            indicatorDict,
            indicatorReportDict,
            objectDict
          }, {
            addMessage,
            getFullPropertyURI,
            getValue,
            getListOfValue
          }, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderOutcomeModel)[1])) {
          error = await stakeholderOutcomeBuilder('fileUploading', object, organization, error, {
            outcomeDict,
            stakeholderOutcomeDict,
            objectDict
          }, {
            addMessage,
            getFullPropertyURI,
            getValue,
            getListOfValue
          }, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBImpactReportModel)[1])) {
          error = await impactReportBuilder('fileUploading', object, organization, error, {
            stakeholderOutcomeDict,
            impactReportDict,
            objectDict
          }, {
            addMessage,
            getFullPropertyURI,
            getValue,
            getListOfValue
          }, null, configLevel);
        } else if (object['@type'].includes(getFullURI(GDBImpactScaleModel.schemaOptions.rdfTypes[2])) ||
          object['@type'].includes(getFullURI(GDBImpactDepthModel.schemaOptions.rdfTypes[2])) ||
          object['@type'].includes(getFullURI(GDBImpactDurationModel.schemaOptions.rdfTypes[2]))) {
          const subType = object['@type'].includes(getFullURI(GDBImpactScaleModel.schemaOptions.rdfTypes[2])) ? 'impactScale' : (object['@type'].includes(getFullURI(GDBImpactDepthModel.schemaOptions.rdfTypes[2])) ? 'impactDepth' : 'impactDuration');
          error = await howMuchImpactBuilder('fileUploading', subType, object, organization, error, {
            impactDepthDict,
            impactDurationDict,
            impactScaleDict,
            objectDict
          }, {
            addMessage,
            getFullPropertyURI,
            getValue,
            getListOfValue
          }, null, configLevel);
        }
      }


      return error;
    };

    const loadDataOfOtherObjects = async (error) => {
      for (let object of organizedObjects.unorganizedObjects) {
        if (object['@type'].includes(getFullTypeURIList(GDBCounterfactualModel)[1])) {
          error = await counterfactualBuilder('fileUploading', object, null, error, {
            counterfactualDict,
            objectDict
          }, {addMessage, getFullPropertyURI, getValue, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBThemeModel)[1])) {
          error = await themeBuilder('fileUploading', object, error, {themeDict}, {
            addMessage,
            getFullPropertyURI,
            getValue,
            getListOfValue
          }, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBDataSetModel)[1])) {
          error = await datasetBuilder('fileUploading', object, null, error, {
            datasetDict,
            objectDict
          }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBCharacteristicModel)[1])) {
          error = await characteristicBuilder('fileUploading', object, error, {characteristicDict}, {
            addMessage,
            getFullPropertyURI,
            getValue,
            getListOfValue
          }, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBCodeModel)[1])) {
          error = await codeBuilder('fileUploading', object, null, error, {codeDict}, {
            addMessage,
            getFullPropertyURI,
            getValue,
            getListOfValue
          }, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBImpactRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'impactRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBEvidenceRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'evidenceRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBExternalRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'externalRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderParticipationRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'stakeholderParticipationRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBDropOffRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'dropOffRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBEfficiencyRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'efficiencyRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBExecutionRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'executionRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBAlignmentRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'alignmentRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBEnduranceRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'enduranceRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBUnexpectedImpactRiskModel)[1])) {
          error = await impactRiskBuilder('fileUploading', 'unexpectedImpactRisk', object, null, error,
            {
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
            }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderOrganizationModel)[1])) {
          error = await stakeholderOrganizationBuilder('fileUploading', object, null, error, {
            stakeholderDict,
            objectDict,
            impactNormsDict
          }, {addMessage, getValue, getFullPropertyURI, getListOfValue}, null, configLevel);
        }
      }
    };

    for (let organizationUri in organizedObjects) {
      if (organizationUri !== 'unorganizedObjects') {
        error = await loadDataOfAnOrganization(organizedObjects[organizationUri], organizationUri, error);
      } else {
        // handling the objects doesn't belong to any organization
        error = await loadDataOfOtherObjects(error);
      }
    }

    if (!error) {
      addMessage(4, 'insertData', {}, {});

      async function autoSaving() {
        for (let key in dicts) {
          const dict = dicts[key];
          const GDBObjects = Object.entries(dict).map(([uri, object]) => {
            return GDBModels[key](
              object, {_uri: object._uri}
            );
          });
          await Promise.all(GDBObjects.map(object => object.save()));
        }
      }

      await autoSaving();
      await Transaction.commit();
      addMessage(0, 'completedLoading', {fileName}, {});
      const msg = formatMessage();
      return res.status(200).json({success: true, traceOfUploading: msg});
    } else {
      addMessage(0, 'errorCounting', {error}, {});
      const msg = formatMessage();
      await Transaction.rollback();
      throw new Server400Error(msg);
    }

  } catch (e) {
    if (Transaction.isActive())
      await Transaction.rollback();
    if (e.name === 'jsonld.InvalidUrl') {
      addMessage(4, 'invalidURL', {url: e.details.url}, {});
      e.message = formatMessage();
    }
    next(e);
  }


};


module.exports = {fileUploadingMultiOrganization};