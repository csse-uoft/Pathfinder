const express = require("express");
const {fetchStakeholderOutcomesHandler} = require("../services/stakeholderOutcome/stakeholderOutcomes");
const {fetchStakeholderOutcomeInterfacesHandler} = require("../services/stakeholderOutcome/stakeholderOutcome");

const router = express.Router();

router.get('/interface/:organizationUri', fetchStakeholderOutcomeInterfacesHandler)
router.get('/interface', fetchStakeholderOutcomeInterfacesHandler)
router.get('/', fetchStakeholderOutcomesHandler);


module.exports = router;