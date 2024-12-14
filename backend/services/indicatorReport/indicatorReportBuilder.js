const configs = require("../fileUploading/configs");
const {assignValue, assignValues,
  assignMeasure, assignTimeInterval, assignInvertValue, assignUnitOfMeasure
} = require("../helpers");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBOrganizationModel} = require("../../models/organization");
const {GDBIndicatorModel} = require("../../models/indicator");
const {SPARQL, GraphDB} = require("graphdb-utils");
const {GDBIndicatorReportCorrespondenceModel} = require("../../models/hasSubIndicatorProperty");
const {getPrefixedURI} = require('graphdb-utils').SPARQL;

async function indicatorReportBuilder(environment, object, organization, error, {
  indicatorDict,
  indicatorReportDict,
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
  const mainModel = GDBIndicatorReportModel;
  // todo: await mainModel.findOne({_uri: uri}) || should be also good for fileUploading mode, there is bugs in graphdb utils
  const mainObject = environment === 'fileUploading' ?  indicatorReportDict[uri] : (form.uri? await mainModel.findOne({_uri: form.uri}): mainModel({}, {uri: form.uri}))  || mainModel({}, {uri: form.uri});
  if (environment === 'interface') {
    await mainObject.save();
    uri = mainObject._uri;
  }
  const config = configs[configLevel].indicatorReport;


  if (mainObject) {

    if (environment === 'interface') {
      organization = await GDBOrganizationModel.findOne({_uri: form.organization});
      // impactNorms = await GDBImpactNormsModel.findOne({organization: form.organization}) || GDBImpactNormsModel({organization: form.organization});
    }

    mainObject.forOrganization = organization._uri;

    // if (!impactNorms.indicatorReports)
    //   impactNorms.indicatorReports = [];
    // impactNorms.indicatorReports = [...impactNorms.indicatorReports, uri];

    // if (environment === 'interface') {
    //   await impactNorms.save();
    // }

    ret = assignValue(environment, config, object, mainModel, mainObject, 'name', 'cids:hasName', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'comment', 'cids:hasComment', addMessage, form, uri, hasError, error);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'datasets', 'dcat:dataset', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    ret = assignValues(environment, config, object, mainModel, mainObject, 'hasAccesss', 'cids:hasAccess', addMessage, form, uri, hasError, error, getListOfValue);
    hasError = ret.hasError;
    error = ret.error;

    if (environment === 'interface') {
      form.value = form.numericalValue;
    }
    ret = await assignMeasure(environment, config, object, mainModel, mainObject, 'value', 'iso21972:value', addMessage, uri, hasError, error, form);
    error = ret.error;
    hasError = ret.hasError;

    ret = await assignTimeInterval(environment, config, object, mainModel, mainObject, addMessage, form, uri, hasError, error);
    error = ret.error
    hasError = ret.hasError

    ret = await assignUnitOfMeasure(environment, config, object, mainModel, mainObject, 'unitOfMeasure', 'iso21972:unit_of_measure', addMessage, uri, hasError, error, form);
    hasError = ret.hasError;
    error = ret.error;

    // add indicator to the indicatorReport

    if (environment === 'interface') {
      form.forIndicator = form.indicator

    }



    ret = await assignInvertValue(environment, config, object, mainModel, mainObject, {
      propertyName: 'forIndicator', internalKey: 'cids:forIndicator'
    }, objectDict, organization, {
      objectModel: GDBIndicatorModel, objectType: 'Indicator', invertProperty: 'indicatorReports', invertPropertyMultiply: true, propertyToOrganization: 'forOrganization'
    }, addMessage, form, uri, hasError, error, getListOfValue);
    // ret = assignValue(environment, config, object, mainModel, mainObject, 'forIndicator', 'cids:forIndicator', addMessage, form, uri, hasError, error);
    error = ret.error;
    hasError = ret.hasError;
    ignore = ret.ignore;

    ret = assignValue(environment, config, object, mainModel, mainObject, 'dateCreated', 'schema:dateCreated', addMessage, form, uri, hasError, error);
    error = ret.error;
    hasError = ret.hasError;
    ignore = ret.ignore;

    if (mainObject.dateCreated) {
      mainObject.dateCreated = new Date(mainObject.dateCreated)
    }

    // add the indicatorReport to indicator if needed
    // if (environment === 'interface' || (!ignore && !indicatorDict[mainObject.forIndicator])) {
    //   // the indicator is not in the file, fetch it from the database and add the indicatorReport to it
    //   const indicatorURI = mainObject.forIndicator;
    //   const indicator = await GDBIndicatorModel.findOne({_uri: indicatorURI});
    //   if (!indicator) {
    //     if (environment === 'fileUploading'){
    //       addTrace('        Error: bad reference');
    //       addTrace(`            Indicator ${indicatorURI} appears neither in the file nor in the sandbox`);
    //       addMessage(8, 'badReference',
    //         {uri, referenceURI: indicatorURI, type: 'Indicator'}, {rejectFile: true});
    //       error += 1;
    //       hasError = true;
    //     } else if (environment === 'interface') {
    //       throw new Server400Error('No such Indicator');
    //     }
    //   } else if (indicator.forOrganization !== organization._uri) {
    //     if (environment === 'fileUploading') {
    //       addTrace('        Error:');
    //       addTrace(`            Indicator ${indicatorURI} doesn't belong to this organization`);
    //       addMessage(8, 'subjectDoesNotBelong',
    //         {uri, type: 'Indicator', subjectURI: indicatorURI}, {rejectFile: true});
    //       error += 1;
    //       hasError = true;
    //     } else if (environment === 'interface'){
    //       throw new Server400Error('The indicator is not under the organization');
    //     }
    //   } else {
    //     if (!indicator.indicatorReports) {
    //       indicator.indicatorReports = [];
    //     }
    //     indicator.indicatorReports = [...indicator.indicatorReports, uri];
    //     await indicator.save();
    //   }
    // }

    // add the timeInterval to indicator report
    // todo: add form to it
    // if (environment === 'fileUploading' && object[getFullPropertyURI(mainModel, 'hasTime')]) {
    //   mainObject.hasTime = getValue(object, mainModel, 'hasTime') ||
    //     GDBDateTimeIntervalModel({
    //       hasBeginning: getValue(object[getFullPropertyURI(mainModel, 'hasTime')][0],
    //           GDBDateTimeIntervalModel, 'hasBeginning') ||
    //         GDBInstant({
    //           date: new Date(getValue(object[getFullPropertyURI(mainModel, 'hasTime')][0]
    //             [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0], GDBInstant, 'date'))
    //         }, {
    //           uri: getFullObjectURI(
    //             object[getFullPropertyURI(mainModel, 'hasTime')][0]
    //               [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasBeginning')][0]
    //           )
    //         }),
    //
    //       hasEnd: getValue(object[getFullPropertyURI(mainModel, 'hasTime')][0],
    //           GDBDateTimeIntervalModel, 'hasEnd') ||
    //         GDBInstant({
    //           date: new Date(getValue(object[getFullPropertyURI(mainModel, 'hasTime')][0]
    //             [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0], GDBInstant, 'date'))
    //         }, {
    //           uri: getFullObjectURI(
    //             object[getFullPropertyURI(mainModel, 'hasTime')][0]
    //               [getFullPropertyURI(GDBDateTimeIntervalModel, 'hasEnd')][0]
    //           )
    //         })
    //     }, {uri: getFullObjectURI(object[getFullPropertyURI(mainModel, 'hasTime')])})
    // }

    if (environment === 'interface') {
      // if (form.startTime && form.endTime)
      //   mainObject.hasTime =  GDBDateTimeIntervalModel({
      //     hasBeginning: {date: new Date(form.startTime)},
      //     hasEnd: {date: new Date(form.endTime)}
      //   })

      //check if the indicator report's indicator have headlineIndicator
      const headlineIndicatorUris = await haveHeadlineIndicators(uri)
      if (headlineIndicatorUris.length) {
        // does the indicatorReport have corresponding headline indicator reports
        const correspondingHeadlineIndicatorReports = await haveHeadlineIndicatorReports(uri)
        if (correspondingHeadlineIndicatorReports.length) {
          // if yes, means that the indicator report was defined before, modify the value of them
          for (let headlineIndicatorReportUri of correspondingHeadlineIndicatorReports) {
            const headlineIndicatorReport = await GDBIndicatorReportModel.findOne({_uri: headlineIndicatorReportUri}, {populates: ['value']});
            headlineIndicatorReport.value.numericalValue = form.value
            await headlineIndicatorReport.save()
          }
        } else {
          // if no, means that the indicator report is newly added, create one for each of its headline Indicators, and have correspondence for all of them
          for (let headlineIndicatorUri of headlineIndicatorUris) {
            const headlineIndicator = await GDBIndicatorModel.findOne({_uri: headlineIndicatorUri}, {populates: ['unitOfMeasure']})
            const newIndicatorReport = GDBIndicatorReportModel({
              forIndicator: headlineIndicatorUri,
              forOrganization: headlineIndicator.forOrganization,
              value: {numericalValue: form.value},
              unitOfMeasure: {label: headlineIndicator.unitOfMeasure.label}
            })
            if (!headlineIndicator.indicatorReports?.length) {
              headlineIndicator.indicatorReports = []
            }
            await newIndicatorReport.save()
            await GDBIndicatorReportCorrespondenceModel({
              hasHeadlineIndicatorReport: newIndicatorReport._uri,
              hasChildIndicatorReport: uri,
              // forOrganization:
            }).save()
            headlineIndicator.indicatorReports = [...headlineIndicator.indicatorReports, newIndicatorReport._uri]
            await headlineIndicator.save()
          }
        }



      }
      await mainObject.save();
      return true
    }


    if (!ignore && !hasError && environment === 'fileUploading') {
      // addTrace(`    Finished reading ${uri} of type ${getPrefixedURI(object['@type'][0])}...`);
      addMessage(4, 'finishedReading',
        {uri, type: getPrefixedURI(object['@type'][0])}, {});
    }
  } else {
    // addTrace(`Fail to upload ${uri} of type ${getPrefixedURI(object['@type'][0])}`);
  }
  return error;

}

async function haveHeadlineIndicators(indicatorReportUri) {
  let query = `${SPARQL.getSPARQLPrefixes()} 
 SELECT DISTINCT ?headlineIndicator WHERE {
    ?subIndicatorProperty rdf:type :hasSubIndicatorProperty .
    ?subIndicatorProperty :hasHeadlineIndicator ?headlineIndicator .
  ?subIndicatorProperty :hasSubIndicator ?subIndicator .
    ?subIndicator cids:hasIndicatorReport <${indicatorReportUri}> .
    ?headlineIndicator :reportGenerator "auto" .
}`;
  const headlineIndicators = []
  await GraphDB.sendSelectQuery(query, false, ({headlineIndicator}) => {
    headlineIndicators.push(headlineIndicator.id)
  });
  return headlineIndicators
}

async function haveHeadlineIndicatorReports(indicatorReportUri) {
  let query = `${SPARQL.getSPARQLPrefixes()} 
   SELECT ?headlineIndicatorReport WHERE {
    ?indicatorReportCorrespondence rdf:type cidsrep:indicatorReportCorrespondence .
    ?indicatorReportCorrespondence cidsrep:hasHeadlineIndicatorReport ?headlineIndicatorReport .
  	?indicatorReportCorrespondence cidsrep:hasSubIndicatorReport <${indicatorReportUri}> .
}`;
  const headlineIndicatorReports = []
  await GraphDB.sendSelectQuery(query, false, ({headlineIndicatorReport}) => {
    headlineIndicatorReports.push(headlineIndicatorReport.id)
  });
  return headlineIndicatorReports
}



module.exports = {indicatorReportBuilder}