const express = require('express');
const {fetchCounterfactualsHandler} = require("../services/counterfactual/counterfactuals");



const router = express.Router({mergeParams: true});

router.get('/', fetchCounterfactualsHandler);

module.exports = router;