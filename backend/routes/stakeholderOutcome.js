const express = require('express');

const {fetchStakeholderOutcomesThroughStakeholderHandler, fetchStakeholderOutcomeHandler, fetchStakeholderOutcomesThroughOrganizationHandler,
  createStakeholderOutcomeHandler,
  updateStakeholderOutcomeHandler
} = require("../services/stakeholderOutcome/stakeholderOutcome");

const router = express.Router();

router.post('/', createStakeholderOutcomeHandler);
router.get('/organization/:organizationUri', fetchStakeholderOutcomesThroughOrganizationHandler);
router.get('/stakeholder/:stakeholderUri', fetchStakeholderOutcomesThroughStakeholderHandler);
router.get('/:uri', fetchStakeholderOutcomeHandler);
router.put('/:uri', updateStakeholderOutcomeHandler);

module.exports = router;