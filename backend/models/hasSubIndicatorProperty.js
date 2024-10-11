const {createGraphDBModel} = require("graphdb-utils");
const {GDBOrganizationModel} = require("./organization");
const {GDBIndicatorModel} = require("./indicator");

const GDBHasSubIndicatorPropertyModel = createGraphDBModel({
  hasHeadlineIndicator: {type: GDBIndicatorModel, internalKey: ':hasHeadlineIndicator'},
  hasChildIndicator: {type: GDBIndicatorModel, internalKey: ':hasSubIndicator'},
  forOrganization: {type: GDBOrganizationModel, internalKey: 'cids:forOrganization'}
}, {
  rdfTypes: [':hasSubIndicatorProperty'], name: 'hasSubIndicatorProperty'
});

module.exports = {
  GDBHasSubIndicatorPropertyModel
}