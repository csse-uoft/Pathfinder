const express = require('express');
const {fetchStakeholdersHandler, fetchStakeholdersUriThroughOrganizationHandler} = require("../services/stakeholder/stakeholders");
const {fetchStakeholderInterfaceHandler} = require("../services/stakeholder/stakeholder");

const router = express.Router({mergeParams: true});

router.get('/', fetchStakeholdersHandler);
router.get('/organization/:organizationUri', fetchStakeholdersUriThroughOrganizationHandler);
router.get('/interface/:organizationUri', fetchStakeholderInterfaceHandler);
router.get('/interface', fetchStakeholderInterfaceHandler);

module.exports = router;