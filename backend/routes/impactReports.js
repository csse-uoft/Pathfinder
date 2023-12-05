const express = require("express");
const {fetchImpactReportsHandler, fetchImpactReportInterfacesHandler} = require("../services/impactReport/impactReport");


const router = express.Router();
router.get('/interface', fetchImpactReportInterfacesHandler)
router.get('/:orgUri', fetchImpactReportsHandler)
module.exports = router;