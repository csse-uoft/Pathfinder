const express = require('express');

const {fetchIndicatorHandler, createIndicatorHandler, updateIndicatorHandler, deleteIndicatorHandler} = require("../services/indicators/indicator");




const router = express.Router();

router.get('/:uri', fetchIndicatorHandler);
router.post('/', createIndicatorHandler)
router.put('/:uri', updateIndicatorHandler)
router.delete('/:uri', deleteIndicatorHandler);

module.exports = router;