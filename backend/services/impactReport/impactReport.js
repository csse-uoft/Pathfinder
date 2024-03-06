const {hasAccess} = require("../../helpers/hasAccess");
const {Server400Error} = require("../../utils");
const {GDBImpactReportModel} = require("../../models/impactReport");
const {Transaction} = require("graphdb-utils");
const {impactReportBuilder} = require("./impactReportBuilder");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {fetchDataTypeInterfaces} = require("../../helpers/fetchHelper");
const {themeBuilder} = require("../theme/themeBuilder");


const resource = 'ImpactReport';

const updateImpactReportHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateImpactReport'))
      return await updateImpactReport(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
}

const updateImpactReport = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  await Transaction.beginTransaction();
  form.uri = uri;
  if (await impactReportBuilder('interface', null,null,null, {}, {}, form)) {
    await Transaction.commit();
    return res.status(200).json({success: true});
  }
};

const createImpactReportHandler = async (req, res, next) => {
  try {
    const {form} = req.body;
    await Transaction.beginTransaction();
    if (await hasAccess(req, 'create' + resource)) {
      if (await impactReportBuilder('interface',null, null, null, {}, {}, form)){
        await Transaction.commit();
        return res.status(200).json({success: true})
      }
    }
  } catch (e) {
    if (Transaction.isActive())
      await Transaction.rollback();
    next(e);
  }
}

const fetchImpactReportHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + resource))
      return await fetchImpactReport(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactReportsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + resource + 's'))
      return await fetchImpactReports(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactReportInterfacesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetch' + resource + 's'))
      return await fetchDataTypeInterfaces(resource, req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchImpactReports = async (req, res) => {
  const {orgUri} = req.params;
  if (!orgUri)
    throw new Server400Error('Organization URI is missing');
  let impactReports
  if (orgUri === 'all') {
    impactReports = await GDBImpactReportModel.find({}, {populates: ['forStakeholderOutcome']});
  } else {
    impactReports = await GDBImpactReportModel.find({forOrganization: orgUri}, {populates: ['forStakeholderOutcome', 'hasTime.hasBeginning', 'hasTime.hasEnd']});
  }
  const userAccount = await GDBUserAccountModel.findOne({_uri: req.session._uri});
  return res.status(200).json({success: true, impactReports, editable: userAccount.isSuperuser});
};

const fetchImpactReport = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('URI is missing');
  const impactReport = await GDBImpactReportModel.findOne({_uri: uri}, {populates: ['forStakeholderOutcome', 'hasTime.hasBeginning', 'hasTime.hasEnd']});
  if (!impactReport)
    throw new Server400Error('No such impact Report');
  return res.status(200).json({success: true, impactReport});
};

module.exports = {fetchImpactReportHandler, fetchImpactReportsHandler, fetchImpactReportInterfacesHandler, createImpactReportHandler, updateImpactReportHandler};