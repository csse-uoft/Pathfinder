const express = require('express');
const {fetchCharacteristicsHandler, fetchCharacteristicInterfacesHandler} = require("../services/characteristic/characteristics");

const router = express.Router({mergeParams: true});

router.get('/', fetchCharacteristicsHandler)
router.get('/interface', fetchCharacteristicInterfacesHandler)

module.exports = router;