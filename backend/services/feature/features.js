const {GDBCodeModel} = require("../../models/code");
const {GDBFeatureModel} = require("../../models/feature");

const fetchFeatureInterfaces = async (req, res) => {
  const features = await GDBFeatureModel.find({});
  const featuresInterfaces = {}
  features.map(feature => featuresInterfaces[feature._uri] = feature.name || feature._uri)

  return res.status(200).json({success: true, featuresInterfaces});
};

const fetchFeatureInterfacesHandler = async (req, res, next) => {
  try {
    return await fetchFeatureInterfaces(req, res);
  } catch (e) {
    next(e);
  }
};

module.exports = {fetchFeatureInterfacesHandler}