const express = require('express');


const {fetchImpactRisksHandler, fetchImpactRiskInterfacesHandler} = require("../services/impactRisk/impactRisk");


const router = express.Router();

router.get('/interface', fetchImpactRiskInterfacesHandler);
router.get('/', fetchImpactRisksHandler);


module.exports = router;