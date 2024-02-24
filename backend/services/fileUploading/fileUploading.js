const {hasAccess} = require("../../helpers/hasAccess");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBOrganizationModel, GDBStakeholderOrganizationModel} = require("../../models/organization");
const {GDBThemeModel} = require("../../models/theme");
const {Server400Error} = require("../../utils");
const {GDBIndicatorModel} = require("../../models/indicator");
const {expand} = require('jsonld');
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBUnitOfMeasure, GDBMeasureModel} = require("../../models/measure");
const {GDBDateTimeIntervalModel, GDBInstant} = require("../../models/time");
const {isValidURL} = require("../../helpers/validator");
const {GraphDB, Transaction} = require("graphdb-utils");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;
const {outcomeBuilder} = require("../outcomes/outcomeBuilder");
const {getFullPropertyURI, getValue, getObjectValue, getFullTypeURIList} = require("../helpers")
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {themeBuilder} = require("../theme/themeBuilder");
const {GDBCodeModel} = require("../../models/code");
const {codeBuilder} = require("../code/codeBuilder");
const {GDBCharacteristicModel} = require("../../models/characteristic");
const {characteristicBuilder} = require("../characteristic/characteristicBuilder");
const {indicatorReportBuilder} = require("../indicatorReport/indicatorReportBuilder");
const {indicatorBuilder} = require("../indicators/indicatorBuilder");
const {GDBStakeholderOutcomeModel} = require("../../models/stakeholderOutcome");
const {GDBImpactReportModel} = require("../../models/impactReport");
const {stakeholderOutcomeBuilder} = require("../stakeholderOutcome/stakeholderOutcomeBuilder");
const {impactNormsBuilder} = require("../impactStuffs/impactNormsBuilder");
const {impactReportBuilder} = require("../impactReport/impactReportBuilder");
const {GDBImpactDepthModel, GDBImpactScaleModel, GDBImpactDurationModel} = require("../../models/howMuchImpact");
const {howMuchImpactBuilder} = require("../howMuchImpact/howMuchImpactBuilder");
const {GDBCounterfactualModel} = require("../../models/counterfactual");
const {counterfactualBuilder} = require("../counterfactual/counterfactualBuilder");
const {GDBImpactRiskModel, GDBEvidenceRiskModel, GDBExternalRiskModel, GDBStakeholderParticipationRiskModel,
  GDBDropOffRiskModel, GDBEfficiencyRiskModel, GDBExecutionRiskModel, GDBAlignmentRiskModel, GDBEnduranceRiskModel,
  GDBUnexpectedImpactRiskModel
} = require("../../models/impactRisk");
const {impactRiskBuilder} = require("../impactRisk/impactRiskBuilder");
const {stakeholderOrganizationBuilder} = require("../stakeholder/stakeholderOrganizationBuilder");
const {GDBDataSetModel} = require("../../models/dataset");
const {datasetBuilder} = require("../dataset/datasetBuilder");

const fileUploadingHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fileUploading')) {
      await Transaction.beginTransaction();
      return await fileUploading(req, res, next);
    }
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
    await Transaction.rollback();
    next(e);
  }
};



const fileUploading = async (req, res, next) => {
  try {
    const objectDict = {};
    const impactNormsDict = {};
    const outcomeDict = {};
    const themeDict = {};
    const codeDict = {};
    const stakeholderDict = {}
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
    const datasetDict ={};


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
    }
    const GDBModels = {
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
    }

    let messageBuffer = {
      begin: [], end: [], noURI: []
    };
    let traceOfUploading = '';
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
        title = 'Object Ignored'
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

    function addTrace(message) {
      console.log(message);
      traceOfUploading += message + '\n';
    }


    const {objects, organizationUri, fileName} = req.body;
    addTrace(`Loading file ${fileName}...`);
    addMessage(0, 'startToProcess', {fileName}, {});
    if (!Array.isArray(objects)) {
      // the object should be an array
      addTrace('Error');
      addTrace('The file should contain a list (start with [ and end with ] ) of json objects.');
      addTrace('Please consult the JSON-LD reference at: https://json-ld.org/');
      error += 1;
      addMessage(0, 'fileNotAList', {}, {});
      const msg = formatMessage();
      throw new Server400Error(msg);
    }
    if (!objects.length) {
      // the objects shouldn't be empty
      addTrace('Warning!');
      addTrace('The file is empty');
      addTrace('There is nothing to upload ');
      addMessage(0, 'fileEmpty', {});
      error += 1;
      const msg = formatMessage();
      throw new Server400Error(msg);
    }
    addTrace('    Adding objects to organization with URI: ' + organizationUri);
    addTrace('');
    addMessage(4, 'addingToOrganization', {organizationUri}, {});

    const expandedObjects = await expand(objects);

    if (!expandedObjects.length) {
      addTrace('        Warning!');
      // addTrace('Got an empty list from json-ld expanded function...');
      addTrace('            Please check that the file is a valid JSON-LD file and it conforms to context( for example, each object must have an @id and @type property. ' +
        'Some objects must have a @context');
      addTrace('            Read more about JSON-LD  at: https://json-ld.org/');
      addTrace('            Nothing was uploaded');
      error += 1;
      addMessage(8, 'emptyExpandedObjects', {});
      const msg = formatMessage();
      throw new Server400Error(msg);
    }


    const organization = await GDBOrganizationModel.findOne({_uri: organizationUri}, {populates: ['hasOutcomes']});

    if (!organization) {
      addTrace('        Error: Incorrect organization URI: No such Organization');
      addTrace('            The file failed to upload');
      addMessage(8, 'wrongOrganizationURI', {organizationUri});
      const msg = formatMessage();
      throw new Server400Error(msg);
    }

    for (let object of expandedObjects) {
      // store the raw object into objectDict
      const uri = object['@id'];
      if (!uri) {
        // in the case there is no URI
        // error += 1;
        if (object['@type'].includes(getFullTypeURIList(GDBOrganizationModel)[1])) {
          addMessage(8, 'noURI',
            {type: object['@type'][0]}, {rejectFile: true});
          error += 1
        } else {
          addMessage(8, 'noURI',
            {type: object['@type'][0]}, {ignoreInstance: true});
        }
        continue;
      }
      if (!isValidURL(uri)) {
        addTrace('        Error: Invalid URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} has been used as an invalid URI`);
        addMessage(8, 'invalidURI', {uri, type: getPrefixedURI(object['@type'][0])}, {ignoreInstance: true});
        error += 1
        continue;
      }
      if (objectDict[uri]) {
        // duplicated uri in the file
        addTrace('        Error: Duplicated URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} has been used as an URI already in another object in this file`);
        addMessage(8, 'duplicatedURIInFile', {uri, type: getPrefixedURI(object['@type'][0])}, {ignoreInstance: true});
        error += 1
        continue;
      }
      if (await GraphDB.isURIExisted(uri) && !object['@type'].includes(getFullTypeURIList(GDBOrganizationModel)[1]) && !object['@type'].includes(getFullTypeURIList(GDBStakeholderOrganizationModel)[1]) ) {
        // check whether the uri belongs to other objects
        // duplicated uri in database
        // todo: on this part, future changing is needed, the object is being updated, flags can be used to show those items should be changed
        addTrace('        Error: Duplicated URI');
        addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} has been used as an URI already in another object in the sandbox`);
        addMessage(8, 'duplicatedURIInDataBase', {
          uri,
          type: getPrefixedURI(object['@type'][0])
        }, {ignoreInstance: true});
        error += 1
        continue;
      }

      objectDict[uri] = object;
      // assign the object an id and store them into specific dict
      let hasError = false;
      let hasName = null;
      if (object['@type'].includes(getFullTypeURIList(GDBOutcomeModel)[1])) {
        outcomeDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBImpactRiskModel)[1])) {
        impactRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBEvidenceRiskModel)[1])) {
        evidenceRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBExternalRiskModel)[1])) {
        externalRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderParticipationRiskModel)[1])) {
        stakeholderParticipationRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBDropOffRiskModel)[1])) {
        dropOffRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBEfficiencyRiskModel)[1])) {
        efficiencyRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBExecutionRiskModel)[1])) {
        executionRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBAlignmentRiskModel)[1])) {
        alignmentRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBEnduranceRiskModel)[1])) {
        enduranceRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBUnexpectedImpactRiskModel)[1])) {
        unexpectedImpactRiskDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[2]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[1]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[0])) { // todo: may have to change the index
        impactNormsDict[uri] = {_uri: uri};
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
      } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorModel)[1])) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        indicatorDict[uri] = {_uri: uri};
      } else if (object['@type'].includes(getFullTypeURIList(GDBDataSetModel)[1])) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        datasetDict[uri] = {_uri: uri};
      } else if (object['@type'].includes(getFullTypeURIList(GDBCounterfactualModel)[1])) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        counterfactualDict[uri] = {_uri: uri};
      } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorReportModel)[1])) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage',
          {uri, type: getPrefixedURI(object['@type'][0])}, {});
        indicatorReportDict[uri] = {_uri: uri};

      } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderOrganizationModel)[1])) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage',
          {uri, type: getPrefixedURI(object['@type'][0])}, {});
        stakeholderDict[uri] = {_uri: uri};

      } else if (object['@type'].includes(getFullTypeURIList(GDBThemeModel)[1])) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        themeDict[uri] = {_uri: uri};

      } else if (object['@type'].includes(getFullTypeURIList(GDBCodeModel)[1])) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        codeDict[uri] = {_uri: uri};

      } else if (object['@type'].includes(getFullTypeURIList(GDBCharacteristicModel)[1])) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        characteristicDict[uri] = {_uri: uri};

      } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderOutcomeModel)[1])) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        stakeholderOutcomeDict[uri] = {_uri: uri};
      } else if (object['@type'].includes(getFullTypeURIList(GDBImpactReportModel)[1])) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        impactReportDict[uri] = {_uri: uri};
      } else if (object['@type'].includes(getFullURI(GDBImpactScaleModel.schemaOptions.rdfTypes[2]))) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        impactScaleDict[uri] = {_uri: uri}; // todo: to be fixed, should be in separate dicts
      } else if (object['@type'].includes(getFullURI(GDBImpactDepthModel.schemaOptions.rdfTypes[2]))) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        impactDepthDict[uri] = {_uri: uri};
      } else if (object['@type'].includes(getFullURI(GDBImpactDurationModel.schemaOptions.rdfTypes[2]))) {
        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});
        impactDurationDict[uri] = {_uri: uri};
      }else if (object['@type'].includes(getFullTypeURIList(GDBUnitOfMeasure)[1])) {

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])});

        if (!object[getFullPropertyURI(GDBUnitOfMeasure, 'label')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} property ${getPrefixedURI(getFullPropertyURI(GDBUnitOfMeasure, 'label'))} is missing`);
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

        addTrace(`    Reading object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
        addMessage(4, 'readingMessage', {uri, type: getPrefixedURI(object['@type'][0])}, {});

        if (!object[getFullPropertyURI(GDBMeasureModel, 'numericalValue')]) {
          addTrace('        Error: Mandatory property missing');
          addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} ${getPrefixedURI(getFullPropertyURI(GDBMeasureModel, 'numericalValue'))} is missing`);
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

        // if (!object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')] ||
        //   !object[getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')]) {
        //   addTrace('        Error: Mandatory property missing');
        //   addTrace(`            In object with URI ${uri} of type ${getPrefixedURI(object['@type'][0])} hasBeginning and hasEnd is mandatory`);
        //   error += 1;
        //   hasError = true;
        // }

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

      } else if (object['@type'].includes(getFullTypeURIList(GDBOrganizationModel)[1])) {
        if (object['@id'] !== organizationUri) {
          addTrace('        Error:');
          addTrace('             Organization in the file is different from the organization chosen in the interface');
          addMessage(8, 'differentOrganization',
            {uri, organizationUri}, {rejectFile: true});
          error += 1;

        } else {
          addTrace(`        Warning: organization object is ignored`);
          addTrace(`            Organization information can only be updated through the interface`);
          addMessage(8, 'sameOrganization', {uri}, {flag: true});
        }

      } else {
        addTrace('        Warning!');
        addTrace(`            Object with URI ${uri} is being ignored: The object type is not supported`);
        addMessage(8, 'unsupportedObject', {uri}, {flag: true});
      }
    }


    for (let [uri, object] of Object.entries(objectDict)) {
      if (object['@type'].includes(getFullTypeURIList(GDBOutcomeModel)[1])) {
        error = await outcomeBuilder('fileUploading', object, organization, error, {objectDict, outcomeDict, impactNormsDict}, {addMessage, addTrace, getFullPropertyURI, getValue, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBCounterfactualModel)[1])) {
        error = await counterfactualBuilder('fileUploading', object, organization, error, {counterfactualDict, objectDict}, {addMessage, addTrace, getFullPropertyURI, getValue, getListOfValue});
      } else if (object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[2]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[1]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[0])) {
        error = await impactNormsBuilder('fileUploading', object, organization, error, {impactNormsDict}, {addMessage, addTrace, getFullPropertyURI, getValue, getListOfValue})
      } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorModel)[1])) {
        error = await indicatorBuilder('fileUploading', object, organization, error, {
          indicatorDict,
          objectDict
        }, {
          addMessage,
          addTrace,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBIndicatorReportModel)[1])) {
        error = await indicatorReportBuilder('fileUploading', object, organization, error, {
          indicatorDict,
          indicatorReportDict,
          objectDict
        }, {
          addMessage,
          addTrace,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBThemeModel)[1])) {
        error = await themeBuilder('fileUploading', object, error, {themeDict}, {
          addMessage,
          addTrace,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBImpactRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','impactRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBEvidenceRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','evidenceRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
        } else if (object['@type'].includes(getFullTypeURIList(GDBExternalRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','externalRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderParticipationRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','stakeholderParticipationRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBDropOffRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','dropOffRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBEfficiencyRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','efficiencyRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBExecutionRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','executionRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBAlignmentRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','alignmentRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBEnduranceRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','enduranceRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBUnexpectedImpactRiskModel)[1])) {
        error = await impactRiskBuilder('fileUploading','unexpectedImpactRisk', object, organization, error,
          {impactRiskDict, evidenceRiskDict, externalRiskDict, stakeholderParticipationRiskDict, dropOffRiskDict, efficiencyRiskDict, executionRiskDict, alignmentRiskDict, enduranceRiskDict, unexpectedImpactRiskDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderOrganizationModel)[1])) {
        error = await stakeholderOrganizationBuilder('fileUploading', object, organization, error, {stakeholderDict, objectDict, impactNormsDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null)
      } else if (object['@type'].includes(getFullTypeURIList(GDBDataSetModel)[1])) {
        error = await datasetBuilder('fileUploading', object, organization, error, {datasetDict, objectDict}, {addMessage, addTrace, getValue, getFullPropertyURI, getListOfValue}, null)
      } else if (object['@type'].includes(getFullTypeURIList(GDBCodeModel)[1])) {
        error = await codeBuilder('fileUploading',object,organization, error, {codeDict}, {
          addMessage,
          addTrace,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBCharacteristicModel)[1])) {
        error = await characteristicBuilder('fileUploading', object, error, {characteristicDict}, {
          addMessage,
          addTrace,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBStakeholderOutcomeModel)[1])) {
        error = await stakeholderOutcomeBuilder('fileUploading', object, organization, error, {outcomeDict, stakeholderOutcomeDict, objectDict}, {
          addMessage,
          addTrace,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullTypeURIList(GDBImpactReportModel)[1])) {
        error = await impactReportBuilder('fileUploading', object, organization, error, {stakeholderOutcomeDict,impactReportDict, objectDict}, {
          addMessage,
          addTrace,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      } else if (object['@type'].includes(getFullURI(GDBImpactScaleModel.schemaOptions.rdfTypes[2])) ||
        object['@type'].includes(getFullURI(GDBImpactDepthModel.schemaOptions.rdfTypes[2])) ||
          object['@type'].includes(getFullURI(GDBImpactDurationModel.schemaOptions.rdfTypes[2]))) {
        const subType = object['@type'].includes(getFullURI(GDBImpactScaleModel.schemaOptions.rdfTypes[2]))? 'impactScale' : (object['@type'].includes(getFullURI(GDBImpactDepthModel.schemaOptions.rdfTypes[2]))? 'impactDepth':'impactDuration')
        error = await howMuchImpactBuilder('fileUploading', subType, object, organization, error, {impactDepthDict, impactDurationDict, impactScaleDict, objectDict}, {
          addMessage,
          addTrace,
          getFullPropertyURI,
          getValue,
          getListOfValue
        }, null);
      }
    }

    if (!error) {
      addTrace('    Start to insert data...');
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
      // const indicators = Object.entries(indicatorDict).map(([uri, indicator]) => {
      //   return GDBIndicatorModel(
      //     indicator, {_uri: indicator._uri}
      //   );
      // });
      //
      // await Promise.all(indicators.map(indicator => indicator.save()));
      //
      // const codes = Object.entries(codeDict).map(([uri, code]) => {
      //   return GDBCodeModel(
      //     code, {_uri: code._uri}
      //   );
      // })
      // await Promise.all(codes.map(code => code.save()));
      //
      // const characteristics = Object.entries(characteristicDict).map(([uri, characteristic]) => {
      //   return GDBCharacteristicModel(
      //     characteristic, {_uri: characteristic._uri}
      //   );
      // })
      // await Promise.all(characteristics.map(characteristic => characteristic.save()));
      //
      // const outcomes = Object.entries(outcomeDict).map(([uri, outcome]) => {
      //   return GDBOutcomeModel(
      //     outcome, {_uri: outcome._uri}
      //   );
      // });
      // await Promise.all(outcomes.map(outcome => outcome.save()));
      //
      // const indicatorReports = Object.entries(indicatorReportDict).map(([uri, indicatorReport]) => {
      //   return GDBIndicatorReportModel(
      //     indicatorReport, {_uri: indicatorReport._uri}
      //   );
      // });
      // await Promise.all(indicatorReports.map(indicatorReport => indicatorReport.save()));
      //
      // const themes = Object.entries(themeDict).map(([uri, theme]) => {
      //   return GDBThemeModel(
      //     theme, {_uri: theme._uri}
      //   );
      // });
      // await Promise.all(themes.map(theme => theme.save()));
      //
      // const impactNorms = Object.entries(impactNormsDict).map(([uri, impactNorms]) => {
      //   return GDBImpactNormsModel(
      //     impactNorms, {_uri: uri}
      //   )
      // });
      //
      // await Promise.all(impactNorms.map(impactNorms => impactNorms.save()))
      //
      // const impactReports = Object.entries(impactReportDict).map(([uri, impactReport]) => {
      //   return GDBImpactReportModel(
      //     impactReport, {_uri: impactReport._uri}
      //   );
      // });
      // await Promise.all(impactReports.map(impactReport => impactReport.save()));
      //
      // const stakeholderOutcomes = Object.entries(stakeholderOutcomeDict).map(([uri, stakeholderOutcome]) => {
      //   return GDBStakeholderOutcomeModel(
      //     stakeholderOutcome, {_uri: stakeholderOutcome._uri}
      //   );
      // });
      // await Promise.all(stakeholderOutcomes.map(stakeholderOutcome => stakeholderOutcome.save()));
      //
      // const howMuchImpacts = Object.entries(howMuchImpactDict).map(([uri, howMuchImpact]) => {
      //   if (howMuchImpact.subType === 'impactScale') {
      //     delete howMuchImpact.subType
      //     return GDBImpactScaleModel(
      //       howMuchImpact, {_uri: howMuchImpact._uri}
      //     );
      //   } else {
      //     delete howMuchImpact.subType
      //     return GDBImpactDepthModel(
      //       howMuchImpact, {_uri: howMuchImpact._uri}
      //     );
      //   }
      //
      // });
      // await Promise.all(howMuchImpacts.map(howMuchImpact => howMuchImpact.save()));

      await organization.save();


      await Transaction.commit();
      addTrace(`Completed loading ${fileName}`);
      addMessage(0, 'completedLoading', {fileName}, {});
    } else {
      addTrace(`${error} error(s) found`);
      addTrace(`File failed to upload`);
      addMessage(0, 'errorCounting', {error}, {});
    }

    if (!error) {
      const msg = formatMessage();
      return res.status(200).json({success: true, traceOfUploading: msg});
    } else {
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

module.exports = {fileUploadingHandler,};