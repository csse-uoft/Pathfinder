const express = require('express');
const {createDatasetHandler} = require("../services/dataset/dataset");


const router = express.Router({mergeParams: true});

router.post('/', createDatasetHandler);
// router.get('/:uri/', fetchCodeHandler);
// router.put('/:uri/', updateCodeHandler);

module.exports = router;