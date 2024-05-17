const express = require('express');

const {createHowMuchImpactHandler, fetchHowMuchImpactHandler, updateHowMuchImpactHandler, deleteHowMuchImpactHandler} = require("../services/howMuchImpact/howMuchImpact");


const router = express.Router({mergeParams: true});

router.post('/', createHowMuchImpactHandler);
router.get('/:uri', fetchHowMuchImpactHandler);
router.put('/:uri/', updateHowMuchImpactHandler);
router.delete('/:uri', deleteHowMuchImpactHandler);

module.exports = router;