const {createImpactModelHandler, fetchImpactModelHandler} = require("../services/impactStuffs/impactModel");
const express = require('express');


const router = express.Router();

router.post('/', createImpactModelHandler);
router.get('/:uri', fetchImpactModelHandler);

module.exports = router;