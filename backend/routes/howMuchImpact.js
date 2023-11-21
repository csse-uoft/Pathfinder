const express = require('express');

const {createHowMuchImpactHandler} = require("../services/howMuchImpact/howMuchImpact");


const router = express.Router({mergeParams: true});

router.post('/', createHowMuchImpactHandler);

module.exports = router;