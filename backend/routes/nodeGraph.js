const express = require('express');
const {fetchNodeGraphDataHandler} = require("../services/nodeGraph/nodeGraphData");



const router = express.Router();

router.get('/', fetchNodeGraphDataHandler);
// router.get('/interface', fetchIndicatorInterfacesHandler);
// router.get('/', fetchIndicatorsHandler);
// router.get('/:organizationUri', fetchIndicatorsHandler);



module.exports = router;