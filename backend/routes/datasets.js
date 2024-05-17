const express = require("express");
const {fetchDatasetsHandler, fetchDatasetInterfacesHandler} = require("../services/dataset/datasets");



const router = express.Router({mergeParams: true});
router.get('/interface', fetchDatasetInterfacesHandler)
router.get('/', fetchDatasetsHandler)

module.exports = router;