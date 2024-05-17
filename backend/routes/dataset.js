const express = require('express');
const {createDatasetHandler, fetchDatasetHandler, updateDatasetHandler, deleteDatasetHandler} = require("../services/dataset/dataset");


const router = express.Router({mergeParams: true});

router.post('/', createDatasetHandler);
router.get('/:uri/', fetchDatasetHandler);
router.put('/:uri/', updateDatasetHandler);
router.delete('/:uri', deleteDatasetHandler);

module.exports = router;