const {name2Model} = require("./name2Model");
const {GDBImpactModelModel} = require("../models/impactStuffs");




async function fetchDataTypeInterfaces(name, req, res) {
  const {organizationUri, themeUri} = req.params;
  let objects
  if ((organizationUri === 'undefined' || !organizationUri) && (themeUri === 'undefined' || !themeUri)) {
    objects = await name2Model[name].find({});
  } else if (organizationUri) {
    if (name === 'IndicatorReport' || name === 'Indicator') {
      objects = await name2Model[name].find({forOrganization: organizationUri})
    } else {
      objects = await name2Model[name].find({organization: organizationUri})
    }
  } else if (themeUri) {
    objects = name2Model[name].find({});
    objects = objects.filter(object => object.themes.includes(themeUri));
  }

  const interfaces = {}
  objects.map(object => interfaces[object._uri] = object.name || object._uri)
  return res.status(200).json({success: true, interfaces});
}

module.exports = {
  fetchDataTypeInterfaces
}