const express = require('express');
const {fetchImpactReportHandler, createImpactReportHandler, updateImpactReportHandler} = require("../services/impactReport/impactReport");


const router = express.Router();

router.get('/:uri', fetchImpactReportHandler);
router.post('/', createImpactReportHandler);
router.put('/:uri', updateImpactReportHandler);


module.exports = router;