const express = require('express');
const {createCounterfactualHandler, fetchCounterfactualHandler, updateCounterfactualHandler} = require("../services/counterfactual/counterfactual");


const router = express.Router({mergeParams: true});

router.post('/', createCounterfactualHandler);
router.get('/:uri/', fetchCounterfactualHandler);
router.put('/:uri/', updateCounterfactualHandler);

module.exports = router;