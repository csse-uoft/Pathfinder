const {hasAccess} = require("../../helpers/hasAccess");
const {GDBHowMuchImpactModel, GDBImpactScaleModel, GDBImpactDepthModel, GDBImpactDurationModel} = require("../../models/howMuchImpact");
const {Server400Error} = require("../../utils");
const {Transaction} = require("graphdb-utils");
const {impactRiskBuilder} = require("../impactRisk/impactRiskBuilder");
const {howMuchImpactBuilder} = require("./howMuchImpactBuilder");
const {GDBCounterfactualModel} = require("../../models/counterfactual");

const HowMuchImpactModelDict = {
  HowMuchImpact: GDBHowMuchImpactModel,
  ImpactScale: GDBImpactScaleModel,
  ImpactDepth: GDBImpactDepthModel,
  ImpactDuration: GDBImpactDurationModel
}

const RESOURCE = 'HowMuchImpact';

const fetchHowMuchImpactHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE))
      return await fetchHowMuchImpact(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchHowMuchImpact = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw Server400Error('A howMuchImpact is needed');
  const howMuchImpact = await GDBHowMuchImpactModel.findOne({_uri: uri}, {populates: ['hasTime', 'value']});
  if (!howMuchImpact)
    throw Server400Error('No such code');
  howMuchImpact.startTime = howMuchImpact.hasTime?.startTime;
  howMuchImpact.endTime = howMuchImpact.hasTime?.endTime;
  howMuchImpact.value = howMuchImpact.value.numericalValue;
  return res.status(200).json({success: true, howMuchImpact});
}


const createHowMuchImpactHandler = async (req, res, next) => {
  try {
    const {form} = req.body;
    await Transaction.beginTransaction();
    if (await hasAccess(req, 'create' + RESOURCE)) {
      if (await howMuchImpactBuilder('interface', form.subtype
        , null, null, null,{}, {}, form)){
        await Transaction.commit();
        return res.status(200).json({success: true})
      }
    } else {
      throw new Server400Error('Wrong Auth')
    }
  } catch (e) {
    if (Transaction.isActive())
      await Transaction.rollback();
    next(e);
  }
}

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
  if (!subType || subType === 'undefined') {
    howMuchImpacts = await GDBHowMuchImpactModel.find({});
  } else if (HowMuchImpactModelDict[subType]) {
    howMuchImpacts = await HowMuchImpactModelDict[subType].find({});
  } else {
    throw new Server400Error('No Such subType');
  }
  return res.status(200).json({success: 200, howMuchImpacts: howMuchImpacts});
}


module.exports = {
  fetchHowMuchImpactsHandler, createHowMuchImpactHandler, fetchHowMuchImpactHandler
}