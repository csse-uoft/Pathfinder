const express = require('express');


const {fetchImpactRisksHandler} = require("../services/impactRisk/impactRisk");


const router = express.Router();

router.get('/', fetchImpactRisksHandler);


module.exports = router;