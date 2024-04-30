const express = require('express');
const {createOutcomeHandler, fetchOutcomeHandler, updateOutcomeHandler, deleteOutcomeHandler} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/:uri', fetchOutcomeHandler);
router.post('/', createOutcomeHandler);
router.put('/:uri', updateOutcomeHandler);
router.delete('/:uri', deleteOutcomeHandler);


module.exports = router;