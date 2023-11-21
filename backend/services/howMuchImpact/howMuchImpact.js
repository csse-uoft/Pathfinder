const {hasAccess} = require("../../helpers/hasAccess");
const {GDBHowMuchImpactModel, GDBImpactScaleModel, GDBImpactDepthModel, GDBImpactDurationModel} = require("../../models/howMuchImpact");
const {Server400Error} = require("../../utils");

const HowMuchImpactModelDict = {
  HowMuchImpact: GDBHowMuchImpactModel,
  ImpactScale: GDBImpactScaleModel,
  ImpactDepth: GDBImpactDepthModel,
  ImpactDuration: GDBImpactDurationModel
}

const RESOURCE = 'HowMuchImpact';

const fetchHowMuchImpactsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE + 's'))
      return await fetchHowMuchImpacts(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchHowMuchImpacts = async (req, res) => {
  const {subType} = req.params;
  let howMuchImpacts = [];
  if (!subType) {
    howMuchImpacts = await GDBHowMuchImpactModel.find({});
  } else if (HowMuchImpactModelDict[subType]){
    howMuchImpacts = await HowMuchImpactModelDict[subType].find({});
  } else {
    throw new Server400Error('No Such subType');
  }
  return res.status(200).json({success: 200, howMuchImpacts: howMuchImpacts});
}


module.exports = {
  fetchHowMuchImpactsHandler
}