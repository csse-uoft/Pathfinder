const {createImpactModelHandler, fetchImpactModelHandler, updateImpactModelHandler} = require("../services/impactStuffs/impactModel");
const express = require('express');


const router = express.Router();

router.post('/', createImpactModelHandler);
router.get('/:uri', fetchImpactModelHandler);
router.put('/:uri', updateImpactModelHandler)
module.exports = router;