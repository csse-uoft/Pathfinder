const express = require("express");
const {dataExportHandler} = require("../services/dataExport/dataExport");
const router = express.Router({mergeParams: true});

router.post('/', dataExportHandler);

module.exports = router;