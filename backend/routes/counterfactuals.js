const express = require('express');
const {fetchCounterfactualsHandler, fetchCounterfactualInterfacesHandler} = require("../services/counterfactual/counterfactuals");



const router = express.Router({mergeParams: true});

router.get('/interface', fetchCounterfactualInterfacesHandler);
router.get('/', fetchCounterfactualsHandler);

module.exports = router;