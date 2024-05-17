const express = require("express");
const {fetchHowMuchImpactsHandler, fetchHowMuchImpactInterfaceHandler} = require("../services/howMuchImpact/howMuchImpact");



const router = express.Router();

router.get('/interface/', fetchHowMuchImpactInterfaceHandler)
router.get('/:subType', fetchHowMuchImpactsHandler)
module.exports = router;