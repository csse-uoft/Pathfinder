const {createImpactModelHandler} = require("../services/impactStuffs/impactModel");
const express = require('express');
const {fetchImpactReportHandler, createImpactReportHandler} = require("../services/impactReport/impactReport");


const router = express.Router();

router.post('/', createImpactModelHandler);

module.exports = router;