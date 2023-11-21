const express = require('express');
const {createImpactRiskHandler} = require("../services/impactRisk/impactRisk");



const router = express.Router();

// router.get('/:uri', fetchImpactReportHandler);
router.post('/', createImpactRiskHandler);
// router.put('/:uri', updateIndicatorReportHandler);


module.exports = router;