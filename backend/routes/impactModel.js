const {createImpactModelHandler} = require("../services/impactStuffs/impactModel");
const express = require('express');


const router = express.Router();

router.post('/', createImpactModelHandler);

module.exports = router;