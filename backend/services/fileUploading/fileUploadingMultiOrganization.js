const {getFullTypeURIList, getValue} = require("../helpers");
const {GDBOrganizationModel} = require("../../models/organization");
const {isValidURL} = require("../../helpers/validator");
const {GDBOutcomeModel} = require("../../models/outcome");
const {GDBDateTimeIntervalModel} = require("../../models/time");
const {GDBImpactRiskModel} = require("../../models/impactRisk");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");
const {GDBIndicatorModel} = require("../../models/indicator");
const {GDBIndicatorReportModel} = require("../../models/indicatorReport");
const {GDBImpactReportModel} = require("../../models/impactReport");

const splitDataByOrganization = (expandedObjects, organizationsUris, {addTrace, addMessage}) => {
  const splittedObjects = {global: []};
  organizationsUris.map(organizationsUri => splittedObjects[organizationsUri] = []);
  for (let object of expandedObjects) {
    // categorize objects
    const uri = object['@id'];
    let organizationUri;
    if (!uri || !isValidURL(uri)) {
      // in the case there is no URI, or not a valid uri, skip the object
      continue;
    }
    if (object['@type'].includes(getFullTypeURIList(GDBOutcomeModel)[1])) {
       organizationUri = getValue(object, GDBOutcomeModel, 'forOrganization');
    } else if(object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[2]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[1]) || object['@type'].includes(getFullTypeURIList(GDBImpactNormsModel)[0])) {
      organizationUri = getValue(object, GDBImpactNormsModel, 'organization');
    } else if(object['@type'].includes(getFullTypeURIList(GDBIndicatorModel)[1])) {
      organizationUri = getValue(object, GDBIndicatorModel, 'forOrganization');
    } else if(object['@type'].includes(getFullTypeURIList(GDBIndicatorReportModel)[1])) {
      organizationUri = getValue(object, GDBIndicatorReportModel, 'forOrganization');
    } else if(object['@type'].includes(getFullTypeURIList(GDBImpactReportModel)[1])) {
      organizationUri = getValue(object, GDBImpactReportModel, 'forOrganization');
    } else if (object['@type'].includes(getFullTypeURIList(GDBOrganizationModel)[1])){
      organizationUri = uri;
    }else {
      splittedObjects['global'] = [...splittedObjects['global'], object];
    }
    if (organizationUri)
      splittedObjects[organizationUri] = [...splittedObjects[organizationUri], object];
  }
  return splittedObjects
}

module.exports = {splitDataByOrganization}