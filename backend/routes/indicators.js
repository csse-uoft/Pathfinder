const express = require('express');
const {fetchIndicatorsHandler, fetchIndicatorInterfacesHandler} = require("../services/indicators/indicator");



const router = express.Router();

router.get('/', fetchIndicatorsHandler);
router.get('/:organizationUri', fetchIndicatorsHandler);
router.get('/interface/:organizationUri', fetchIndicatorInterfacesHandler)



module.exports = router;