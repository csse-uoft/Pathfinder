const express = require('express');
const {createImpactRiskHandler, fetchImpactRiskHandler, updateImpactRiskHandler, deleteImpactRiskHandler} = require("../services/impactRisk/impactRisk");



const router = express.Router();

router.get('/:uri', fetchImpactRiskHandler);
router.post('/', createImpactRiskHandler);
router.put('/:uri', updateImpactRiskHandler);
router.delete('/:uri', deleteImpactRiskHandler);

module.exports = router;