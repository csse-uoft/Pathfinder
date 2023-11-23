const express = require('express');
const {createCounterfactualHandler, fetchCounterfactualHandler} = require("../services/counterfactual/counterfactual");


const router = express.Router({mergeParams: true});

router.post('/', createCounterfactualHandler);
router.get('/:uri/', fetchCounterfactualHandler);
// router.put('/:uri/', updateCodeHandler);

module.exports = router;