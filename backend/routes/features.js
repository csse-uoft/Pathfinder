const express = require('express');
const {fetchFeatureInterfacesHandler} = require("../services/feature/features");



const router = express.Router({mergeParams: true});

router.get('/interface', fetchFeatureInterfacesHandler);

module.exports = router;