const express = require('express');
const {createDatasetHandler, fetchDatasetHandler, updateDatasetHandler} = require("../services/dataset/dataset");


const router = express.Router({mergeParams: true});

router.post('/', createDatasetHandler);
router.get('/:uri/', fetchDatasetHandler);
router.put('/:uri/', updateDatasetHandler);

module.exports = router;