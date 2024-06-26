const {hasAccess} = require("../../helpers/hasAccess");
const {GDBHowMuchImpactModel, GDBImpactScaleModel, GDBImpactDepthModel, GDBImpactDurationModel} = require("../../models/howMuchImpact");
const {Server400Error} = require("../../utils");
const {Transaction} = require("graphdb-utils");
const {howMuchImpactBuilder} = require("./howMuchImpactBuilder");
const {fetchDataTypeInterfaces} = require("../../helpers/fetchHelper");
const {configLevel} = require('../../config');
const {deleteDataAndAllReferees, checkAllReferees} = require("../helpers");


const HowMuchImpactModelDict = {
  HowMuchImpact: GDBHowMuchImpactModel,
  ImpactScale: GDBImpactScaleModel,
  ImpactDepth: GDBImpactDepthModel,
  ImpactDuration: GDBImpactDurationModel
}

const resource = 'HowMuchImpact';

const fetchHowMuchImpactInterface = async (req, res) => {
  const howMuchImpacts = await GDBHowMuchImpactModel.find({});
  const howMuchImpactInterfaces = {}
  howMuchImpacts.map(howMuchImpact => howMuchImpactInterfaces[howMuchImpact._uri] = howMuchImpact._uri)

  return res.status(200).json({success: true, howMuchImpactInterfaces});
};

const fetchHowMuchImpactInterfaceHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + resource + 's'))
      return await fetchDataTypeInterfaces(resource, req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchHowMuchImpactHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + resource))
      return await fetchHowMuchImpact(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateHowMuchImpactHandler = async (req, res, next) => {
  try {
    const {form} = req.body;
    await Transaction.beginTransaction();
    if (await hasAccess(req, 'update' + resource)) {
      if (await howMuchImpactBuilder('interface', form.subtype
        , null, null, null,{}, {}, form, configLevel)){
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

const fetchHowMuchImpact = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw Server400Error('A howMuchImpact is needed');
  let howMuchImpact;
  // howMuchImpact = await GDBHowMuchImpactModel.findOne({_uri: uri}, {populates: ['hasTime', 'value']})
  if (!howMuchImpact) {
    howMuchImpact = await GDBImpactDurationModel.findOne({_uri: uri}, {populates: ['hasTime.hasBeginning','hasTime.hasEnd', 'value']});
  }
  if (!howMuchImpact) {
    howMuchImpact = await GDBImpactScaleModel.findOne({_uri: uri}, {populates: ['value']});
  }
  if (!howMuchImpact) {
    howMuchImpact = await GDBImpactDepthModel.findOne({_uri: uri}, {populates: ['value']});
  }



  if (!howMuchImpact)
    throw Server400Error('No such code');
  howMuchImpact.startTime = howMuchImpact.hasTime?.hasBeginning?.date;
  howMuchImpact.endTime = howMuchImpact.hasTime?.hasEnd?.date;
  howMuchImpact.value = howMuchImpact.value.numericalValue;
  howMuchImpact.subtype = howMuchImpact.schemaOptions.name.substring(1);
  return res.status(200).json({success: true, howMuchImpact});
}


const createHowMuchImpactHandler = async (req, res, next) => {
  try {
    const {form} = req.body;
    await Transaction.beginTransaction();
    if (await hasAccess(req, 'create' + resource)) {
      if (await howMuchImpactBuilder('interface', form.subtype
        , null, null, null,{}, {}, form, configLevel)){
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
    if (await hasAccess(req, 'fetch' + resource + 's'))
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

const deleteHowMuchImpactHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'delete' + resource))
      return await deleteHowMuchImpact(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const deleteHowMuchImpact = async (req, res) => {
  const {uri} = req.params;
  const {checked} = req.body;
  if (!uri)
    throw new Server400Error('uri is required');

  if (checked) {
    await deleteDataAndAllReferees(uri);
    return res.status(200).json({message: 'Successfully deleted the object and all reference', success: true});
  } else {
    const {mandatoryReferee, regularReferee} = await checkAllReferees(uri, {}, configLevel)
    return res.status(200).json({mandatoryReferee, regularReferee, success: true});
  }
}


module.exports = {
  fetchHowMuchImpactsHandler, createHowMuchImpactHandler, fetchHowMuchImpactHandler, fetchHowMuchImpactInterfaceHandler, updateHowMuchImpactHandler, deleteHowMuchImpactHandler
}