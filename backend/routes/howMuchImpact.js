const express = require('express');

const {createHowMuchImpactHandler, fetchHowMuchImpactHandler} = require("../services/howMuchImpact/howMuchImpact");


const router = express.Router({mergeParams: true});

router.post('/', createHowMuchImpactHandler);
router.get('/:uri', fetchHowMuchImpactHandler);

module.exports = router;