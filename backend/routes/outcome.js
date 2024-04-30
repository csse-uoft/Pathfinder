const express = require('express');
const {createOutcomeHandler, fetchOutcomeHandler, updateOutcomeHandler,} = require("../services/outcomes/outcome");



const router = express.Router();

router.get('/:uri', fetchOutcomeHandler);
router.post('/', createOutcomeHandler);
router.put('/:uri', updateOutcomeHandler);
router.delete('/:uri', );


module.exports = router;