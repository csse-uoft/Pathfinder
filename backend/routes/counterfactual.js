const express = require('express');
const {createCounterfactualHandler} = require("../services/counterfactual/counterfactual");


const router = express.Router({mergeParams: true});

router.post('/', createCounterfactualHandler);
// router.get('/:uri/', fetchCodeHandler);
// router.put('/:uri/', updateCodeHandler);

module.exports = router;