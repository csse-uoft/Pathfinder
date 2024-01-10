const express = require('express');
const {fetchOutcomesHandler, fetchOutcomesThroughThemeHandler, fetchOutcomeInterfaceHandler} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/interface/organization/:organizationUri', fetchOutcomeInterfaceHandler);
router.get('/interface/theme/:themeUri', fetchOutcomeInterfaceHandler);
router.get('/interface', fetchOutcomeInterfaceHandler);
router.get('/', fetchOutcomesHandler);
router.get('/:organizationUri', fetchOutcomesHandler);
router.get('/theme/:themeUri', fetchOutcomesThroughThemeHandler)



module.exports = router;