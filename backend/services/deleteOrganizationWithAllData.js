const {GDBIndicatorModel} = require("../models/indicator");
const {GDBOutcomeModel} = require("../models/outcome");
const {GDBCharacteristicModel} = require("../models/characteristic");
const {GDBOrganizationModel} = require("../models/organization");
const {GDBUserAccountModel} = require("../models/userAccount");
const {GDBIndicatorReportModel} = require("../models/indicatorReport");
const {GDBStakeholderOutcomeModel} = require("../models/stakeholderOutcome");
const {GDBImpactNormsModel} = require("../models/impactStuffs");
const {GDBImpactReportModel} = require("../models/impactReport");
const {Server400Error} = require("../utils");

async function deleteOrganizationWithAllData(organization, keepOrg) {
  if (!organization) {
    throw new Server400Error('Organization is not given');
  }
  // have a dict to store all information
  const objectDict = {};

  function storeItem(item, model) {
    objectDict[item._uri || item] = model;
  }

  // the function have to be used under Promise.all()
  async function fetchItems(uris, gdbType) {
    if (!Array.isArray(uris) || uris.length === 0) {
      return [];
    }
    return uris?.map(uriOrItem => {
      if (!uriOrItem) {
        return null;
      }
      if (!(typeof uriOrItem === 'string')) {
        // then it is an item
        return uriOrItem;
      } else {
        // then it is an uri
        return gdbType.findOne({_uri: uriOrItem});
      }
    });

  }

  if (!keepOrg) {
    storeItem(organization, GDBOrganizationModel);
  } else {
    // organization.hasIndicators = [];
    // organization.hasOutcomes = [];
    // organization.impactModels = [];
    // organization.characteristics = [];
  }


  // cache users, securityQuestions will be deleted with them
  organization.hasUsers?.map(user => {
    storeItem(user, GDBUserAccountModel);
  });


  // cache indicators and indicatorReports
  const indicators = (await Promise.all(await fetchItems(organization.hasIndicators, GDBIndicatorModel)));
  indicators.map(indicator => {
    storeItem(indicator, GDBIndicatorModel);
    indicator.indicatorReports?.map(indicatorReportUri => {
      storeItem(indicatorReportUri, GDBIndicatorReportModel);
    });
    // if (indicator.baseLine)
    //   storeItem(indicator.baseLine, GDBMeasureModel);
    // if (indicator.threshold)
    //   storeItem(indicator.threshold, GDBMeasureModel);
  });

  // cache outcomes
  const outcomes = (await Promise.all(await fetchItems(organization.hasOutcomes, GDBOutcomeModel)));
  outcomes.map(outcome => {
    storeItem(outcome, GDBOutcomeModel);
    outcome.stakeholderOutcomes?.map(stakeholderOutcomeUri => {
      storeItem(stakeholderOutcomeUri, GDBStakeholderOutcomeModel);
    });
  });

  // cache characteristic
  (await Promise.all(await fetchItems(organization.characteristics, GDBCharacteristicModel))).map(characteristic => {
    storeItem(characteristic, GDBCharacteristicModel);
  });

  // cache impactNorms
  (await Promise.all(await fetchItems(organization.impactModels, GDBImpactNormsModel))).map(impactNorm => {
    storeItem(impactNorm, GDBImpactNormsModel);
    impactNorm.impactReports?.map(impactReportUri => {
      storeItem(impactReportUri, GDBImpactReportModel);
    });
  });

  // await Transaction.beginTransaction();

  await organization.save();

  for (let uri in objectDict) {
    await objectDict[uri].findOneAndDelete({_uri: uri});
  }

  organization.hasIndicators = [];
  organization.hasOutcomes = [];
  organization.impactModels = [];
  organization.characteristics = [];
  await organization.save();
  return true;

}

module.exports = {deleteOrganizationWithAllData};