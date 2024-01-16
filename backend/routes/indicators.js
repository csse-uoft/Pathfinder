const express = require('express');
const {fetchIndicatorsHandler, fetchIndicatorInterfacesHandler} = require("../services/indicators/indicator");



const router = express.Router();

router.get('/interface/:organizationUri', fetchIndicatorInterfacesHandler);
router.get('/interface', fetchIndicatorInterfacesHandler);
router.get('/', fetchIndicatorsHandler);
router.get('/:organizationUri', fetchIndicatorsHandler);



module.exports = router;