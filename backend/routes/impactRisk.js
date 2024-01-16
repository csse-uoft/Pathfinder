const express = require('express');
const {createImpactRiskHandler, fetchImpactRiskHandler} = require("../services/impactRisk/impactRisk");



const router = express.Router();

router.get('/:uri', fetchImpactRiskHandler);
router.post('/', createImpactRiskHandler);
// router.put('/:uri', updateIndicatorReportHandler);


module.exports = router;