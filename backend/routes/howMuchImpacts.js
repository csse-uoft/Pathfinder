const express = require("express");
const {fetchHowMuchImpactsHandler} = require("../services/howMuchImpact/howMuchImpact");



const router = express.Router();

// router.get('/interface/:organizationUri', fetchImpactModelInterfacesHandler)
router.get('/:subType', fetchHowMuchImpactsHandler)
module.exports = router;