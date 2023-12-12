const express = require('express');
const {fetchStakeholdersHandler} = require("../services/stakeholder/stakeholders");
const {fetchStakeholderInterfaceHandler} = require("../services/stakeholder/stakeholder");

const router = express.Router({mergeParams: true});

router.get('/', fetchStakeholdersHandler);
router.get('/interface', fetchStakeholderInterfaceHandler);

module.exports = router;