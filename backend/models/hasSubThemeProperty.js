const {createGraphDBModel} = require("graphdb-utils");
const {GDBThemeModel} = require("./theme");
const {GDBOrganizationModel} = require("./organization");

const GDBHasSubThemePropertyModel = createGraphDBModel({
  hasParentTheme: {type: GDBThemeModel, internalKey: ':hasParentTheme'},
  hasChildTheme: {type: GDBThemeModel, internalKey: ':hasSubTheme'},
  forOrganization: {type: GDBOrganizationModel, internalKey: 'cids:forOrganization'}
}, {
  rdfTypes: [':hasSubThemeProperty'], name: 'hasSubThemeProperty'
});

module.exports = {
  GDBHasSubThemePropertyModel
}