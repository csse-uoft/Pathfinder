const express = require('express');
const {fetchImpactReportHandler, createImpactReportHandler, updateImpactReportHandler, deleteImpactReportHandler} = require("../services/impactReport/impactReport");


const router = express.Router();

router.get('/:uri', fetchImpactReportHandler);
router.post('/', createImpactReportHandler);
router.put('/:uri', updateImpactReportHandler);
router.delete('/:uri', deleteImpactReportHandler)

module.exports = router;