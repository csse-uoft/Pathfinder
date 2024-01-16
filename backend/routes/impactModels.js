const express = require("express");
const {fetchImpactModelsHandler, fetchImpactModelInterfacesHandler} = require("../services/impactStuffs/impactModel");


const router = express.Router();

router.get('/interface/:organizationUri', fetchImpactModelInterfacesHandler)
router.get('/interface/', fetchImpactModelInterfacesHandler)
router.get('/:organizationUri', fetchImpactModelsHandler)
module.exports = router;