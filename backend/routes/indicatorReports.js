const express = require('express');
const {
  fetchIndicatorReportsHandler, fetchIndicatorReportInterfacesHandler
} = require("../services/indicatorReport/indicatorReport");


const router = express.Router();

router.get('/:orgUri', fetchIndicatorReportsHandler);
router.get('/interfaces/:organizationUri', fetchIndicatorReportInterfacesHandler)


module.exports = router;