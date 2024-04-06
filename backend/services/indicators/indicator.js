const {GDBOrganizationModel} = require("../../models/organization");
const {hasAccess} = require("../../helpers/hasAccess");
const {GDBIndicatorModel} = require("../../models/indicator");
const {Server400Error} = require("../../utils");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {allReachableOrganizations, addObjectToList} = require("../../helpers");
const {GDBUnitOfMeasure} = require("../../models/measure");
const {indicatorBuilder} = require("./indicatorBuilder");
const {Transaction} = require("graphdb-utils");
const {fetchDataTypeInterfaces} = require("../../helpers/fetchHelper");
const {configLevel} = require('../../config');


const fetchIndicators = async (req, res) => {

  const userAccount = await GDBUserAccountModel.findOne({_uri: req.session._uri});
  const {organizationUri} = req.params;
  if (!organizationUri || organizationUri === 'all') {
    // the organizationId is not given, return all indicators which is reachable by the user

    if (userAccount.isSuperuser) {
      // simple return all indicators to him
      const indicators = await GDBIndicatorModel.find({},
        {populates: ['unitOfMeasure','baseline', 'threshold', 'datasets', 'codes']});
      indicators.map(indicator => indicator.editable = true);
      return res.status(200).json({success: true, indicators});
    }
    // take all reachable organizations
    const reachableOrganizations = await allReachableOrganizations(userAccount);
    const indicatorURIs = [];
    // fetch all available indicatorURIs from reachableOrganizations
    const editableIndicatorURIs = [];
    reachableOrganizations.map(organization => {
      if (organization.hasIndicators)
        organization.hasIndicators.map(indicatorURI => {
          if (addObjectToList(indicatorURIs, indicatorURI)) {
            // if the indicator is actually added
            if (organization.editors.includes(userAccount._uri)) {
              // and if the userAccount is one of the editor of the organization
              // the indicator will be marked
              editableIndicatorURIs.push(indicatorURI);
            }
          }
        });
    });
    // replace indicatorURIs to actual indicator objects
    const indicators = await Promise.all(indicatorURIs.map(indicatorURI => {
      return GDBIndicatorModel.findOne({_uri: indicatorURI}, {populates: ['unitOfMeasure', 'baseline']});
    }));
    // for all indicators, if its id in editableIndicatorIDs, then it is editable
    indicators.map(indicator => {
      if (editableIndicatorURIs.includes(indicator._uri))
        indicator.editable = true;
    });
    return res.status(200).json({success: true, indicators});
  } else {
    // the organizationUri is given, return all indicators belongs to the organization
    const organization = await GDBOrganizationModel.findOne({_uri: organizationUri},
      {
        populates: ['hasIndicators.unitOfMeasure', 'hasIndicators.baseline']
      }
      );
    if (!organization)
      throw new Server400Error('No such organization');
    if (!organization.hasIndicators)
      return res.status(200).json({success: true, indicators: []});
    let editable;
    if (userAccount.isSuperuser || organization.editors?.includes(userAccount._uri)) {
      editable = true;
      organization.hasIndicators.map(indicator => {
        indicator.editable = true;
      });
    }
    return res.status(200).json({success: true, indicators: organization.hasIndicators, editable});
  }


};

const fetchIndicatorsHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchIndicators'))
      return await fetchIndicators(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchIndicatorHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchIndicator'))
      return await fetchIndicator(req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    next(e);
  }
};

const fetchIndicatorInterfacesHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchIndicatorInterfaces'))
      return await fetchDataTypeInterfaces('Indicator', req, res);
    return res.status(400).json({success: false, message: 'Wrong auth'});
  } catch (e) {
    next(e);
  }
};

const fetchIndicatorInterfaces = async (req, res) => {
  const {organizationUri} = req.params;
  let indicators
  if (organizationUri === 'undefined' || !organizationUri) {
    // return all indicator Interfaces
    indicators = await GDBIndicatorModel.find({});
  } else {
    // return outcomes based on their organization
    indicators = await GDBIndicatorModel.find({forOrganization: organizationUri})
  }

  const indicatorInterfaces = {};
  indicators.map(indicator => {
    indicatorInterfaces[indicator._uri] = indicator.name;
  });
  return res.status(200).json({success: true, indicatorInterfaces});

}

const fetchIndicator = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('Id is not given');
  const indicator = await GDBIndicatorModel.findOne({_uri: uri}, {populates: ['unitOfMeasure', 'baseline', 'threshold']});
  if (!indicator) {
    throw new Server400Error('No Such Indicator')
  }
  indicator.unitOfMeasure = indicator.unitOfMeasure?.label;
  indicator.baseline = indicator.baseline?.numericalValue;
  indicator.threshold = indicator.threshold?.numericalValue;
  if (!indicator)
    throw new Server400Error('No such indicator');
  indicator.forOrganization = await GDBOrganizationModel.findOne({_uri: indicator.forOrganization})
  // indicator.forOrganizations = await Promise.all(indicator.forOrganizations.map(orgURI => {
  //   return GDBOrganizationModel.findOne({_uri: orgURI});
  // }));
  indicator.organization = indicator.forOrganization._uri
  indicator.organizationName = indicator.forOrganization.legalName;
  // indicator.forOrganizations.map(organization => {
  //   indicator.organizations[organization._id] = organization.legalName;
  // })
  delete indicator.forOrganization;
  return res.status(200).json({success: true, indicator});

};

const createIndicatorHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'createIndicator')){
      const {form} = req.body;
      await Transaction.beginTransaction();
      if (await indicatorBuilder('interface',  null, null, null, {}, {}, form, configLevel)){
        await Transaction.commit();
        return res.status(200).json({success: true})
      }
    }
    return res.status(400).json({success: false, message: 'Wrong auth'});

  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

function cacheOrganization(organization, organizationDict) {
  if (!organizationDict[organization._uri])
    organizationDict[organization._uri] = organization;
}

function cacheListOfOrganizations(organizations, organizationDict) {
  organizations.map(organization => {
    cacheOrganization(organization, organizationDict);
  });
}

const updateIndicator = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  await Transaction.beginTransaction();
  form.uri = uri;
  if (await indicatorBuilder('interface', null, null,null, {}, {}, form, configLevel)) {
    await Transaction.commit();
    return res.status(200).json({success: true});
  }

};

const updateIndicatorHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateIndicator'))
      return await updateIndicator(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

const createIndicator = async (req, res) => {
  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  if (!userAccount)
    throw new Server400Error('Wrong auth');
  const {form} = req.body;
  if (!form || !form.organization || !form.name || !form.description || !form.unitOfMeasure)
    throw new Server400Error('Invalid input');
  form.forOrganization = await  GDBOrganizationModel.findOne({_uri: form.organization}, {populates: ['hasIndicators']})
  // for each organization, does it contain any indicator with same name?
  let duplicate = false;
  let organizationInProblem;
  if (form.organization.hasIndicators) {
    form.organization.hasIndicators.map(indicator => {
      if (indicator.name === form.name) {
        duplicate = true;
        organizationInProblem = form.organization._id;
      }
    });
  }

  if (duplicate && organizationInProblem)
    return res.status(200).json({
      success: false,
      message: 'The name of the indicator has been occupied in organization ' + organizationInProblem
    });

  form.unitOfMeasure = GDBUnitOfMeasure({
    label: form.unitOfMeasure
  });
  const indicator = GDBIndicatorModel({
    name: form.name,
    description: form.description,
    forOrganization: form.forOrganization._uri,
    unitOfMeasure: form.unitOfMeasure
  }, form.uri ? {uri: form.uri} : null);

  await indicator.save();
  if (!form.forOrganization.hasIndicators)
    form.forOrganization.hasIndicators = [];
  form.forOrganization.hasIndicators.push(indicator)
  await form.forOrganization.save()

  // add the indicator to the organizations
  // await Promise.all(indicator.forOrganizations.map(organization => {
  //   if (!organization.hasIndicators)
  //     organization.hasIndicators = [];
  //   organization.hasIndicators.push(indicator);
  //   return organization.save();
  // }));
  // const ownership = GDBOwnershipModel({
  //   resource: indicator,
  //   owner: userAccount,
  //   dateOfCreated: new Date(),
  // });
  // await ownership.save();
  return res.status(200).json({success: true});
};


module.exports = {updateIndicatorHandler, createIndicatorHandler, fetchIndicatorsHandler, fetchIndicatorHandler, fetchIndicatorInterfacesHandler};