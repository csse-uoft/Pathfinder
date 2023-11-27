const {Transaction} = require("graphdb-utils");
const {hasAccess} = require("../../helpers/hasAccess");
const {impactRiskBuilder} = require("./impactRiskBuilder");
const {Server400Error} = require("../../utils");
const {GDBImpactRiskModel} = require("../../models/impactRisk");

const RESOURCE = 'ImpactRisk'

const createImpactRiskHandler = async (req, res, next) => {
  try {
    const {form} = req.body;
    await Transaction.beginTransaction();
    if (await hasAccess(req, 'create' + RESOURCE)) {
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
    if (await hasAccess(req, 'fetch' + RESOURCE + 's'))
      return await fetchImpactRisks(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactRisks = async (req, res) => {
  const impactRisks = await GDBImpactRiskModel.find({});
  return res.status(200).json({success: true, impactRisks});
}


const fetchImpactRiskHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + RESOURCE))
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


module.exports = {createImpactRiskHandler, fetchImpactRisksHandler, fetchImpactRiskHandler}