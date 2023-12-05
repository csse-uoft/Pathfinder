const {name2Model} = require("./name2Model");




async function fetchDataTypeInterfaces(name, res) {
  const objects = await name2Model[name].find({});
  const interfaces = {}
  objects.map(object => interfaces[object._uri] = object.name || object._uri)
  return res.status(200).json({success: true, interfaces});
}

module.exports = {
  fetchDataTypeInterfaces
}