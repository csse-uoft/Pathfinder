const express = require('express');
const {fetchNodeGraphDataHandler} = require("../services/nodeGraph/nodeGraphData");



const router = express.Router();

router.get('/:classType', fetchNodeGraphDataHandler);
router.post('/', fetchNodeGraphDataHandler);
// router.get('/:organizationUri', fetchIndicatorsHandler);



module.exports = router;