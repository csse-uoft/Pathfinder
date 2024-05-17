const express = require('express');
const {createCounterfactualHandler, fetchCounterfactualHandler, updateCounterfactualHandler, deleteCounterfactualHandler} = require("../services/counterfactual/counterfactual");


const router = express.Router({mergeParams: true});

router.post('/', createCounterfactualHandler);
router.get('/:uri/', fetchCounterfactualHandler);
router.put('/:uri/', updateCounterfactualHandler);
router.delete('/:uri', deleteCounterfactualHandler);

module.exports = router;