const express = require('express');
const {createCharacteristicHandler, fetchCharacteristicHandler, updateCharacteristicHandler} = require("../services/characteristic/characteristic");




const router = express.Router({mergeParams: true});

router.post('/', createCharacteristicHandler);
router.get('/:uri/', fetchCharacteristicHandler);
router.put('/:uri/', updateCharacteristicHandler);
// router.delete('/:uri', null);

module.exports = router;