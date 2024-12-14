const {createGraphDBModel} = require("graphdb-utils");
const {GDBOrganizationModel} = require("./organization");
const {GDBIndicatorModel} = require("./indicator");
const {GDBIndicatorReportModel} = require("./indicatorReport");

const GDBHasSubIndicatorPropertyModel = createGraphDBModel({
  hasHeadlineIndicator: {type: GDBIndicatorModel, internalKey: ':hasHeadlineIndicator'},
  hasChildIndicator: {type: GDBIndicatorModel, internalKey: ':hasSubIndicator'},
  forOrganization: {type: GDBOrganizationModel, internalKey: 'cids:forOrganization'}
}, {
  rdfTypes: [':hasSubIndicatorProperty'], name: 'hasSubIndicatorProperty'
});

const GDBIndicatorReportCorrespondenceModel = createGraphDBModel({
  hasHeadlineIndicatorReport: {type: GDBIndicatorReportModel, internalKey: ':hasHeadlineIndicatorReport'},
  hasChildIndicatorReport: {type: GDBIndicatorReportModel, internalKey: ':hasSubIndicatorReport'},
  forOrganization: {type: GDBOrganizationModel, internalKey: 'cids:forOrganization'}
}, {
  rdfTypes: [':indicatorReportCorrespondence'], name: 'indicatorReportCorrespondence'
});

module.exports = {
  GDBHasSubIndicatorPropertyModel, GDBIndicatorReportCorrespondenceModel
}