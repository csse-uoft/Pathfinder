const express = require('express');
const {
  fetchIndicatorReportsHandler, fetchIndicatorReportInterfacesHandler
} = require("../services/indicatorReport/indicatorReport");


const router = express.Router();

router.get('/interface/:organizationUri', fetchIndicatorReportInterfacesHandler);
router.get('/interface', fetchIndicatorReportInterfacesHandler);
router.get('/:orgUri', fetchIndicatorReportsHandler);


module.exports = router;