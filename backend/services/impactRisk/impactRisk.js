const {Transaction} = require("graphdb-utils");
const {hasAccess} = require("../../helpers/hasAccess");
const {impactRiskBuilder} = require("./impactRiskBuilder");
const {Server400Error} = require("../../utils");
const {GDBImpactRiskModel} = require("../../models/impactRisk");
const {fetchDatasetInterfacesHandler} = require("../dataset/datasets");
const {outcomeBuilder} = require("../outcomes/outcomeBuilder");

const resource = 'ImpactRisk'

const createImpactRiskHandler = async (req, res, next) => {
  try {
    const {form} = req.body;
    await Transaction.beginTransaction();
    if (await hasAccess(req, 'create' + resource)) {
      if (await impactRiskBuilder('interface', form.hasIdentifier.charAt(0).toLowerCase() + form.hasIdentifier.slice(1)
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

const fetchImpactRisksHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + resource + 's'))
      return await fetchImpactRisks(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactRiskInterfacesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + resource + 's'))
      return await fetchDatasetInterfacesHandler(resource, req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactRisks = async (req, res) => {
  const impactRisks = await GDBImpactRiskModel.find({});
  return res.status(200).json({success: true, impactRisks});
}

const updateImpactRisk = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  await Transaction.beginTransaction();
  form.uri = uri;
  if (await impactRiskBuilder('interface', (form.hasIdentifier.charAt(0).toLowerCase() + form.hasIdentifier.slice(1)).replace(/\s/g, "")
    , null, null, null,{}, {}, form)) {
    await Transaction.commit();
    return res.status(200).json({success: true});
  }
}

const updateImpactRiskHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'update' + resource))
      return await updateImpactRisk(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

const fetchImpactRiskHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + resource))
      return await fetchImpactRisk(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactRisk = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('No such URI');
  const impactRisk = await GDBImpactRiskModel.findOne({_uri: uri});
  if (!impactRisk)
    throw new Server400Error('No such Impact Risk');
  return res.status(200).json({success: true, impactRisk});
}


module.exports = {createImpactRiskHandler, fetchImpactRisksHandler, fetchImpactRiskHandler, fetchImpactRiskInterfacesHandler, updateImpactRiskHandler}