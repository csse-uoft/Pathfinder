const {hasAccess} = require("../../helpers/hasAccess");
const {GDBStakeholderOrganizationModel, GDBOrganizationModel} = require("../../models/organization");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBImpactNormsModel} = require("../../models/impactStuffs");

const fetchStakeholdersHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholders'))
      return await fetchStakeholders(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchStakeholdersUriThroughOrganizationHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholders'))
      return await fetchStakeholdersThroughOrganization(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

async function fetchStakeholdersThroughOrganization(req, res) {
  const userAccount = await GDBUserAccountModel.findOne({_uri: req.session._uri});
  let stakeholders = [];
  if (userAccount.isSuperuser) {
    const {organizationUri} = req.params;
    if (!organizationUri) {
      return res.status(200).json({message: 'Organization URI is not given'});
    }
    const impactNormss = await GDBImpactNormsModel.find({organization: organizationUri}, {});
    if (!impactNormss.length) {
      return res.status(200).json({message: 'The organization has no impactNorms'});
    }

    impactNormss.map(impactNorms => {
      stakeholders = [...stakeholders, ...impactNorms.stakeholders]
    })

    return res.status(200).json({success: true, stakeholders});
  }

}

async function fetchStakeholders(req, res) {
  const userAccount = await GDBUserAccountModel.findOne({_uri: req.session._uri});
  if (userAccount.isSuperuser) {
    const stakeholderOrganizations = await GDBStakeholderOrganizationModel.find({});
    stakeholderOrganizations.map(stakeholder => {
      stakeholder.editable = true;
    })
    const stakeholders = stakeholderOrganizations
    return res.status(200).json({success: true, stakeholders});
  }

}

module.exports = {
  fetchStakeholdersHandler, fetchStakeholdersUriThroughOrganizationHandler
}