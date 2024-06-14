const {Server400Error} = require("../../utils");
const {expand} = require("jsonld");
const {GDBOrganizationModel, GDBStakeholderOrganizationModel} = require("../../models/organization");
const {deleteOrganizationWithAllData} = require("../deleteOrganizationWithAllData");
const {organizationBuilder} = require("../organizations/organizationBuilder");
const {getFullPropertyURI, getValue, getFullTypeURIList} = require("../helpers");
const {configLevel} = require("../../config");
const {isValidURL} = require("../../helpers/validator");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBStakeholderModel} = require("../../models/stakeholder");
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
const {GDBDataSetModel} = require("../../models/dataset");
const {GDBCounterfactualModel} = require("../../models/counterfactual");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBThemeModel} = require("../../models/theme");
const {GDBCodeModel} = require("../../models/code");
const {GDBCharacteristicModel} = require("../../models/characteristic");
const {GDBStakeholderOutcomeModel} = require("../../models/stakeholderOutcome");
const {GDBImpactReportModel} = require("../../models/impactReport");
const {GDBImpactScaleModel, GDBImpactDepthModel, GDBImpactDurationModel} = require("../../models/howMuchImpact");
const {GDBUnitOfMeasure, GDBMeasureModel} = require("../../models/measure");
const {GDBDateTimeIntervalModel, GDBInstant} = require("../../models/time");
const {outcomeBuilder} = require("../outcomes/outcomeBuilder");
const {impactNormsBuilder} = require("../impactStuffs/impactNormsBuilder");
const {indicatorBuilder} = require("../indicators/indicatorBuilder");
const {indicatorReportBuilder} = require("../indicatorReport/indicatorReportBuilder");
const {stakeholderOutcomeBuilder} = require("../stakeholderOutcome/stakeholderOutcomeBuilder");
const {impactReportBuilder} = require("../impactReport/impactReportBuilder");
const {howMuchImpactBuilder} = require("../howMuchImpact/howMuchImpactBuilder");
const {counterfactualBuilder} = require("../counterfactual/counterfactualBuilder");
const {themeBuilder} = require("../theme/themeBuilder");
const {datasetBuilder} = require("../dataset/datasetBuilder");
const {characteristicBuilder} = require("../characteristic/characteristicBuilder");
const {codeBuilder} = require("../code/codeBuilder");
const {impactRiskBuilder} = require("../impactRisk/impactRiskBuilder");
const {stakeholderOrganizationBuilder} = require("../stakeholder/stakeholderOrganizationBuilder");
const {Transaction} = require("graphdb-utils");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function fileUploadingMultiSubArray(req, res, next) {
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
      // case 'addingToOrganization':
      //   messageBuffer['begin'].push(whiteSpaces + 'Adding objects to organization with URI: ' + organizationUri);
      //   messageBuffer['begin'].push(whiteSpaces + '');
      //   break;
      case 'emptyExpandedObjects':
        messageBuffer['begin'].push(whiteSpaces + title);
        messageBuffer['begin'].push(whiteSpaces + '    Please check that the file is a valid JSON-LD file and it conforms to context( for example, each object must have an @id and @type property. '
          + 'Some objects must have a @context');
        messageBuffer['begin'].push(whiteSpaces + '    Read more about JSON-LD  at: https://json-ld.org/');
        messageBuffer['begin'].push(whiteSpaces + '    Nothing was uploaded');
        break;
      case 'noOrganization':
        messageBuffer[uri].push(whiteSpaces + `    The organization is missing in the file for object${hasName ? ' ' + hasName : ''} with URI ${uri} of type ${type}`);
        if (ignoreInstance)
          messageBuffer[uri].push(whiteSpaces + '    The object is ignored');
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
      case 'blankLine':
        messageBuffer[uri].push('\n');
        break;
      case 'NoSuchImpactNorms':
        messageBuffer[uri].push(whiteSpaces + `Error: No Such ImpactNorms`);
        messageBuffer[uri].push(whiteSpaces + `   In object with URI ${uri} of type ${type}, there is no such impactNorms ${impactNormsURI} under the organization`);
        break;
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
  const getListOfValue = (object, graphdbModel, property) => {
    const ret = object[getFullURI(graphdbModel.schema[property].internalKey)].map(obj => {
      if (isValidURL(obj['@value'])) {
        return obj['@value'];
      } else {
        error += 1;
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


  async function uploadSubArray(objects) {


    let organization;
    const objectDict = {};
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
    if (!Array.isArray(objects)) {
      // the object should be an array
      error += 1;
      // addMessage(0, 'subArrayNotAList', {}, {});
      // const msg = formatMessage();
      // throw new Server400Error(msg);
      throw new Server400Error('There is a subarray which is not an array');
    }
    if (!objects.length) {
      // the objects shouldn't be empty
      // addMessage(0, 'fileEmpty', {}, {});
      // error += 1;
      // const msg = formatMessage();
      throw new Server400Error('There is a subarray which is empty');
    }

    const expandedObjects = await expand(objects);

    if (!expandedObjects.length) {
      error += 1;
      // addMessage(8, 'emptyExpandedObjects', {}, {});
      // const msg = formatMessage();
      throw new Server400Error('There is a subarray which is empty after being expanded');
    }

    // adding into dicts
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
          organization = GDBOrganizationModel({_uri: uri});
          addMessage(null, 'blankLine', {uri}, {});
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
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
          if (!object[getFullPropertyURI(GDBUnitOfMeasure, 'label')]) {
            addMessage(8, 'propertyMissing',
              {
                uri,
                type: getPrefixedURI(object['@type'][0]),
                property: getPrefixedURI(getFullPropertyURI(GDBUnitOfMeasure, 'label'))
              }, {});
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
          addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});

          if (!object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')]) {
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


    const organizationObjects = expandedObjects.filter(item => item['@type'][0] === getFullURI('cids:Organization'));
    if (organizationObjects.length !== 1) {
      if (organizationObjects.length === 0) {
        throw new Server400Error('There is a subarray doesn\'t contain organization');
      } else {
        throw new Server400Error(`The subarray with organization ${organizationObjects[0]['@id']} contains more than one organization`);
      }

    }
    const organizationUri = organizationObjects[0]["@id"];
    if (!organizationUri) {
      throw new Server400Error("There is an organization doesn't contain uri");
    }
    const existingOrganization = await GDBOrganizationModel.findOne({_uri: organizationUri});
    if (existingOrganization) {
      await deleteOrganizationWithAllData(existingOrganization, false);
    }
    error = await organizationBuilder('fileUploading', organizationObjects[0], error, {
        objectDict, organizationDict: {[organizationUri]: organization}
      },
      {addMessage, getFullPropertyURI, getValue, getListOfValue}, null, configLevel);


    // bunch of builders
    for (let object of expandedObjects) {
      let uri = object['@id'];
      if (object['@type'].includes(getFullTypeURIList(GDBOutcomeModel)[1])) {
        if (!organization) {
          delete outcomeDict[uri]; // remove the object from its dict and print out a message
          addMessage(8, 'noOrganization',
            {
              uri,
              type: getPrefixedURI(object['@type'][0])
            },
            {ignoreInstance: true});
          continue;
        }
        error = await outcomeBuilder('fileUploading', object, organization, error, {
          objectDict,
          outcomeDict,
          impactNormsDict
        }, {addMessage, getFullPropertyURI, getValue, getListOfValue}, null, configLevel);
      } else if (object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[2]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[1]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[0])) {
        if (!organization) {
          delete impactNormsDict[uri]; // remove the object from its dict and print out a message
          addMessage(8, 'noOrganization',
            {
              uri,
              type: getPrefixedURI(object['@type'][0])
            },
            {ignoreInstance: true});
          continue;
        }
        error = await impactNormsBuilder('fileUploading', object, organization, error, {impactNormsDict}, {
          addMessage,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null, configLevel);
      } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorModel)[1])) {
        if (!organization) {
          delete indicatorDict[uri]; // remove the object from its dict and print out a message
          addMessage(8, 'noOrganization',
            {
              uri,
              type: getPrefixedURI(object['@type'][0])
            },
            {ignoreInstance: true});
          continue;
        }
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
        if (!organization) {
          delete indicatorReportDict[uri]; // remove the object from its dict and print out a message
          addMessage(8, 'noOrganization',
            {
              uri,
              type: getPrefixedURI(object['@type'][0])
            },
            {ignoreInstance: true});
          continue;
        }
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
        if (!organization) {
          delete stakeholderOutcomeDict[uri]; // remove the object from its dict and print out a message
          addMessage(8, 'noOrganization',
            {
              uri,
              type: getPrefixedURI(object['@type'][0])
            },
            {ignoreInstance: true});
          continue;
        }
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
        if (!organization) {
          delete impactReportDict[uri]; // remove the object from its dict and print out a message
          addMessage(8, 'noOrganization',
            {
              uri,
              type: getPrefixedURI(object['@type'][0])
            },
            {ignoreInstance: true});
          continue;
        }
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
        if (!organization) {
          delete {
            impactScale: impactScaleDict, impactDepth: impactDepthDict, impactDuration: impactDurationDict
          }[subType][uri]; // remove the object from its dict and print out a message
          addMessage(8, 'noOrganization',
            {
              uri,
              type: getPrefixedURI(object['@type'][0])
            },
            {ignoreInstance: true});
          continue;
        }
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
      } else if (object['@type'].includes(getFullTypeURIList(GDBCounterfactualModel)[1])) {
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

    await organization.save();
    await autoSaving();

  }

  try {
    const {objects, fileName} = req.body;
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
      addMessage(0, 'fileEmpty', {}, {});
      error += 1;
      const msg = formatMessage();
      throw new Server400Error(msg);
    }


    for (const subArray of objects) {
      await uploadSubArray(subArray);
    }


    if (!error) {
      addMessage(4, 'insertData', {}, {});
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
}

module.exports = {fileUploadingMultiSubArray}