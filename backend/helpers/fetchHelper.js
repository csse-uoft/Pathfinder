const {name2Model} = require("./name2Model");
const {GDBImpactModelModel} = require("../models/impactStuffs");




async function fetchDataTypeInterfaces(name, req, res) {
  const {organizationUri} = req.params;
  let objects
  if (organizationUri === 'undefined' || !organizationUri) {
    objects = await name2Model[name].find({});
  } else {
    objects = await name2Model[name].find({organization: organizationUri})
  }

  const interfaces = {}
  objects.map(object => interfaces[object._uri] = object.name || object._uri)
  return res.status(200).json({success: true, interfaces});
}

module.exports = {
  fetchDataTypeInterfaces
}