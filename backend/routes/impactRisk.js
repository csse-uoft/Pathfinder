const express = require('express');
const {createImpactRiskHandler, fetchImpactRiskHandler, updateImpactRiskHandler} = require("../services/impactRisk/impactRisk");



const router = express.Router();

router.get('/:uri', fetchImpactRiskHandler);
router.post('/', createImpactRiskHandler);
router.put('/:uri', updateImpactRiskHandler);


module.exports = router;