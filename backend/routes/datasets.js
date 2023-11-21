const express = require("express");
const {fetchDatasetsHandler} = require("../services/dataset/datasets");



const router = express.Router({mergeParams: true});
// router.get('/interface', fetchCodesInterfaceHandler)
router.get('/', fetchDatasetsHandler)

module.exports = router;