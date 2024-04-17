const express = require('express');

const {createHowMuchImpactHandler, fetchHowMuchImpactHandler, updateHowMuchImpactHandler} = require("../services/howMuchImpact/howMuchImpact");


const router = express.Router({mergeParams: true});

router.post('/', createHowMuchImpactHandler);
router.get('/:uri', fetchHowMuchImpactHandler);
router.put('/:uri/', updateHowMuchImpactHandler);
module.exports = router;