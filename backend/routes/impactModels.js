const express = require("express");
const {fetchImpactModelsHandler, fetchImpactModelInterfacesHandler, createImpactModelHandler} = require("../services/impactStuffs/impactModel");
const {createImpactReportHandler} = require("../services/impactReport/impactReport");


const router = express.Router();

router.get('/interface/:organizationUri', fetchImpactModelInterfacesHandler)
router.get('/:organizationUri', fetchImpactModelsHandler)
module.exports = router;