const {name2Model} = require("./name2Model");




async function fetchDataTypeInterfaces(name, req, res) {
  const {organizationUri} = req.params;
  let objects
  if (organizationUri === 'undefined' || !organizationUri) {
    objects = await name2Model[name].find({});
  } else if (organizationUri) {
    if (name === 'IndicatorReport' || name === 'Indicator') {
      objects = await name2Model[name].find({forOrganization: organizationUri})
    } else {
      objects = await name2Model[name].find({organization: organizationUri})
    }
  }

  const interfaces = {}
  objects.map(object => interfaces[object._uri] = object.name || 'Not Given')
  return res.status(200).json({success: true, interfaces});
}

module.exports = {
  fetchDataTypeInterfaces
}