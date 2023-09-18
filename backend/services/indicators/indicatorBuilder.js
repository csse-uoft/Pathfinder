const {baseLevelConfig} = require("../fileUploading/configs");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {Server400Error} = require("../../utils");
const {GDBMeasureModel} = require("../../models/measure");
const {getObjectValue} = require("../helpers");
const {getFullURI, getPrefixedURI} = require('graphdb-utils').SPARQL;

async function indicatorBuilder(environment, trans, object, organization, impactNorms, error, {
  indicatorDict,
  objectDict
}, {
                                  addMessage,
                                  addTrace,
                                  transSave,
                                  getFullPropertyURI,
                                  getValue,
                                  getListOfValue
                                }, form) {
  let uri = object ? object['@id'] : undefined;
  const mainModel = GDBIndicatorModel;
  let hasError = false;
  const indicator = environment === 'fileUploading' ? indicatorDict[uri] : mainModel({}, {uri: form.uri});
  if (environment !== 'fileUploading') {
    await transSave(trans, indicator);
    uri = indicator._uri;
  }

  const config = baseLevelConfig['indicator'];
  if (indicator) {
    // addTrace(`    Loading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);

    // add the organization to it, and add it to the organization
    if (environment !== 'fileUploading') {
      organization = await GDBOrganizationModel.findOne({_uri: form.organization});
      impactNorms = await GDBImpactNormsModel.findOne({organization: form.organization}) || GDBImpactNormsModel({organization: form.organization});
    }

    indicator.forOrganization = organization._uri;
    if (!impactNorms.indicators)
      impactNorms.indicators = [];
    impactNorms.indicators.push(uri);

    if (!organization.hasIndicators)
      organization.hasIndicators = [];
    organization.hasIndicators.push(uri);


    if ((object && object[getFullPropertyURI(mainModel, 'name')]) || form?.name) {
      indicator.name = environment === 'fileUploading' ? getValue(object, mainModel, 'name') : form.name;
    }
    if (!indicator.name && config["cids:hasName"]) {
      if (config["cids:hasName"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else if (environment === 'interface') {
          throw new Server400Error('Name is mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'name'))
          },
          config["cids:hasName"]
        );
    }

    if ((object && object[getFullPropertyURI(mainModel, 'description')]) || form?.description) {
      indicator.description = environment === 'fileUploading' ? getValue(object, mainModel, 'description') : form.description;
    }

    if (!indicator.description && config["cids:hasDescription"]) {
      if (config["cids:hasDescription"].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else if (environment === 'interface') {
          throw new Server400Error('Description is mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'description'))
          },
          config["cids:hasDescription"]
        );
    }



    // codes
    if ((object && object[getFullPropertyURI(mainModel, 'codes')]) || form?.codes) {
      indicator.codes = environment === 'fileUploading' ? getListOfValue(object, mainModel, 'codes') : form.codes;
    }

    if ((!indicator.codes || !indicator.codes.length) && config['cids:hasCode']) {
      if (config['cids:hasCode'].rejectFile) {
        if (environment === 'fileUploading') {
          error += 1;
          hasError = true;
        } else {
          throw new Server400Error('Codes are mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'codes'))
          },
          config['cids:hasCode']
        );
    }


    // add outcomes
    if (((environment === 'fileUploading' && !object[getFullPropertyURI(mainModel, 'forOutcomes')]) ||
      (environment === 'interface' && (!form.outcomes || !form.outcomes.length)) && config['cids:forOutcome'])
    ) {
      if (config['cids:forOutcome'].rejectFile) {
        if (environment === 'fileUploading') {
          hasError = true;
          error += 1;
        } else {
          throw new Server400Error('outcomes are mandatory');
        }
      }
      if (environment === 'fileUploading')
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'forOutcomes'))
          },
          config['cids:forOutcome']
        );
    } else if ((object && object[getFullPropertyURI(mainModel, 'forOutcomes')]) || form.outcomes) {
      if (!indicator.forOutcomes)
        indicator.forOutcomes = [];
      for (const outcomeURI of environment === 'fileUploading'? getListOfValue(object, mainModel, 'forOutcomes') : form.outcomes) {
        indicator.forOutcomes.push(outcomeURI);
        if (environment === 'interface' || !objectDict[outcomeURI]) {
          // in this case, the outcome is not in the file, get the outcome from database and add indicator to it
          const outcome = await GDBOutcomeModel.findOne({_uri: outcomeURI});
          if (!outcome) {
            if (environment === 'fileUploading') {
              addTrace('        Error: bad reference');
              addTrace(`            Outcome ${outcomeURI} appears neither in the file nor in the sandbox`);
              addMessage(8, 'badReference',
                {uri, referenceURI: outcomeURI, type: 'Outcome'}, {rejectFile: true});
              error += 1;
              hasError = true;
            } else if (environment === 'interface'){
              throw new Server400Error(`The outcome ${outcomeURI} does not exist`);
            }
          } else if (outcome.forOrganization !== organization._uri) {
            // check if the outcome belongs to the organization
            if (environment === 'fileUploading') {
              addTrace('        Error:');
              addTrace(`            Outcome ${outcomeURI} doesn't belong to this organization`);
              addMessage(8, 'subjectDoesNotBelong',
                {uri, type: 'Outcome', subjectURI: outcomeURI}, {rejectFile: true});
              error += 1;
              hasError = true
            } else if (environment === 'interface'){
              throw new Server400Error(`The outcome ${outcomeURI} does not belong to the organization`);
            }
          } else {
            if (!outcome.indicators)
              outcome.indicators = [];
            outcome.indicators.push(uri);
            await transSave(trans, outcome);
          }

        } // if the outcome is in the file or the environment is 'interface', don't have to worry about adding the indicator to the outcome
      }
    }

    // add indicator report, in this case, indicator reports will not be in the form
    if (environment !== 'interface') {
      if (object[getFullPropertyURI(mainModel, 'indicatorReports')]) {
        if (!indicator.indicatorReports)
          indicator.indicatorReports = [];
        getListOfValue(object, mainModel, 'indicatorReports').map(indicatorReportURI => {
          indicator.indicatorReports.push(indicatorReportURI);
        });
      } else if (config['cids:hasIndicatorReport']) {
        if (config['cids:hasIndicatorReport'].rejectFile) {
          error += 1;
          hasError = true;
        }
        addMessage(8, 'propertyMissing',
          {
            uri,
            type: getPrefixedURI(object['@type'][0]),
            property: getPrefixedURI(getFullPropertyURI(mainModel, 'indicatorReports'))
          },
          config['cids:hasIndicatorReport']
        );
      }
    }
    if (hasError) {
      // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
    } else if (environment === 'fileUploading'){
      addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }
  } else {
    // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
  }
  return error;

}

module.exports = {indicatorBuilder};