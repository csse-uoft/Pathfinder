const express = require('express');
const {fetchNodeGraphDataHandler} = require("../services/nodeGraph/nodeGraphData");



const router = express.Router();

router.get('/', fetchNodeGraphDataHandler);
router.post('/', fetchNodeGraphDataHandler);
// router.get('/', fetchIndicatorsHandler);
// router.get('/:organizationUri', fetchIndicatorsHandler);



module.exports = router;